/**
 * sw.js - Service Worker للمنصة الالكترونية
 * يُفعّل تثبيت التطبيق (PWA) ويعرض الإشعارات - بدون أي خدمة خارجية (لا OneSignal ولا غيرها)
 * يجب أن يبقى هذا الملف في جذر الموقع بجانب index.html
 */

const CACHE_NAME = "totin-platform-v1";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./data.js",
  "./store.js",
  "./views.js",
  "./app.js",
  "./pwa.js",
  "./manifest.json",
  "./logo15.png",
  "./logo16.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch(() => {}),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

// شبكة أولاً مع رجوع للتخزين المؤقت عند انقطاع الاتصال
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || !req.url.startsWith("http")) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req)),
  );
});

// استقبال إشعار Push (في حال ربط خادم إرسال لاحقاً) وعرضه
self.addEventListener("push", (event) => {
  let data = { title: "المنصة الالكترونية", body: "لديك إشعار جديد" };
  try {
    if (event.data) data = Object.assign(data, event.data.json());
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "logo15.png",
      badge: "logo15.png",
      dir: "rtl",
      lang: "ar",
    }),
  );
});

// فتح التطبيق عند الضغط على الإشعار
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow("./index.html");
      }
    }),
  );
});
