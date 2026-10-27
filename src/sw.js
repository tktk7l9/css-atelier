// Minimal offline support. Navigations are network-first (so deploys are picked
// up online) with a cached shell fallback; other same-origin GETs are
// cache-first with runtime caching (build assets are content-hashed).
//
// This is a template: the build (lessonChunks() in vite.config.ts) emits it as
// /sw.js with PRECACHE filled in — the lesson runtime and every track's lesson
// chunk — so a lesson can be opened offline without having been opened online
// first, as when all lessons shipped in the initial bundle. ASSETS lists every
// hashed file of the build, so a new worker can drop the previous build's.

const CACHE = "css-atelier-v1";
// The shell is keyed by "/", never "/index.html": Workers static assets answer
// /index.html with a 307 to /, so precaching it would store a redirected
// response, and a redirected response may not answer a navigation (whose
// redirect mode is "manual") — the offline fallback would fail with a network
// error until the next online navigation replaced the entry.
const SHELL_PAGE = "/";
const SHELL = [SHELL_PAGE, "/favicon.svg", "/manifest.webmanifest"];
const PRECACHE = [];
const ASSETS = [];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll([...SHELL, ...PRECACHE]))
      .then(() => self.skipWaiting()),
  );
});

/** Hashed assets of an earlier build are dead once a new build is active. */
async function dropStaleAssets() {
  const cache = await caches.open(CACHE);
  const keep = new Set(ASSETS);
  for (const req of await cache.keys()) {
    const path = new URL(req.url).pathname;
    if (path.startsWith("/assets/") && !keep.has(path)) await cache.delete(req);
  }
}

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(dropStaleAssets)
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
            caches.open(CACHE).then((c) => c.put(SHELL_PAGE, copy));
          }
          return res;
        })
        .catch(() => caches.match(SHELL_PAGE)),
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
