/* ==========================================================================
   Toy Haven — sw.js
   Service worker. Pre-caches the application shell so Toy Haven can be
   installed and keeps working without a connection, then serves cached
   copies first for static files and falls back to an offline page for
   navigations that cannot be reached.
   ========================================================================== */

const CACHE = "toyhaven-v2";

const PRECACHE = [
  "./",
  "./index.html",
  "./products.html",
  "./cart.html",
  "./checkout.html",
  "./wishlist.html",
  "./support.html",
  "./offline.html",
  "./manifest.webmanifest",
  "./css/base.css",
  "./css/components.css",
  "./css/pages.css",
  "./js/data.js",
  "./js/app.js",
  "./js/components.js",
  "./js/home.js",
  "./js/products.js",
  "./js/cart.js",
  "./js/checkout.js",
  "./js/wishlist.js",
  "./js/support.js",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/img/banners/banner-figurines-800.webp",
  "./assets/img/banners/banner-figurines.webp",
  "./assets/img/banners/banner-toys.webp",
  "./assets/img/banners/banner-boardgames.webp",
  "./assets/img/banners/banner-diecast.webp"
];

/* Install: fill the cache with the application shell. */
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(PRECACHE);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

/* Activate: drop caches left behind by an older version. */
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        return key === CACHE ? null : caches.delete(key);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

/* Fetch: cache first for same-origin GET requests, offline page for pages. */
self.addEventListener("fetch", function (event) {
  const request = event.request;

  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).then(function (response) {
        const copy = response.clone();
        caches.open(CACHE).then(function (cache) { cache.put(request, copy); });
        return response;
      }).catch(function () {
        return caches.match(request).then(function (cached) {
          return cached || caches.match("./offline.html");
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(function (cached) {
      if (cached) {
        return cached;
      }
      return fetch(request).then(function (response) {
        if (response && response.status === 200 && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE).then(function (cache) { cache.put(request, copy); });
        }
        return response;
      });
    })
  );
});
