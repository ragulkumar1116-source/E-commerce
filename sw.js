const CACHE_NAME = 'nvm-tech-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/products.html',
  '/product-details.html',
  '/cart.html',
  '/checkout.html',
  '/orders.html',
  '/wishlist.html',
  '/profile.html',
  '/about.html',
  '/contact.html',
  '/assets/css/style.css',
  '/assets/css/admin.css',
  '/assets/css/auth.css',
  '/assets/css/responsive.css',
  '/assets/css/tablet.css',
  '/assets/css/mobile.css',
  '/assets/js/firebase-config.js',
  '/assets/js/common.js',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request);
    })
  );
});
