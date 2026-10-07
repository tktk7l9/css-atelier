// Minimal offline support. Navigations are network-first (so deploys are picked
// up online) with a cached shell fallback; other same-origin GETs are
// cache-first with runtime caching (build assets are content-hashed).
//
// This is a template: the build (lessonChunks() in vite.config.ts) emits it as
// /sw.js with PRECACHE filled in — the lesson runtime and every track's lesson
// chunk — so a lesson can be opened offline without having been opened online
// first, as when all lessons shipped in the initial bundle.

const CACHE = "css-atelier-v1";
const SHELL = ["/", "/index.html", "/favicon.svg", "/manifest.webmanifest"];
const PRECACHE = [];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll([...SHELL, ...PRECACHE]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Only a successful response may replace the offline shell; a 404
          // or 5xx page must never become what every offline navigation shows.
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put("/index.html", copy));
          }
          return res;
        })
        .catch(() => caches.match("/index.html")),
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
