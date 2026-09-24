// Service Worker for 東京冬日 5 人行 PWA
// 策略:
//   - App shell (HTML/CSS/JS/manifest/icon):network-first,3 秒逾時或離線才用快取
//     → 有網路時一開就是最新版,不用再靠手動改版號才能更新
//   - 景點圖片:cache-first,頁面載入後由 app.js 通知預先快取全部圖片
//   - 地圖圖磚:cache-first,上限 MAX_TILES 張(旅途中省流量、離線也看得到看過的區域)
//   - 其他跨源 (Leaflet CDN、Google Fonts):stale-while-revalidate
//   圖片 / 圖磚 / CDN 快取名稱固定,改版不會被清掉

const VERSION = 'v1.2.1';
const SHELL_CACHE = `tokyo-shell-${VERSION}`;
const IMAGE_CACHE = 'tokyo-images';
const TILE_CACHE = 'tokyo-tiles';
const CDN_CACHE = 'tokyo-cdn';
const KEEP_CACHES = [SHELL_CACHE, IMAGE_CACHE, TILE_CACHE, CDN_CACHE];

const NETWORK_TIMEOUT_MS = 3000;
const MAX_TILES = 1500; // OSM 圖磚約 15~30KB/張 → 上限約 20~40MB
const TILE_TRIM_EVERY = 50;

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
      // cache: 'reload' 跳過瀏覽器 HTTP 快取 (GitHub Pages 為 max-age=600),確保存進新版快取的是新檔
      .then((cache) => cache.addAll(SHELL_ASSETS.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

// ---------- Activate:清掉舊版 shell 與舊命名的快取 ----------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((k) => !KEEP_CACHES.includes(k))
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ---------- Message:app.js 送來圖片清單,補齊尚未快取的圖片 ----------
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== 'precache-images' || !Array.isArray(data.urls)) return;
  event.waitUntil(precacheImages(data.urls));
});

async function precacheImages(urls) {
  const cache = await caches.open(IMAGE_CACHE);
  await Promise.allSettled(urls.map(async (url) => {
    if (new URL(url, self.location.href).origin !== self.location.origin) return;
    if (await cache.match(url)) return;
    await cache.add(url);
  }));
}

// 讓背景的快取寫入在回應送出後也能跑完;
// 舊版 Safari 在非同步時機呼叫 waitUntil 可能丟錯,不能因此讓整個請求失敗
function keepAlive(event, promise) {
  try {
    event.waitUntil(promise);
  } catch (err) {
    // 忽略:promise 仍會繼續執行,只是 SW 可能提早被回收
  }
}

// ---------- Fetch:根據來源選策略 ----------
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (url.pathname.includes('/images/')) {
      event.respondWith(cacheFirst(event, IMAGE_CACHE));
    } else {
      event.respondWith(networkFirst(event));
    }
    return;
  }

  if (url.hostname === 'tile.openstreetmap.org') {
    event.respondWith(cacheFirst(event, TILE_CACHE, trimTiles));
    return;
  }

  event.respondWith(staleWhileRevalidate(event, CDN_CACHE));
});

async function networkFirst(event) {
  const request = event.request;
  const cache = await caches.open(SHELL_CACHE);

  // cache: 'no-cache' 每次都向伺服器確認 (沒變只回 304),
  // 否則 fetch 會直接用瀏覽器 HTTP 快取,GitHub Pages 的 max-age=600 會讓新版晚 10 分鐘才出現
  const network = fetch(request, { cache: 'no-cache' }).then((response) => {
    if (response && response.ok) {
      return cache.put(request, response.clone()).then(() => response);
    }
    return response;
  });
  // 逾時改用快取後,讓網路請求繼續跑完並更新快取,下次開啟就是新版
  keepAlive(event, network.catch(() => {}));

  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('network timeout')), NETWORK_TIMEOUT_MS);
  });

  try {
    return await Promise.race([network, timeout]);
  } catch (err) {
    const isNavigate = request.mode === 'navigate';
    const cached = await cache.match(request, { ignoreSearch: isNavigate }) ||
                   (isNavigate ? await cache.match('./index.html') : undefined);
    if (cached) return cached;
    // 沒有快取可用:逾時的話繼續等網路;真的離線就回錯誤
    return network;
  }
}

async function cacheFirst(event, cacheName, afterPut) {
  const request = event.request;
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok) {
    keepAlive(event, cache.put(request, response.clone())
      .then(() => afterPut && afterPut(cache))
      .catch(() => {}));
  }
  return response;
}

async function staleWhileRevalidate(event, cacheName) {
  const request = event.request;
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const network = fetch(request).then((response) => {
    if (response && response.ok) {
      return cache.put(request, response.clone()).then(() => response);
    }
    return response;
  });
  keepAlive(event, network.catch(() => {}));

  if (cached) return cached;
  return network.catch(() => Response.error());
}

// 圖磚快取超過上限時,從最早存入的開始刪(每存 TILE_TRIM_EVERY 張檢查一次)
let tilePutsSinceTrim = 0;
async function trimTiles(cache) {
  tilePutsSinceTrim += 1;
  if (tilePutsSinceTrim < TILE_TRIM_EVERY) return;
  tilePutsSinceTrim = 0;

  const keys = await cache.keys();
  const excess = keys.length - MAX_TILES;
  if (excess <= 0) return;
  await Promise.all(keys.slice(0, excess).map((key) => cache.delete(key)));
}
