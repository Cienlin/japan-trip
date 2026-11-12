// 地圖底圖的判斷邏輯 (純函式,不碰 DOM 與 Leaflet)
// 瀏覽器:跟 data.js 一樣用一般 <script> 載入,在 app.js 之前,定義全域的 Basemap
// Node:module.exports,給 tests/basemap.test.js 用 (node --test)
const Basemap = (() => {
  const DAY_MS = 24 * 60 * 60 * 1000;
  // 離過期不到這麼久就重新建立通行碼,避免用到一半過期
  const SESSION_MIN_REMAINING_MS = DAY_MS;
  // 連續這麼多張圖磚載入失敗 (中間沒有成功) 就處理
  const FAILURE_LIMIT = 3;

  // 手機上存的通行碼能不能沿用:還有 1 天以上,而且字的大小、地名語言都跟目前設定相同
  // stored.expiry 是 Google 回傳的 epoch 秒數字串
  function isSessionUsable(stored, settings, nowMs) {
    if (!stored || typeof stored.session !== "string" || !stored.session) return false;
    if (stored.scale !== settings.scale || stored.language !== settings.language) return false;
    const expiryMs = Number(stored.expiry) * 1000;
    if (!Number.isFinite(expiryMs)) return false;
    return expiryMs - nowMs >= SESSION_MIN_REMAINING_MS;
  }

  // reused:目前的通行碼是不是從手機上沿用的 (可能已經失效,失敗時值得重新建立一次)
  function initialFailureState(reused) {
    return { failures: 0, canRenew: Boolean(reused), done: false };
  }

  // event:"load" (圖磚載入成功) 或 "error" (載入失敗)
  // action:"none" 繼續;"renew" 丟掉通行碼、重新建立一次;"fallback" 改用備用底圖
  function nextFailureState(state, event) {
    if (state.done) return { state, action: "none" };
    if (event === "load") return { state: { ...state, failures: 0 }, action: "none" };

    const failures = state.failures + 1;
    if (failures < FAILURE_LIMIT) return { state: { ...state, failures }, action: "none" };
    if (state.canRenew) return { state: { failures: 0, canRenew: false, done: false }, action: "renew" };
    return { state: { ...state, failures, done: true }, action: "fallback" };
  }

  // 版權文字的查詢網址 (不計費)
  function viewportUrl({ api, session, key, zoom, bounds }) {
    const params = new URLSearchParams({
      session,
      key,
      zoom: String(zoom),
      north: String(bounds.north),
      south: String(bounds.south),
      east: String(bounds.east),
      west: String(bounds.west)
    });
    return `${api}/tile/v1/viewport?${params}`;
  }

  // Leaflet L.tileLayer 用的圖磚網址,保留 {z}/{x}/{y}
  function tileUrlTemplate({ api, session, key }) {
    const params = new URLSearchParams({ session, key });
    return `${api}/v1/2dtiles/{z}/{x}/{y}?${params}`;
  }

  return { isSessionUsable, initialFailureState, nextFailureState, viewportUrl, tileUrlTemplate };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = Basemap;
}
