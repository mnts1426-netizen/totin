/**
 * pwa.js - تثبيت التطبيق (PWA) وتفعيل الإشعارات بضغطة واحدة
 * بدون أي خدمة خارجية (لا OneSignal) - Firebase والأكواد فقط.
 *
 * التدفق للمستخدم:
 *   يضغط زر واحد  ->  تظهر نافذة المتصفح "تثبيت التطبيق؟" (موافق/لا)
 *                 ->  مباشرة تظهر نافذة إذن الإشعارات (سماح/حظر)
 *                 ->  عند السماح يصله إشعار تأكيد وينزل التطبيق على جهازه
 */

let deferredInstallPrompt = null;
window.__swRegistration = null;

// 1. تسجيل عامل الخدمة فور تحميل الصفحة (شرط أساسي لقابلية التثبيت وللإشعارات)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("sw.js")
      .then((reg) => {
        window.__swRegistration = reg;
      })
      .catch((e) => console.warn("تعذر تسجيل عامل الخدمة:", e));
  });
}

// 2. التقاط حدث التثبيت من المتصفح
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  document.querySelectorAll(".js-install-notify-btn").forEach((b) => {
    b.disabled = false;
  });
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
});

function isAppInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

// 3. الدالة الموحّدة: تثبيت + تفعيل الإشعارات بضغطة واحدة
window.installAppAndEnableNotifications = async function () {
  // ---- أ. تثبيت التطبيق على الجهاز مباشرة (نافذة المتصفح: موافق / لا) ----
  try {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
    }
    // إن لم يوفّر المتصفح نافذة تثبيت (أو التطبيق مثبّت مسبقاً) نكمل مباشرة لتفعيل الإشعارات
    // دون عرض أي خطوات يدوية للمستخدم.
  } catch (e) {
    console.warn("تعذر عرض نافذة التثبيت:", e);
  }

  // ---- ب. تفعيل الإشعارات مباشرة ----
  if (!("Notification" in window)) {
    alert("متصفح جهازك لا يدعم الإشعارات.");
    return;
  }

  try {
    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission === "granted") {
      const reg =
        window.__swRegistration ||
        (navigator.serviceWorker
          ? await navigator.serviceWorker.ready.catch(() => null)
          : null);

      const body = "تم تفعيل الإشعارات الفورية على هذا الجهاز بنجاح.";
      if (reg && reg.showNotification) {
        await reg.showNotification("المنصة الالكترونية", {
          body,
          icon: "logo15.png",
          badge: "logo15.png",
          dir: "rtl",
          lang: "ar",
        });
      } else {
        new Notification("المنصة الالكترونية", { body, icon: "logo15.png" });
      }
      // ربط هذا الجهاز بإشعارات FCM حتى تصل الإشعارات والتطبيق مغلق
      if (
        window.pushReg &&
        typeof state !== "undefined" &&
        state.currentUser
      ) {
        await window.pushReg.register(state.currentUser);
      }
      alert("✅ تم تفعيل الإشعارات بنجاح.");
    } else if (permission === "denied") {
      alert(
        "الإشعارات محظورة من إعدادات المتصفح لهذا الموقع.\n" +
          "لتفعيلها: افتح إعدادات الموقع في المتصفح واسمح بالإشعارات ثم أعد المحاولة.",
      );
    }
  } catch (e) {
    console.error("خطأ أثناء تفعيل الإشعارات:", e);
  }
};

// أسماء بديلة للتوافق
window.triggerAppInstallAndNotify = window.installAppAndEnableNotifications;

// =====================================================================
// التثبيت والإشعارات منفصلان (من الإعدادات)
// =====================================================================
function refreshAppStateUi() {
  try {
    window.dispatchEvent(new CustomEvent("totin:app-state"));
  } catch (e) {}
}
window.addEventListener("beforeinstallprompt", refreshAppStateUi);
window.addEventListener("appinstalled", refreshAppStateUi);

window.isAppInstalled = isAppInstalled;
window.canPromptInstall = function () {
  return Boolean(deferredInstallPrompt);
};
window.isIOSDevice = function () {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent || "") ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
};

// حالة الإشعارات على هذا الجهاز: granted | denied | default | unsupported
window.notificationState = function () {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return "unsupported";
  return Notification.permission;
};

// تثبيت التطبيق فقط
window.installAppOnly = async function () {
  if (isAppInstalled()) {
    alert("التطبيق مثبّت على هذا الجهاز ✓");
    return;
  }
  if (deferredInstallPrompt) {
    try {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
    } catch (e) {
      console.warn("تعذر عرض نافذة التثبيت:", e);
    }
    deferredInstallPrompt = null;
    refreshAppStateUi();
    return;
  }
  if (window.isIOSDevice()) {
    alert(
      "لتثبيت التطبيق على الآيفون:\n" +
        "١) افتح المنصة في متصفح Safari\n" +
        "٢) اضغط زر المشاركة (مربع وسهم للأعلى)\n" +
        "٣) اختر «إضافة إلى الشاشة الرئيسية»\n" +
        "٤) افتح المنصة بعدها من الأيقونة الجديدة",
    );
  } else {
    alert(
      "لتثبيت التطبيق: افتح قائمة المتصفح (⋮) واختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».\n" +
        "إن لم يظهر الخيار فافتح الرابط في متصفح Chrome (وليس من داخل الواتساب).",
    );
  }
};

// تفعيل الإشعارات فقط
window.enableNotificationsOnly = async function () {
  const st = window.notificationState();
  if (st === "unsupported") {
    alert(
      window.isIOSDevice() && !isAppInstalled()
        ? "على الآيفون: ثبّت التطبيق أولاً (إضافة إلى الشاشة الرئيسية) ثم افتحه من الأيقونة وفعّل الإشعارات."
        : "متصفح جهازك لا يدعم الإشعارات. جرّب متصفح Chrome.",
    );
    return;
  }
  try {
    let permission = Notification.permission;
    if (permission === "default") permission = await Notification.requestPermission();
    if (permission === "granted") {
      if (window.pushReg && typeof state !== "undefined" && state.currentUser) {
        await window.pushReg.register(state.currentUser);
      }
      await window.showLocalNotification(
        "المنصة الالكترونية",
        "تم تفعيل الإشعارات على هذا الجهاز بنجاح.",
        "notif-enabled",
      );
      alert("✅ تم تفعيل الإشعارات.");
    } else if (permission === "denied") {
      alert(
        "الإشعارات محظورة لهذا الموقع من إعدادات المتصفح.\n" +
          "لتفعيلها: اضغط رمز القفل بجانب الرابط ← الإشعارات ← سماح، ثم أعد المحاولة.",
      );
    }
  } catch (e) {
    console.error("خطأ أثناء تفعيل الإشعارات:", e);
  }
  refreshAppStateUi();
};

// إشعار تجريبي: يُحفظ كإشعار حقيقي لصاحب الحساب فيمر بنفس طريق الإرسال للجوال
window.sendTestNotification = function () {
  if (typeof state === "undefined" || !state.currentUser) return;
  if (window.notificationState() !== "granted") {
    alert("فعّل الإشعارات أولاً من الزر بالأعلى.");
    return;
  }
  const id = makeUniqueId("notif_test");
  if (!Array.isArray(window.db.notifications)) window.db.notifications = [];
  window.db.notifications.unshift({
    id,
    userId: state.currentUser.id,
    category: "إشعار تجريبي",
    title: "إشعار تجريبي ✓",
    message: "إذا وصلك هذا الإشعار فالإشعارات تعمل على جهازك. جرّب أيضاً وأنت خارج التطبيق.",
    date: "الآن",
    isRead: false,
  });
  if (window.__seenNotifIds) window.__seenNotifIds.add(id);
  persist("notifications");
  window.showLocalNotification("إشعار تجريبي ✓", "الإشعارات تعمل على هذا الجهاز.", id);
  if (typeof updateNotificationsBadge === "function") updateNotificationsBadge();
  alert("تم إرسال إشعار تجريبي. إن لم يظهر لك، تأكد أن الإشعارات غير مكتومة في إعدادات الجوال.");
};

// عرض إشعار فوري فعلي (تنبيه نظام) - يُستخدم عند وصول إشعار جديد للمستخدم الحالي
// أثناء فتح التطبيق (ولو في تبويب/خلفية). أما والتطبيق مغلق تماماً فيتولاها
// FCM عبر push.js و functions/index.js (نفس الوسم tag فلا يتكرر الإشعار).
window.showLocalNotification = async function (title, body, tag) {
  try {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return false;
    }
    const opts = {
      body: body || "",
      icon: "logo15.png",
      badge: "logo15.png",
      dir: "rtl",
      lang: "ar",
      tag: tag || undefined,
    };
    const reg =
      window.__swRegistration ||
      (navigator.serviceWorker
        ? await navigator.serviceWorker.ready.catch(() => null)
        : null);
    if (reg && reg.showNotification) {
      await reg.showNotification(title || "المنصة الالكترونية", opts);
    } else {
      new Notification(title || "المنصة الالكترونية", opts);
    }
    return true;
  } catch (e) {
    console.warn("تعذر عرض الإشعار:", e);
    return false;
  }
};
