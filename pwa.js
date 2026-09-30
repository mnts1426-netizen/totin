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
