// Service Worker for 東京冬日 5 人行 PWA
// 策略:
//   - App shell (HTML/CSS/JS/manifest/icon):安裝時預先快取,cache-first
//   - 圖片 & 地圖 tile & CDN:runtime 快取,stale-while-revalidate
//   - 離線 fallback:回傳快取版 index.html

const VERSION = 'v1.0.5';
const SHELL_CACHE = `tokyo-shell-${VERSION}`;
const RUNTIME_CACHE = `tokyo-runtime-${VERSION}`;

// 只放小型 shell 檔案(關鍵路徑),圖片留給 runtime 快取
const SHELL_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './data.js',
  './manifest.json',
  './icon.svg'
];

// ---------- Install:預先抓 shell ----------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ---------- Activate:清舊版本快取 ----------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ---------- Fetch:根據來源選策略 ----------
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 同源:cache-first(shell 檔案優先讀快取)
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 跨源(Leaflet CDN、Google Fonts、地圖 tile 等):stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // 離線 fallback:如果是導覽請求就回 index.html
    if (request.mode === 'navigate') {
      const fallback = await caches.match('./index.html');
      if (fallback) return fallback;
    }
    throw err;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request).then((response) => {
    if (response && response.status === 200) {
      // opaque response 也快取(no-cors)
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  }).catch(() => cached);
  return cached || network;
}
