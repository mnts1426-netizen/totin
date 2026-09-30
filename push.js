/**
 * push.js - ربط جهاز كل مستخدم بإشعارات Firebase Cloud Messaging (FCM)
 *
 * بالأكواد فقط وعلى Firebase فقط (بدون OneSignal أو أي خدمة خارجية):
 *  - يطلب من FCM "رمز جهاز" (token) عبر عامل الخدمة sw.js الموجود أصلاً.
 *  - يحفظ الرمز في Firestore بمجموعة totin_tokens مربوطاً بالمستخدم ودوره.
 *  - دالة الإرسال تقرأ هذه الرموز وترسل الإشعار للجهاز المقصود فيصل حتى والتطبيق
 *    مغلق أو في الخلفية. خياران (يكفي واحد):
 *      أ) دالة Supabase المجانية supabase/functions/send-push  (ضع رابطها في PUSH_SEND_URL)
 *      ب) Firebase Functions في functions/index.js (تحتاج خطة Blaze)
 *  - عند تسجيل الخروج يُحذف ربط الجهاز حتى لا تصله إشعارات المستخدم السابق.
 */

window.pushReg = (function () {
  const TOKEN_KEY = "totin_fcm_token";
  const TOKENS_COLLECTION = "totin_tokens";
  let messaging = null;

  async function isSupported() {
    try {
      if (typeof firebase === "undefined" || !firebase.messaging) return false;
      if (!("Notification" in window) || !("serviceWorker" in navigator))
        return false;
      const r = firebase.messaging.isSupported
        ? firebase.messaging.isSupported()
        : true;
      return r && typeof r.then === "function" ? await r : Boolean(r);
    } catch (e) {
      return false;
    }
  }

  async function getSwRegistration() {
    if (window.__swRegistration) return window.__swRegistration;
    if (!navigator.serviceWorker) return null;
    try {
      return await navigator.serviceWorker.ready;
    } catch (e) {
      return null;
    }
  }

  // ربط هذا الجهاز بالمستخدم الحالي (يُستدعى بعد الدخول وبعد منح إذن الإشعارات)
  async function register(user) {
    try {
      if (!user || !window.dbFirestore) return false;
      if (Notification.permission !== "granted") return false;
      if (!(await isSupported())) return false;

      messaging = messaging || firebase.messaging();
      const reg = await getSwRegistration();
      if (!reg) return false;

      const opts = { serviceWorkerRegistration: reg };
      // مفتاح Web Push اختياري: إن لم يُضبط تستخدم Firebase مفتاحها الافتراضي
      if (window.FCM_VAPID_KEY) opts.vapidKey = window.FCM_VAPID_KEY;

      const token = await messaging.getToken(opts);
      if (!token) return false;

      const prev = localStorage.getItem(TOKEN_KEY);
      if (prev && prev !== token) {
        window.dbFirestore
          .collection(TOKENS_COLLECTION)
          .doc(prev)
          .delete()
          .catch(() => {});
      }
      localStorage.setItem(TOKEN_KEY, token);

      await window.dbFirestore
        .collection(TOKENS_COLLECTION)
        .doc(token)
        .set({
          userId: user.id,
          role: user.role,
          programId: user.currentProgramId || null,
          updatedAt: Date.now(),
          ua: String(navigator.userAgent || "").slice(0, 150),
        });
      return true;
    } catch (e) {
      console.warn("تعذّر ربط الجهاز بإشعارات FCM:", e && (e.code || e.message));
      return false;
    }
  }

  // فك ربط هذا الجهاز (عند تسجيل الخروج)
  async function unregister() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || !window.dbFirestore) return;
    try {
      await window.dbFirestore.collection(TOKENS_COLLECTION).doc(token).delete();
    } catch (e) {
      /* تجاهل */
    }
    localStorage.removeItem(TOKEN_KEY);
  }

  function isRegistered() {
    return Boolean(localStorage.getItem(TOKEN_KEY));
  }

  // ---- طلب الإرسال للأجهزة عبر دالة Supabase (window.PUSH_SEND_URL) ----
  // بعد حفظ الإشعارات في Firestore نرسل معرّفات الإشعارات الجديدة فقط؛
  // الدالة تقرأ النص من Firestore بنفسها وتمنع التكرار، فلا ضرر لو طلبها جهازان.
  const SENT_KEY = "totin_push_requested";
  const FRESH_MS = 15 * 60 * 1000;

  function loadRequested() {
    try {
      return JSON.parse(localStorage.getItem(SENT_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }

  async function requestSend() {
    const url = window.PUSH_SEND_URL;
    if (!url || !window.db || !Array.isArray(window.db.notifications)) return;
    const done = loadRequested();
    const doneSet = new Set(done);
    const now = Date.now();
    const ids = window.db.notifications
      .filter(
        (n) =>
          n && n.id && typeof n.ts === "number" &&
          now - n.ts < FRESH_MS && !doneSet.has(n.id),
      )
      .map((n) => n.id)
      .slice(0, 50);
    if (!ids.length) return;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      try {
        localStorage.setItem(SENT_KEY, JSON.stringify(done.concat(ids).slice(-300)));
      } catch (e) {}
    } catch (e) {
      console.warn("تعذّر طلب إرسال الإشعارات للأجهزة:", e && e.message);
    }
  }

  window.addEventListener("totin:cloud-saved", (e) => {
    if (e && e.detail && e.detail.name === "notifications") requestSend();
  });

  return { register, unregister, isSupported, isRegistered, requestSend };
})();
