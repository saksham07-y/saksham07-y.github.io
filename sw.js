/* Daybreak service worker: offline-first app shell */
const VERSION = "daybreak-v4.0.0";
const SHELL = [
  "./", "./index.html", "./offline.html", "./manifest.webmanifest",
  "./css/tokens.css", "./css/site.css",
  "./js/theme.js", "./js/parser.js", "./js/site.js",
  "./icons/icon.svg", "./icons/icon-192.png", "./icons/apple-touch-icon.png", "./icons/favicon.ico", "./icons/icon-512.png", "./icons/maskable-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if (req.mode === "navigate") {
    // network first for pages, fall back to cache, then offline page
    e.respondWith(
      fetch(req).then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res; })
        .catch(() => caches.match(req).then((r) => r || caches.match("./offline.html")))
    );
    return;
  }
  // stale-while-revalidate for assets
  e.respondWith(
    caches.match(req).then((cached) => {
      const net = fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); } return res; }).catch(() => cached);
      return cached || net;
    })
  );
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window" }).then((list) => {
    for (const c of list) if ("focus" in c) return c.focus();
    return self.clients.openWindow("./index.html");
  }));
});
