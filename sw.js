const CACHE_NAME = 'megane-tablet-v1';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/sound.js',
  './js/gauge.js',
  './js/weather.js',
  './js/news.js',
  './js/media.js',
  './js/app.js',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
