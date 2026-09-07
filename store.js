/**
 * store.js - طبقة الحفظ والمزامنة للمنصة
 *
 *  - حفظ محلي دائم على الجهاز (localStorage) يعمل في كل الأحوال حتى بدون إنترنت.
 *  - مزامنة سحابية عبر Firebase Firestore عند توفر الاتصال، فتظهر أي إضافة
 *    (طالب / مشرف / تحضير / مهمة ...) على جميع الأجهزة فوراً، ويستطيع الطالب
 *    الدخول من جواله ويجد حسابه.
 *
 * لا يكسر التطبيق: إن فشل Firestore يبقى العمل على النسخة المحلية دون أي خلل.
 */

window.store = (function () {
  const LS_KEY = "totin_db_v2";
  const FS_COLLECTION = "totin_state";

  // المجموعات الديناميكية التي تُحفظ وتُزامَن (الثابتة مثل programs/levels/taskTemplates تبقى من data.js)
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
  ];

  let fs = null;
  let onChangeCb = null;
  let firstSnapshotHandled = false;
  let applyingRemote = false;

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

  function saveLocal() {
    try {
      const snap = {};
      DYNAMIC.forEach((c) => {
        snap[c] = Array.isArray(window.db[c]) ? window.db[c] : [];
      });
      localStorage.setItem(LS_KEY, JSON.stringify(snap));
    } catch (e) {
      console.warn("تعذر الحفظ المحلي:", e);
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

  // كتابة مجموعة واحدة إلى السحابة
  function pushCollection(name) {
    if (!fs || applyingRemote) return;
    try {
      fs.collection(FS_COLLECTION)
        .doc(name)
        .set({ items: window.db[name] || [], updatedAt: Date.now() })
        .catch((e) => console.warn("تعذر الحفظ السحابي (" + name + "):", e));
    } catch (e) {
      console.warn("تعذر الحفظ السحابي:", e);
    }
  }

  function pushAll() {
    DYNAMIC.forEach(pushCollection);
  }

  function initFirestore() {
    if (typeof firebase === "undefined" || !window.dbFirestore) return;
    fs = window.dbFirestore;

    fs.collection(FS_COLLECTION).onSnapshot(
      (qs) => {
        if (qs.empty && !firstSnapshotHandled) {
          // أول تشغيل والسحابة فارغة: ارفع النسخة الحالية (المحلية أو البذور)
          firstSnapshotHandled = true;
          pushAll();
          return;
        }
        firstSnapshotHandled = true;
        applyingRemote = true;
        qs.forEach((doc) => {
          const name = doc.id;
          const data = doc.data() || {};
          if (DYNAMIC.includes(name) && Array.isArray(data.items)) {
            window.db[name] = data.items;
          }
        });
        applyingRemote = false;
        // تأكد من وجود حساب المدير دائماً
        const addedAdmin = ensureAdmin();
        saveLocal();
        if (addedAdmin) pushCollection("users");
        notify();
      },
      (err) => {
        console.warn("تعذر الاتصال بالمزامنة السحابية، سيتم العمل محلياً:", err);
      },
    );
  }

  function ensureAdmin() {
    if (!Array.isArray(window.db.users)) window.db.users = [];
    if (!window.db.users.some((u) => u.role === "admin")) {
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

  return {
    // تهيئة الحفظ - تُستدعى مرة واحدة قبل أول رسم
    init(onChange) {
      onChangeCb = onChange || null;
      const local = loadLocal();
      if (local) applySnapshot(local);
      ensureAdmin();
      try {
        initFirestore();
      } catch (e) {
        console.warn("تعذر تشغيل المزامنة السحابية:", e);
      }
    },

    // حفظ مجموعة (أو أكثر) بعد أي تعديل: store.save("users") أو store.save("users", "notifications")
    save(...names) {
      saveLocal();
      const list = names.length ? names : DYNAMIC;
      list.forEach((n) => {
        if (DYNAMIC.includes(n)) pushCollection(n);
      });
    },

    saveAll() {
      saveLocal();
      pushAll();
    },

    isCloudConnected() {
      return Boolean(fs);
    },
  };
})();
