/**
 * sw.js - Service Worker للمنصة الالكترونية
 * يُفعّل تثبيت التطبيق (PWA) ويعرض الإشعارات - بدون أي خدمة خارجية (لا OneSignal ولا غيرها)
 * يجب أن يبقى هذا الملف في جذر الموقع بجانب index.html
 */

const CACHE_NAME = "totin-platform-v3";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./data.js",
  "./store.js",
  "./views.js",
  "./app.js",
  "./pwa.js",
  "./push.js",
  "./grades.js",
  "./comms.js",
  "./content.js",
  "./parents.js",
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

// استقبال إشعار Push من Firebase Cloud Messaging (يصل حتى والتطبيق مغلق أو في الخلفية)
// الدالة السحابية ترسل رسالة "data" فيها: title, body, tag, link
self.addEventListener("push", (event) => {
  let title = "المنصة الالكترونية";
  let body = "لديك إشعار جديد";
  let tag;
  let link = "./index.html";
  try {
    const p = event.data ? event.data.json() : {};
    const d = p.data || p.notification || p;
    if (d.title) title = d.title;
    if (d.body) body = d.body;
    if (d.tag) tag = d.tag;
    if (d.link) link = d.link;
  } catch (e) {
    if (event.data) body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: "logo15.png",
      badge: "logo15.png",
      dir: "rtl",
      lang: "ar",
      // نفس الوسم المستخدم داخل التطبيق => لا يتكرر الإشعار لو كان التطبيق مفتوحاً
      tag: tag,
      data: { link: link },
    }),
  );
});

// فتح التطبيق عند الضغط على الإشعار
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link =
    (event.notification.data && event.notification.data.link) || "./index.html";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) return client.focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow(link);
      }),
  );
});
