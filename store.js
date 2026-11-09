/**
 * store.js - طبقة الحفظ والمزامنة الآمنة للمنصة
 *
 *  - حفظ محلي دائم (localStorage) + نسخ احتياطية متعددة على الجهاز.
 *  - مزامنة سحابية عبر Firebase Firestore (وثيقة لكل مجموعة: totin_state/{name} = { items })
 *
 * الحفظ بالدمج — لا يمسح جهازٌ عملَ جهاز آخر:
 *  1) كل سجل يُتابَع وحده: يُقارن ببصمة آخر نسخة مؤكدة من السحابة، فيُرسَل فقط ما تغيّر.
 *  2) الإرسال معاملة (transaction) تقرأ السحابة ثم تدمج التغييرات سجلاً سجلاً؛
 *     لكل سجل وقت تعديل (_mt) وعند التعارض يفوز التعديل الأحدث.
 *  3) لا حذف نهائي: السجل المحذوف يبقى في السحابة مخفياً (_deleted) ولا يظهر في المنصة.
 *     (عدا السجلات المتجددة كالإشعارات وسجل العمليات: يُبقى أحدثها فقط)
 *  4) ما لم يُرسَل (انقطاع/خطأ) يبقى محفوظاً على الجهاز ويُعاد إرساله تلقائياً،
 *     حتى بعد إغلاق المنصة وفتحها لاحقاً.
 *  5) حماية من الحذف الجماعي لحسابات الطلاب من نسخة قديمة.
 *  6) مؤشر حالة الحفظ: الحدث "totin:sync-status" { state, pending }
 */

window.store = (function () {
  const LS_KEY = "totin_db_v2";
  const BAK_KEY = "totin_bak_v2"; // مصفوفة نسخ احتياطية دوارة
  const SYNC_KEY = "totin_synced_v3"; // بصمات آخر نسخة مؤكدة من السحابة لكل سجل
  const MAX_BAKS = 6;
  const FS_COLLECTION = "totin_state";
  const DOC_SAFE_CHARS = 950000; // حد أمان قبل حد Firestore (1 ميجا للوثيقة)

  const DYNAMIC = [
    "users",
    "groups",
    "schedules",
    "tasks",
    "attendanceRecords",
    "announcements",
    "notifications",
    "registrationRequests",
    "pendingProfileEdits",
    "studentPrograms",
    "studentPaths",
    "excuseRequests",
    "auditLog",
    "taskEvaluations",
    "appSettings",
    "gradeTotals",
    "gradeLog",
    "messages",
    "warnings",
    "contentItems",
    "parents",
    "programs",
    "levels",
  ];

  // مجموعات متجددة: يُبقى أحدث (max) فقط، والحذف منها تقليم وليس حذفاً يُحفظ
  const LOG_MAX = {
    notifications: 500,
    auditLog: 600,
    gradeLog: 1500,
    messages: 1000,
  };

  let fs = null;
  let onChangeCb = null;
  let firstSnapshotHandled = false;

  // ---------------------------------------------------------------
  // محلي
  // ---------------------------------------------------------------
  function loadLocal() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (e) {
      return null;
    }
  }

  function snapshotOfDb() {
    const snap = {};
    DYNAMIC.forEach((c) => {
      snap[c] = Array.isArray(window.db[c]) ? window.db[c] : [];
    });
    return snap;
  }

  function saveLocal() {
    let snap;
    let raw;
    try {
      snap = snapshotOfDb();
      raw = JSON.stringify(snap);
      localStorage.setItem(LS_KEY, raw);
    } catch (e) {
      // امتلأت مساحة الجهاز: النسخة الأساسية أهم من النسخ الاحتياطية المحلية
      if (!raw || !freeBackupSpace(() => localStorage.setItem(LS_KEY, raw))) {
        console.warn("تعذر الحفظ المحلي:", e);
        return;
      }
    }
    rotateBackup(snap, raw.length);
  }

  function freeBackupSpace(retry) {
    let baks = [];
    try {
      baks = JSON.parse(localStorage.getItem(BAK_KEY) || "[]");
    } catch (e) {
      baks = [];
    }
    while (baks.length) {
      baks.shift();
      try {
        if (baks.length) localStorage.setItem(BAK_KEY, JSON.stringify(baks));
        else localStorage.removeItem(BAK_KEY);
        retry();
        return true;
      } catch (e) {
        /* نكمل الحذف */
      }
    }
    return false;
  }

  const BAK_BUDGET_CHARS = 2400000;

  function rotateBackup(snap, snapChars) {
    try {
      let baks = [];
      try {
        baks = JSON.parse(localStorage.getItem(BAK_KEY) || "[]");
      } catch (e) {
        baks = [];
      }
      const users = (snap.users || []).length;
      const last = baks[baks.length - 1];
      if (!last || last.users !== users || Date.now() - (last.ts || 0) > 3600000) {
        baks.push({ ts: Date.now(), users: users, data: snap });
        const perCopy = Math.max(1, snapChars || 1);
        const fit = Math.max(1, Math.floor(BAK_BUDGET_CHARS / perCopy));
        const keep = Math.min(MAX_BAKS, fit);
        while (baks.length > keep) baks.shift();
        localStorage.setItem(BAK_KEY, JSON.stringify(baks));
      }
    } catch (e) {
      /* تجاهل تجاوز مساحة التخزين */
    }
  }

  function applySnapshot(snap) {
    if (!snap) return;
    DYNAMIC.forEach((c) => {
      if (Array.isArray(snap[c])) window.db[c] = snap[c];
    });
  }

  function notify() {
    if (typeof onChangeCb === "function") {
      try {
        onChangeCb();
      } catch (e) {
        console.warn(e);
      }
    }
  }

  // ---------------------------------------------------------------
  // بصمات السجلات (لمعرفة ما تغيّر محلياً منذ آخر حفظ مؤكد)
  // ---------------------------------------------------------------
  function itemKey(x) {
    return x && (x.id || x.studentId || null);
  }

  // تسلسل ثابت الترتيب (Firestore لا يحفظ ترتيب المفاتيح)، يتجاهل _mt
  function stableStr(v) {
    if (v === null || typeof v !== "object") return JSON.stringify(v === undefined ? null : v);
    if (Array.isArray(v)) return "[" + v.map(stableStr).join(",") + "]";
    return (
      "{" +
      Object.keys(v)
        .filter((k) => k !== "_mt" && v[k] !== undefined)
        .sort()
        .map((k) => JSON.stringify(k) + ":" + stableStr(v[k]))
        .join(",") +
      "}"
    );
  }

  function hashItem(item) {
    const s = stableStr(item);
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(36) + "." + s.length.toString(36);
  }

  // synced[c][id] = [hash, mt] لآخر نسخة مؤكدة من السحابة؛ "T" = محذوف (مخفي)
  let synced = {};
  try {
    synced = JSON.parse(localStorage.getItem(SYNC_KEY) || "{}") || {};
  } catch (e) {
    synced = {};
  }
  let syncedSaveTimer = null;
  function persistSynced() {
    clearTimeout(syncedSaveTimer);
    syncedSaveTimer = setTimeout(() => {
      try {
        localStorage.setItem(SYNC_KEY, JSON.stringify(synced));
      } catch (e) {}
    }, 300);
  }

  function rememberSynced(c, cloudItems) {
    const m = {};
    (cloudItems || []).forEach((x) => {
      const k = itemKey(x);
      if (!k) return;
      m[k] = x._deleted ? "T" : [hashItem(x), x._mt || 0];
    });
    synced[c] = m;
    persistSynced();
  }

  // ---------------------------------------------------------------
  // التغييرات المعلّقة (لم تصل للسحابة بعد)
  // ---------------------------------------------------------------
  const dirty = {}; // c -> Map(id -> { kind: "upsert"|"delete", item, mt })

  function markDirty(c, k, change) {
    if (!dirty[c]) dirty[c] = new Map();
    dirty[c].set(k, change);
  }

  function pendingCount() {
    return Object.keys(dirty).reduce((n, c) => n + dirty[c].size, 0);
  }

  // يقارن المجموعة بآخر نسخة مؤكدة ويسجّل ما تغيّر (ويختم وقت التعديل _mt)
  function collectChanges(c) {
    const live = Array.isArray(window.db[c]) ? window.db[c] : [];
    const s = synced[c];
    // لا نعرف آخر نسخة مؤكدة لهذه المجموعة بعد: تُعالَج عند أول مزامنة (ما ليس في السحابة يُستعاد)
    if (!s) return;
    const now = Date.now();
    const seen = new Set();
    live.forEach((item) => {
      const k = itemKey(item);
      if (!k) return;
      seen.add(k);
      const prev = s[k];
      const h = hashItem(item);
      if (Array.isArray(prev) && prev[0] === h) {
        if (dirty[c] && dirty[c].has(k) && dirty[c].get(k).kind === "upsert") dirty[c].delete(k);
        return;
      }
      if (prev === "T") return; // محذوف ومخفي في السحابة
      const prevMt = Array.isArray(prev) ? prev[1] || 0 : 0;
      // نسخة محلية أقدم مما رأيناه في السحابة = نسخة قديمة وليست تعديلاً: لا تُرسل أبداً
      if (item._mt && item._mt < prevMt) return;
      // تعديل جديد يُختم بوقته الآن؛ وما خُتم سابقاً (قبل انقطاع مثلاً) يحتفظ بوقته الأصلي
      if (!item._mt || item._mt === prevMt) item._mt = now;
      markDirty(c, k, { kind: "upsert", item: JSON.parse(JSON.stringify(item)), mt: item._mt });
    });
    if (!LOG_MAX[c]) {
      Object.keys(s).forEach((k) => {
        if (seen.has(k) || s[k] === "T") return;
        if (dirty[c] && dirty[c].has(k) && dirty[c].get(k).kind === "delete") return;
        markDirty(c, k, { kind: "delete", mt: now });
      });
    }
  }

  function collectAll(names) {
    (names && names.length ? names : DYNAMIC).forEach((c) => {
      if (DYNAMIC.includes(c)) collectChanges(c);
    });
  }

  // ---------------------------------------------------------------
  // حالة الحفظ (للمؤشر الظاهر)
  // ---------------------------------------------------------------
  let syncState = "saved";
  function setStatus(st) {
    syncState = st;
    try {
      window.dispatchEvent(
        new CustomEvent("totin:sync-status", { detail: { state: st, pending: pendingCount() } }),
      );
    } catch (e) {}
  }

  // ---------------------------------------------------------------
  // الإرسال للسحابة
  // ---------------------------------------------------------------
  function docRef(name) {
    return fs.collection(FS_COLLECTION).doc(name);
  }

  function trimNewest(arr, max) {
    if (!max || arr.length <= max) return arr;
    return arr
      .slice()
      .sort((a, b) => (b._mt || b.ts || 0) - (a._mt || a.ts || 0))
      .slice(0, max);
  }

  async function commit(c, batch) {
    let result = null;
    await fs.runTransaction(async (tx) => {
      const snap = await tx.get(docRef(c));
      const cloud = snap.exists && Array.isArray(snap.data().items) ? snap.data().items : [];
      const map = new Map();
      const noKey = [];
      cloud.forEach((x) => {
        const k = itemKey(x);
        if (k) map.set(k, x);
        else noKey.push(x);
      });

      // حماية: نسخة بلا طلاب لا تحذف حسابات الطلاب جماعياً
      let allowDeletes = true;
      if (c === "users" && !window.__ALLOW_BULK_USER_DELETE) {
        const localStudents = (window.db.users || []).filter((u) => u && u.role === "student").length;
        const cloudStudents = cloud.filter((u) => u && u.role === "student" && !u._deleted).length;
        if (cloudStudents >= 4 && localStudents === 0) {
          console.warn("🛑 حماية: تجاهل حذف جماعي لحسابات الطلاب من نسخة قديمة.");
          allowDeletes = false;
        }
      }

      batch.forEach((ch, k) => {
        const cur = map.get(k);
        if (ch.kind === "delete") {
          if (!allowDeletes || !cur || cur._deleted) return;
          if ((cur._mt || 0) > ch.mt) return; // عُدّل بعد الحذف في جهاز آخر
          map.set(k, Object.assign({}, cur, { _deleted: true, _mt: ch.mt }));
          return;
        }
        if (cur && (cur._mt || 0) > ch.mt) return; // تعديل أحدث من جهاز آخر يفوز
        map.set(k, ch.item);
      });

      let out = Array.from(map.values()).concat(noKey);
      if (LOG_MAX[c]) out = trimNewest(out.filter((x) => !x._deleted), LOG_MAX[c]);
      const size = JSON.stringify(out).length;
      if (size > DOC_SAFE_CHARS) {
        const err = new Error("doc-too-big");
        err.code = "doc-too-big";
        throw err;
      }
      tx.set(docRef(c), { items: out, updatedAt: Date.now() });
      result = out;
    });
    return result;
  }

  // تطبيق نسخة السحابة على المحلي مع إبقاء التعديلات المعلّقة فوقها
  function applyCloud(c, cloudItems) {
    rememberSynced(c, cloudItems);
    const live = new Map();
    const order = [];
    (cloudItems || []).forEach((x) => {
      if (x && x._deleted) return;
      const k = itemKey(x);
      if (k) {
        live.set(k, x);
        order.push(k);
      } else {
        order.push(x);
      }
    });
    const pend = dirty[c];
    if (pend && pend.size) {
      pend.forEach((ch, k) => {
        if (ch.kind === "delete") {
          live.delete(k);
        } else {
          if (!live.has(k)) order.push(k);
          live.set(k, ch.item);
        }
      });
    }
    window.db[c] = order
      .map((k) => (typeof k === "string" ? live.get(k) : k))
      .filter(Boolean);
  }

  let flushing = false;
  let flushAgain = false;
  let retryTimer = null;
  let retryDelay = 3000;

  function scheduleFlush() {
    if (!fs || !firstSnapshotHandled) {
      if (pendingCount()) setStatus("pending");
      return;
    }
    if (flushing) {
      flushAgain = true;
      return;
    }
    clearTimeout(retryTimer);
    flush();
  }

  async function flush() {
    flushing = true;
    flushAgain = false;
    const colls = Object.keys(dirty).filter((c) => dirty[c] && dirty[c].size);
    if (!colls.length) {
      flushing = false;
      setStatus("saved");
      return;
    }
    setStatus("saving");
    let failed = false;
    let tooBig = null;
    for (const c of colls) {
      const batch = dirty[c];
      dirty[c] = new Map();
      try {
        const out = await commit(c, batch);
        if (out) {
          applyCloud(c, out);
          try {
            window.dispatchEvent(new CustomEvent("totin:cloud-saved", { detail: { name: c } }));
          } catch (e) {}
        }
      } catch (e) {
        // نعيد التغييرات للانتظار (ما عُدّل محلياً بعدها أولى)
        batch.forEach((v, k) => {
          if (!dirty[c].has(k)) dirty[c].set(k, v);
        });
        failed = true;
        if (e && e.code === "doc-too-big") tooBig = c;
        console.warn("تعذر الحفظ السحابي (" + c + "):", e && (e.code || e.message));
      }
    }
    saveLocal();
    flushing = false;
    if (tooBig) {
      try {
        window.dispatchEvent(new CustomEvent("totin:doc-too-big", { detail: { name: tooBig } }));
      } catch (e) {}
    }
    if (failed) {
      setStatus("error");
      clearTimeout(retryTimer);
      retryTimer = setTimeout(scheduleFlush, retryDelay);
      retryDelay = Math.min(retryDelay * 2, 60000);
      return;
    }
    retryDelay = 3000;
    if (flushAgain || pendingCount()) {
      flush();
      return;
    }
    notify();
    setStatus("saved");
  }

  window.addEventListener("online", () => {
    retryDelay = 3000;
    scheduleFlush();
  });

  // ---------------------------------------------------------------
  // الاستماع للسحابة
  // ---------------------------------------------------------------
  function initFirestore() {
    if (typeof firebase === "undefined" || !window.dbFirestore) return;
    fs = window.dbFirestore;

    fs.collection(FS_COLLECTION).onSnapshot(
      (qs) => {
        const present = {};
        const remoteData = {};
        qs.forEach((doc) => {
          const data = doc.data() || {};
          if (Array.isArray(data.items)) {
            present[doc.id] = true;
            remoteData[doc.id] = data.items;
          }
        });

        if (!firstSnapshotHandled) {
          // أول مزامنة: تعديلات هذا الجهاز التي لم تصل للسحابة تُكتشف وتُرسل،
          // وما سواها يؤخذ من السحابة
          DYNAMIC.forEach((c) => {
            const local = Array.isArray(window.db[c]) ? window.db[c] : [];
            if (!present[c]) {
              // غير موجودة في السحابة بعد: نقطة البداية "فارغة"، فكل ما فيها
              // الآن وكل ما يُضاف لاحقاً يُرسل
              if (!synced[c]) {
                synced[c] = {};
                persistSynced();
              }
              local.forEach((item) => {
                const k = itemKey(item);
                if (!k) return;
                if (!item._mt) item._mt = Date.now();
                markDirty(c, k, { kind: "upsert", item: JSON.parse(JSON.stringify(item)), mt: item._mt });
              });
              return;
            }
            const remote = remoteData[c];
            if (synced[c]) {
              collectChanges(c); // ما تغيّر محلياً منذ آخر حفظ مؤكد
            } else {
              // أول تشغيل لهذا الإصدار على الجهاز: ما ليس في السحابة يُستعاد
              const ids = new Set(remote.map(itemKey));
              local.forEach((item) => {
                const k = itemKey(item);
                if (!k || ids.has(k)) return;
                if (!item._mt) item._mt = Date.now();
                markDirty(c, k, { kind: "upsert", item: JSON.parse(JSON.stringify(item)), mt: item._mt });
              });
            }
            applyCloud(c, remote);
          });
          firstSnapshotHandled = true;
          ensureAdmin();
          ensureAppSettings();
          collectAll(["users", "appSettings"]);
          saveLocal();
          scheduleFlush();
          notify();
          return;
        }

        // مزامنات لاحقة: نسخة السحابة + ما زال معلّقاً من هذا الجهاز
        DYNAMIC.forEach((c) => {
          if (present[c]) applyCloud(c, remoteData[c]);
        });
        const addedAdmin = ensureAdmin();
        const fixedSettings = ensureAppSettings();
        if (addedAdmin || fixedSettings) {
          collectAll(["users", "appSettings"]);
          scheduleFlush();
        }
        saveLocal();
        notify();
      },
      (err) => {
        console.warn("تعذر الاتصال بالمزامنة السحابية، سيتم العمل محلياً:", err && err.code);
        setStatus("offline");
      },
    );
  }

  function ensureAdmin() {
    if (!Array.isArray(window.db.users)) window.db.users = [];
    if (!window.db.users.some((u) => u && u.role === "admin")) {
      const seedAdmin =
        (window.__DB_SEED__ &&
          window.__DB_SEED__.users &&
          window.__DB_SEED__.users.find((u) => u.role === "admin")) ||
        null;
      if (seedAdmin) {
        window.db.users.unshift(JSON.parse(JSON.stringify(seedAdmin)));
        return true;
      }
    }
    return false;
  }

  function ensureAppSettings() {
    const seed =
      (window.__DB_SEED__ && window.__DB_SEED__.appSettings && window.__DB_SEED__.appSettings[0]) || {};
    let changed = false;
    if (!Array.isArray(window.db.appSettings)) {
      window.db.appSettings = [];
      changed = true;
    }
    let app = window.db.appSettings.find((s) => s && s.id === "app");
    if (!app) {
      app = JSON.parse(JSON.stringify(seed));
      window.db.appSettings.unshift(app);
      changed = true;
    }
    ["currentTerm", "terms", "waTemplates"].forEach((k) => {
      if (app[k] === undefined && seed[k] !== undefined) {
        app[k] = JSON.parse(JSON.stringify(seed[k]));
        changed = true;
      }
    });
    if (app.waTemplates && seed.waTemplates) {
      Object.keys(seed.waTemplates).forEach((k) => {
        if (app.waTemplates[k] === undefined) {
          app.waTemplates[k] = seed.waTemplates[k];
          changed = true;
        }
      });
    }
    return changed;
  }

  // كتابة كاملة (للاستعادة اليدوية فقط) — تتجاوز الدمج عمداً
  function forceWrite(c) {
    if (!fs) return Promise.resolve();
    const arr = (Array.isArray(window.db[c]) ? window.db[c] : []).map((x) => {
      if (x && typeof x === "object" && !x._mt) x._mt = Date.now();
      return x;
    });
    if (dirty[c]) dirty[c] = new Map();
    return docRef(c)
      .set({ items: arr, updatedAt: Date.now() })
      .then(() => rememberSynced(c, arr))
      .catch((e) => console.warn("تعذر الحفظ السحابي (" + c + "):", e && e.code));
  }

  return {
    init(onChange) {
      onChangeCb = onChange || null;
      const local = loadLocal();
      if (local) applySnapshot(local);
      ensureAdmin();
      ensureAppSettings();
      try {
        initFirestore();
      } catch (e) {
        console.warn("تعذر تشغيل المزامنة السحابية:", e);
      }
    },

    // حفظ: محلياً فوراً، ثم إرسال ما تغيّر للسحابة.
    // نفحص كل المجموعات (لا التي سُمّيت فقط) حتى لا يضيع تعديل نُسي حفظه.
    save() {
      collectAll();
      saveLocal();
      if (pendingCount()) scheduleFlush();
    },

    // رفع كل شيء كاملاً (يُستخدم في الاستعادة اليدوية) - يتجاوز الدمج
    forcePushAll() {
      saveLocal();
      DYNAMIC.forEach((c) => forceWrite(c));
    },

    flushNow() {
      collectAll();
      scheduleFlush();
    },

    getSyncStatus() {
      return { state: syncState, pending: pendingCount() };
    },

    isCloudConnected() {
      return Boolean(fs);
    },

    firstSyncDone() {
      return firstSnapshotHandled;
    },

    // ---- الأرشفة: نقل السجلات القديمة إلى وثائق أرشيف منفصلة ----
    // آمن: كل نقل معاملة ذرية، ولا يُزال من الوثيقة الحيّة إلا ما تأكّد وصوله للأرشيف،
    // والإزالة نفسها معاملة لا تمس ما أضافته أجهزة أخرى.
    archiveOld(collectionName, isOld, keyFn) {
      return new Promise((resolve) => {
        if (!fs || !firstSnapshotHandled) return resolve({ moved: 0 });
        collectChanges(collectionName);
        const all = Array.isArray(window.db[collectionName]) ? window.db[collectionName] : [];
        const oldItems = all.filter((x) => {
          try {
            return isOld(x);
          } catch (e) {
            return false;
          }
        });
        if (oldItems.length === 0) return resolve({ moved: 0 });

        const groups = {};
        oldItems.forEach((it) => {
          let k;
          try {
            k = String(keyFn(it) || "old");
          } catch (e) {
            k = "old";
          }
          (groups[k] = groups[k] || []).push(it);
        });

        const keys = Object.keys(groups);
        const archivedIds = new Set();
        let moved = 0;

        const finish = () => {
          if (!archivedIds.size) return resolve({ moved });
          fs.runTransaction(async (tx) => {
            const snap = await tx.get(docRef(collectionName));
            const cloud = snap.exists && Array.isArray(snap.data().items) ? snap.data().items : [];
            const out = cloud.filter((x) => !archivedIds.has(itemKey(x)));
            tx.set(docRef(collectionName), { items: out, updatedAt: Date.now() });
            return out;
          })
            .then((out) => {
              if (dirty[collectionName]) archivedIds.forEach((k) => dirty[collectionName].delete(k));
              applyCloud(collectionName, out || []);
              saveLocal();
              resolve({ moved });
            })
            .catch((e) => {
              console.warn("تعذّر إكمال الأرشفة:", e && e.code);
              resolve({ moved: 0 });
            });
        };

        const step = (i) => {
          if (i >= keys.length) return finish();
          const k = keys[i];
          const ref = fs.collection("totin_archive").doc(collectionName + "__" + k);
          const items = groups[k];
          fs.runTransaction(async (tx) => {
            const snap = await tx.get(ref);
            const existing = snap.exists && Array.isArray(snap.data().items) ? snap.data().items : [];
            const map = new Map();
            existing.forEach((x) => {
              const kk = itemKey(x);
              if (kk) map.set(kk, x);
            });
            items.forEach((x) => {
              const kk = itemKey(x);
              if (kk) map.set(kk, x);
            });
            tx.set(ref, {
              items: Array.from(map.values()),
              collection: collectionName,
              key: k,
              archivedAt: Date.now(),
            });
          })
            .then(() => {
              items.forEach((x) => archivedIds.add(itemKey(x)));
              moved += items.length;
              step(i + 1);
            })
            .catch((e) => {
              console.warn("تعذّرت أرشفة (" + k + "):", e && e.code);
              step(i + 1);
            });
        };
        step(0);
      });
    },

    // تحميل وثيقة أرشيف واحدة (للاطّلاع على بيانات قديمة عند الحاجة)
    loadArchive(collectionName, key) {
      return new Promise((resolve) => {
        if (!fs) return resolve([]);
        fs.collection("totin_archive")
          .doc(collectionName + "__" + key)
          .get()
          .then((d) => resolve(d.exists && Array.isArray(d.data().items) ? d.data().items : []))
          .catch(() => resolve([]));
      });
    },

    // ---- أدوات النسخ الاحتياطي والاستعادة ----
    exportJSON() {
      return JSON.stringify({ exportedAt: new Date().toISOString(), db: snapshotOfDb() }, null, 2);
    },

    listBackups() {
      try {
        const baks = JSON.parse(localStorage.getItem(BAK_KEY) || "[]");
        return baks.map((b, i) => ({
          index: i,
          ts: b.ts,
          date: new Date(b.ts).toLocaleString("ar-SA"),
          users: b.users,
        }));
      } catch (e) {
        return [];
      }
    },

    restoreBackup(index) {
      try {
        const baks = JSON.parse(localStorage.getItem(BAK_KEY) || "[]");
        const b = baks[index];
        if (!b || !b.data) return false;
        applySnapshot(b.data);
        ensureAdmin();
        ensureAppSettings();
        saveLocal();
        this.forcePushAll();
        notify();
        return true;
      } catch (e) {
        console.warn("تعذر الاستعادة:", e);
        return false;
      }
    },

    importJSON(jsonText, mode) {
      // mode: "merge" (دمج) أو "replace" (استبدال)
      let obj;
      try {
        obj = JSON.parse(jsonText);
      } catch (e) {
        return { ok: false, error: "ملف غير صالح" };
      }
      const incoming = obj && obj.db ? obj.db : obj;
      if (!incoming || typeof incoming !== "object") return { ok: false, error: "بنية غير متوقعة" };

      DYNAMIC.forEach((c) => {
        if (!Array.isArray(incoming[c])) return;
        if (mode === "replace") {
          window.db[c] = incoming[c];
        } else {
          const map = new Map();
          (Array.isArray(window.db[c]) ? window.db[c] : []).forEach((x) => {
            const k = itemKey(x);
            if (k) map.set(k, x);
          });
          incoming[c].forEach((x) => {
            const k = itemKey(x);
            if (k) map.set(k, x);
          });
          window.db[c] = Array.from(map.values());
        }
      });
      ensureAdmin();
      ensureAppSettings();
      saveLocal();
      if (mode === "replace") this.forcePushAll();
      else this.save();
      notify();
      return { ok: true, users: (window.db.users || []).length };
    },
  };
})();
