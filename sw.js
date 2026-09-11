/* Service Worker — מאפשר עבודה אופליין מלאה.
   שים לב: ה-SW שומר רק את קבצי האפליקציה. הנתונים שלך יושבים ב-localStorage
   ולעולם לא נשלחים לרשת ולא נכנסים ל-cache הזה. */
const V = "bait-v3";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* network-first על ה-HTML כדי לקבל עדכונים, cache-first על השאר */
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if (req.mode === "navigate" || req.destination === "document") {
    e.respondWith(
      fetch(req).then(r => {
        const copy = r.clone();
        caches.open(V).then(c => c.put(req, copy));
        return r;
      }).catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
    );
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(resp => {
    const copy = resp.clone();
    caches.open(V).then(c => c.put(req, copy));
    return resp;
  })));
});
