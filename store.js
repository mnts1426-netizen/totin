/**
 * store.js - طبقة الحفظ والمزامنة الآمنة للمنصة
 *
 *  - حفظ محلي دائم (localStorage) + نسخ احتياطية متعددة على الجهاز.
 *  - مزامنة سحابية عبر Firebase Firestore.
 *
 * حماية من فقدان البيانات:
 *  1) لا تُرفع أي بيانات للسحابة قبل أول قراءة ناجحة منها (تُؤجَّل التعديلات).
 *  2) عند أول قراءة: دمج (union) للبيانات المحلية مع السحابية بالمُعرّف id،
 *     فلا تُفقد أي عناصر موجودة محلياً وليست في السحابة (استعادة تلقائية).
 *  3) رفض أي حفظ يُفرّغ حسابات الطلاب فجأة (توقيع "المسح بالخطأ").
 */

window.store = (function () {
  const LS_KEY = "totin_db_v2";
  const BAK_KEY = "totin_bak_v2"; // مصفوفة نسخ احتياطية دوارة
  const MAX_BAKS = 6;
  const FS_COLLECTION = "totin_state";

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
  ];

  // مجموعات تُحفظ بالدمج (معاملة): لا يمسح جهازٌ ما أضافه جهاز آخر في نفس اللحظة.
  // لكل عنصر updatedAt، والأحدث يفوز. max = أقصى عدد يُبقى (الأحدث أولاً).
  const MERGE_PUSH = {
    gradeTotals: {},
    gradeLog: { max: 1500 },
    messages: { max: 1000 },
    warnings: { max: 3000 },
    contentItems: {},
    parents: {},
  };

  let fs = null;
  let onChangeCb = null;
  let firstSnapshotHandled = false;
  let applyingRemote = false;
  const pendingPush = {}; // {collectionName: true} تعديلات قبل أول مزامنة
  const remoteCount = {}; // آخر عدد معروف في السحابة لكل مجموعة

  // ---- محلي ----
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
      // امتلأت مساحة الجهاز: النسخة الأساسية أهم من النسخ الاحتياطية المحلية،
      // فنحذف أقدم النسخ الاحتياطية ونعيد المحاولة.
      if (!raw || !freeBackupSpace(() => localStorage.setItem(LS_KEY, raw))) {
        console.warn("تعذر الحفظ المحلي:", e);
        return;
      }
    }
    rotateBackup(snap, raw.length);
  }

  // يحذف أقدم النسخ الاحتياطية المحلية واحدة واحدة حتى تنجح العملية retry
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

  // ميزانية النسخ الاحتياطية المحلية (مساحة المتصفح ~5 ميجا للموقع كله)
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
      // نسخة احتياطية جديدة فقط إذا تغيّر عدد المستخدمين أو مرّت ساعة
      if (
        !last ||
        last.users !== users ||
        Date.now() - (last.ts || 0) > 3600000
      ) {
        baks.push({ ts: Date.now(), users: users, data: snap });
        // عدد النسخ يتكيّف مع حجم البيانات حتى لا تزاحم النسخة الأساسية
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

  // ---- دمج بالمُعرّف (union) ----
  function itemKey(x) {
    return x && (x.id || x.studentId || null);
  }

  function mergeById(localArr, remoteArr) {
    const map = new Map();
    const noId = [];
    (localArr || []).forEach((x) => {
      const k = itemKey(x);
      if (k) map.set(k, x);
    });
    // السحابة هي المرجع المشترك: تكتب فوق المحلي للعناصر المشتركة
    (remoteArr || []).forEach((x) => {
      const k = itemKey(x);
      if (k) map.set(k, x);
      else noId.push(x);
    });
    return Array.from(map.values()).concat(noId);
  }

  // ---- سحابي ----
  function docRef(name) {
    return fs.collection(FS_COLLECTION).doc(name);
  }

  function pushCollection(name, opts) {
    opts = opts || {};
    if (!DYNAMIC.includes(name)) return;
    if (!fs) {
      pendingPush[name] = true;
      return;
    }
    if (!firstSnapshotHandled && !opts.force) {
      pendingPush[name] = true; // نؤجّل حتى نقرأ السحابة أولاً
      return;
    }
    if (applyingRemote && !opts.force) return;

    // حسابات المستخدمين: كتابة عبر معاملة تدمج مع السحابة (لا تُفقد أي إضافة من جهاز آخر)
    if (name === "users" && !opts.force) {
      pushUsersMerged();
      return;
    }
    if (MERGE_PUSH[name] && !opts.force) {
      pushNewerMerged(name, MERGE_PUSH[name]);
      return;
    }

    const arr = Array.isArray(window.db[name]) ? window.db[name] : [];
    try {
      docRef(name)
        .set({ items: arr, updatedAt: Date.now() })
        .then(() => {
          remoteCount[name] = arr.length;
          // إشعار بقية الملفات (push.js) أن الحفظ السحابي اكتمل
          try {
            window.dispatchEvent(
              new CustomEvent("totin:cloud-saved", { detail: { name } }),
            );
          } catch (e) {}
        })
        .catch((e) => console.warn("تعذر الحفظ السحابي (" + name + "):", e));
    } catch (e) {
      console.warn("تعذر الحفظ السحابي:", e);
    }
  }

  // كتابة "users" بأمان: معاملة تقرأ السحابة ثم تدمج، فلا تُفقد إضافات الأجهزة الأخرى،
  // وتُرفض عمليات الحذف الجماعي المشبوهة (نسخة قديمة تكتب فوق الحديثة).
  function pushUsersMerged() {
    const localArr = (window.db.users || []).slice();
    fs.runTransaction(async (tx) => {
      const snap = await tx.get(docRef("users"));
      const cloudArr =
        snap.exists && Array.isArray(snap.data().items) ? snap.data().items : [];

      const localIds = new Set(localArr.map(itemKey));
      const localStudents = localArr.filter(
        (u) => u && u.role === "student",
      ).length;
      const cloudStudents = cloudArr.filter(
        (u) => u && u.role === "student",
      ).length;

      // ما حُذف محلياً (موجود في السحابة وليس محلياً)
      let deletedIds = new Set(
        cloudArr.filter((x) => !localIds.has(itemKey(x))).map(itemKey),
      );

      // حماية: نسخة محلية بلا طلاب مقابل سحابة فيها طلاب => تجاهل الحذف
      if (
        !window.__ALLOW_BULK_USER_DELETE &&
        cloudStudents >= 4 &&
        localStudents === 0
      ) {
        console.warn("🛑 حماية: تجاهل حذف جماعي لحسابات الطلاب من نسخة قديمة.");
        deletedIds = new Set();
      }

      const map = new Map();
      cloudArr.forEach((x) => {
        const k = itemKey(x);
        if (k && !deletedIds.has(k)) map.set(k, x);
      });
      localArr.forEach((x) => {
        const k = itemKey(x);
        if (k) map.set(k, x); // المحلي هو صاحب آخر تعديل
      });

      const merged = Array.from(map.values());
      tx.set(docRef("users"), { items: merged, updatedAt: Date.now() });
      return merged;
    })
      .then((merged) => {
        if (Array.isArray(merged)) {
          remoteCount.users = merged.length;
          // حدّث النسخة المحلية بنتيجة الدمج (قد تكون فيها إضافات من أجهزة أخرى)
          if (merged.length !== (window.db.users || []).length) {
            window.db.users = merged;
            try {
              localStorage.setItem(LS_KEY, JSON.stringify(snapshotOfDb()));
            } catch (e) {}
            notify();
          }
        }
      })
      .catch((e) =>
        console.warn("تعذر حفظ حسابات المستخدمين:", e && e.code),
      );
  }

  // دمج "الأحدث يفوز" لكل عنصر بحسب updatedAt
  function mergeNewer(baseArr, overArr, max) {
    const map = new Map();
    (baseArr || []).forEach((x) => {
      const k = itemKey(x);
      if (k) map.set(k, x);
    });
    (overArr || []).forEach((x) => {
      const k = itemKey(x);
      if (!k) return;
      const cur = map.get(k);
      if (!cur || (x.updatedAt || 0) >= (cur.updatedAt || 0)) map.set(k, x);
    });
    let out = Array.from(map.values());
    if (max && out.length > max) {
      out = out
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        .slice(0, max);
    }
    return out;
  }

  function pushNewerMerged(name, cfg) {
    const localArr = (window.db[name] || []).slice();
    fs.runTransaction(async (tx) => {
      const snap = await tx.get(docRef(name));
      const cloudArr =
        snap.exists && Array.isArray(snap.data().items) ? snap.data().items : [];
      const merged = mergeNewer(cloudArr, localArr, cfg.max);
      tx.set(docRef(name), { items: merged, updatedAt: Date.now() });
      return merged;
    })
      .then((merged) => {
        // ما تغيّر محلياً أثناء الحفظ يبقى (الأحدث يفوز)
        window.db[name] = mergeNewer(merged, window.db[name], cfg.max);
        remoteCount[name] = merged.length;
        try {
          localStorage.setItem(LS_KEY, JSON.stringify(snapshotOfDb()));
        } catch (e) {}
        try {
          window.dispatchEvent(
            new CustomEvent("totin:cloud-saved", { detail: { name } }),
          );
        } catch (e) {}
      })
      .catch((e) =>
        console.warn("تعذر الحفظ السحابي (" + name + "):", e && e.code),
      );
  }

  function flushPending() {
    Object.keys(pendingPush).forEach((n) => {
      delete pendingPush[n];
      pushCollection(n);
    });
  }

  function initFirestore() {
    if (typeof firebase === "undefined" || !window.dbFirestore) return;
    fs = window.dbFirestore;

    fs.collection(FS_COLLECTION).onSnapshot(
      (qs) => {
        const firstTime = !firstSnapshotHandled;
        applyingRemote = true;

        const present = {};
        const remoteData = {};
        qs.forEach((doc) => {
          const name = doc.id;
          present[name] = true;
          const data = doc.data() || {};
          if (Array.isArray(data.items)) {
            remoteData[name] = data.items;
            remoteCount[name] = data.items.length;
          }
        });

        if (firstTime) {
          // أول مزامنة: دمج آمن (union) بدل الاستبدال الأعمى
          const toRecover = [];
          DYNAMIC.forEach((c) => {
            const localArr = Array.isArray(window.db[c]) ? window.db[c] : [];
            const remoteArr = present[c] ? remoteData[c] || [] : null;

            if (remoteArr === null) {
              // المجموعة غير موجودة في السحابة: ارفع المحلي كما هو
              if (localArr.length) toRecover.push(c);
              return;
            }
            const merged = mergeById(localArr, remoteArr);
            window.db[c] = merged;
            // إذا كان المحلي يحوي عناصر ليست في السحابة => استعادة => نرفع النتيجة
            if (merged.length > remoteArr.length) toRecover.push(c);
          });

          applyingRemote = false;
          firstSnapshotHandled = true;
          ensureAdmin();
          ensureAppSettings();
          saveLocal();

          // ارفع ما تم استرجاعه + أي تعديلات مؤجّلة
          toRecover.forEach((c) => pushCollection(c, { force: true }));
          flushPending();
          notify();
          return;
        }

        // مزامنات لاحقة: تطبيق مباشر من السحابة (هي المرجع المشترك)
        DYNAMIC.forEach((c) => {
          if (present[c] && Array.isArray(remoteData[c])) {
            window.db[c] = remoteData[c];
          }
        });
        applyingRemote = false;
        const addedAdmin = ensureAdmin();
        const fixedSettings = ensureAppSettings();
        saveLocal();
        if (addedAdmin) pushCollection("users", { force: true });
        if (fixedSettings) pushCollection("appSettings", { force: true });
        notify();
      },
      (err) => {
        console.warn(
          "تعذر الاتصال بالمزامنة السحابية، سيتم العمل محلياً:",
          err && err.code,
        );
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
      (window.__DB_SEED__ &&
        window.__DB_SEED__.appSettings &&
        window.__DB_SEED__.appSettings[0]) ||
      {};
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

    save(...names) {
      saveLocal();
      const list = names.length ? names : DYNAMIC.slice();
      list.forEach((n) => pushCollection(n));
    },

    // رفع كل شيء (يُستخدم في الاستعادة اليدوية) - يتجاوز الحماية
    forcePushAll() {
      saveLocal();
      DYNAMIC.forEach((n) => pushCollection(n, { force: true }));
    },

    isCloudConnected() {
      return Boolean(fs);
    },

    firstSyncDone() {
      return firstSnapshotHandled;
    },

    // ---- الأرشفة: نقل السجلات القديمة إلى وثائق أرشيف منفصلة ----
    // تبقى الوثيقة الحيّة صغيرة دائماً. آمن: كل نقل معاملة ذرية، ولا يُحذف من الحيّ
    // إلا ما تأكّد وصوله للأرشيف.
    archiveOld(collectionName, isOld, keyFn) {
      return new Promise((resolve) => {
        if (!fs || !firstSnapshotHandled) return resolve({ moved: 0 });
        const all = Array.isArray(window.db[collectionName])
          ? window.db[collectionName]
          : [];
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

        const step = (i) => {
          if (i >= keys.length) {
            if (archivedIds.size) {
              window.db[collectionName] = all.filter(
                (x) => !archivedIds.has(itemKey(x)),
              );
              saveLocal();
              pushCollection(collectionName, { force: true });
            }
            return resolve({ moved });
          }
          const k = keys[i];
          const ref = fs
            .collection("totin_archive")
            .doc(collectionName + "__" + k);
          const items = groups[k];

          fs.runTransaction(async (tx) => {
            const snap = await tx.get(ref);
            const existing =
              snap.exists && Array.isArray(snap.data().items)
                ? snap.data().items
                : [];
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
          .then((d) =>
            resolve(
              d.exists && Array.isArray(d.data().items) ? d.data().items : [],
            ),
          )
          .catch(() => resolve([]));
      });
    },

    // ---- أدوات النسخ الاحتياطي والاستعادة ----
    exportJSON() {
      return JSON.stringify(
        { exportedAt: new Date().toISOString(), db: snapshotOfDb() },
        null,
        2,
      );
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
      if (!incoming || typeof incoming !== "object")
        return { ok: false, error: "بنية غير متوقعة" };

      DYNAMIC.forEach((c) => {
        if (!Array.isArray(incoming[c])) return;
        if (mode === "replace") {
          window.db[c] = incoming[c];
        } else {
          window.db[c] = mergeById(
            Array.isArray(window.db[c]) ? window.db[c] : [],
            incoming[c],
          );
        }
      });
      ensureAdmin();
      ensureAppSettings();
      saveLocal();
      this.forcePushAll();
      notify();
      return {
        ok: true,
        users: (window.db.users || []).length,
      };
    },
  };
})();
