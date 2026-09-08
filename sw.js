/* =================================================================
   EDUVERSE — SERVICE WORKER
   Caches the app shell (HTML/CSS/JS + logo assets) so EduVerse keeps
   working offline and can be installed as a PWA (and later wrapped
   for Android via Trusted Web Activity / Bubblewrap). Bump
   CACHE_NAME whenever these files change so returning visitors get
   the fresh versions instead of a stale cache.
   ================================================================= */

const CACHE_NAME = "eduverse-shell-v6"; // bumped: fixes stale cache-first units.js/content-store.js hiding newly published lessons

const APP_SHELL = [
  "./",
  "index.html",
  "login.html",
  "learning-worlds.html",
  "units.html",
  "lesson1.html",
  "lesson-engine.html",
  "gamification.html",
  "leaderboard.html",
  "teacher-dashboard.html",
  "manifest.json",

  "css/style.css",
  "css/login.css",
  "css/edubot.css",
  "css/certificate.css",
  "css/learning-worlds.css",
  "css/units.css",
  "css/lesson-engine.css",
  "css/lesson1.css",
  "css/gamification.css",
  "css/leaderboard.css",
  "css/teacher-dashboard.css",
  "css/games-engine.css",

  "js/main.js",
  "js/auth.js",
  "js/auth-page.js",
  "js/grades.js",
  "js/progress.js",
  "js/edubot.js",
  "js/certificate.js",
  "js/gamification.js",
  "js/content-store.js",
  "js/games-engine.js",
  "js/virtual-lab.js",
  "js/lesson-generator.js",
  "js/learning-worlds.js",
  "js/units.js",
  "js/lesson-engine.js",
  "js/lesson1.js",
  "js/leaderboard.js",
  "js/teacher-dashboard.js",

  "assets/images/logo/logo-full.jpg",
  "assets/images/logo/logo-icon-64.png",
  "assets/images/logo/logo-icon-128.png",
  "assets/images/logo/logo-icon-256.png",
  "assets/images/logo/logo-icon-512.png",
  "assets/images/logo/favicon-16.png",
  "assets/images/logo/favicon-32.png",
  "assets/images/logo/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Individual failures (a file that doesn't exist yet, like a
      // future page) shouldn't block install — cache what we can.
      Promise.allSettled(APP_SHELL.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

/* Two strategies, split by what actually changes:

   1. APP CODE (html/js/css/manifest, and any navigation request) —
      NETWORK-FIRST. This is the actual fix for lessons that a teacher
      just published not showing up for students: with a pure
      cache-first strategy, once a browser cached (say) js/units.js or
      js/content-store.js, it would keep serving that exact snapshot
      forever, regardless of how many times the underlying files were
      updated on the server — completely independent of whether the
      *data* (localStorage) was fresh. Network-first always tries the
      live file first and only falls back to the cache when offline,
      so a code update reaches a returning student immediately, with
      no dependency on remembering to bump CACHE_NAME.

   2. STATIC ASSETS (images, fonts, everything else) — CACHE-FIRST,
      exactly as before. These rarely change and staleness there is
      harmless, so it's worth keeping the faster, offline-friendly
      cache-first read.

   Cross-origin requests (Google Fonts, etc.) are untouched either way. */
function isAppCode(request, url) {
  if (request.mode === "navigate") return true;
  return /\.(?:html|js|css|json)$/i.test(url.pathname);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isAppCode(request, url)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => {
            if (cached) return cached;
            if (request.mode === "navigate") return caches.match("index.html");
            return undefined;
          })
        )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => undefined);
    })
  );
});
