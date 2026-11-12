// basemap.js 的純函式測試:node --test
const test = require("node:test");
const assert = require("node:assert/strict");
const Basemap = require("../basemap.js");

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 10, 12, 3, 0, 0);
const SETTINGS = { scale: "scaleFactor2x", language: "zh-TW" };

// 手機上存的通行碼 (expiry 跟 Google 回傳的一樣,是 epoch 秒數的字串)
const stored = (overrides = {}) => ({
  session: "abc123",
  expiry: String((NOW + 3 * DAY) / 1000),
  tileWidth: 512,
  scale: "scaleFactor2x",
  language: "zh-TW",
  ...overrides
});

// ---------- 通行碼能不能沿用 ----------

test("還有 1 天以上、設定相同的通行碼可以沿用", () => {
  assert.equal(Basemap.isSessionUsable(stored(), SETTINGS, NOW), true);
});

test("剛好還有 1 天的通行碼可以沿用", () => {
  const s = stored({ expiry: String((NOW + DAY) / 1000) });
  assert.equal(Basemap.isSessionUsable(s, SETTINGS, NOW), true);
});

test("離過期不到 1 天就不沿用", () => {
  const s = stored({ expiry: String((NOW + DAY - 60 * 1000) / 1000) });
  assert.equal(Basemap.isSessionUsable(s, SETTINGS, NOW), false);
});

test("已經過期的通行碼不沿用", () => {
  const s = stored({ expiry: String((NOW - DAY) / 1000) });
  assert.equal(Basemap.isSessionUsable(s, SETTINGS, NOW), false);
});

test("字的大小設定不同就不沿用", () => {
  const s = stored({ scale: "scaleFactor4x" });
  assert.equal(Basemap.isSessionUsable(s, SETTINGS, NOW), false);
});

test("地名語言設定不同就不沿用", () => {
  const s = stored({ language: "en-US" });
  assert.equal(Basemap.isSessionUsable(s, SETTINGS, NOW), false);
});

test("沒有存過或內容不完整就不沿用", () => {
  assert.equal(Basemap.isSessionUsable(null, SETTINGS, NOW), false);
  assert.equal(Basemap.isSessionUsable(undefined, SETTINGS, NOW), false);
  assert.equal(Basemap.isSessionUsable({}, SETTINGS, NOW), false);
  assert.equal(Basemap.isSessionUsable(stored({ session: "" }), SETTINGS, NOW), false);
  assert.equal(Basemap.isSessionUsable(stored({ expiry: "不是數字" }), SETTINGS, NOW), false);
});

// ---------- 連續失敗時的處理 ----------

// 依序送出圖磚事件,回傳每一步的動作
function run(reused, events) {
  let state = Basemap.initialFailureState(reused);
  return events.map((event) => {
    const result = Basemap.nextFailureState(state, event);
    state = result.state;
    return result.action;
  });
}

test("圖磚載入成功時,連續失敗次數歸零", () => {
  const actions = run(false, ["error", "error", "load", "error", "error", "load"]);
  assert.deepEqual(actions, ["none", "none", "none", "none", "none", "none"]);
});

test("沿用的通行碼連續失敗 3 次,先重新建立一次", () => {
  const actions = run(true, ["error", "error", "error"]);
  assert.deepEqual(actions, ["none", "none", "renew"]);
});

test("重新建立的通行碼又連續失敗 3 次,就退回備用底圖", () => {
  const actions = run(true, ["error", "error", "error", "error", "error", "error"]);
  assert.deepEqual(actions, ["none", "none", "renew", "none", "none", "fallback"]);
});

test("重新建立後只要有成功,失敗次數重新計算", () => {
  const actions = run(true, ["error", "error", "error", "load", "error", "error", "load"]);
  assert.deepEqual(actions, ["none", "none", "renew", "none", "none", "none", "none"]);
});

test("新的通行碼連續失敗 3 次,直接退回備用底圖", () => {
  const actions = run(false, ["error", "error", "error"]);
  assert.deepEqual(actions, ["none", "none", "fallback"]);
});

test("退回之後不再有其他動作", () => {
  const actions = run(false, ["error", "error", "error", "error", "load", "error", "error", "error"]);
  assert.deepEqual(actions, ["none", "none", "fallback", "none", "none", "none", "none", "none"]);
});

// ---------- 網址 ----------

test("viewport 網址包含 session、key、zoom 與四個邊界", () => {
  const url = new URL(Basemap.viewportUrl({
    api: "https://tile.googleapis.com",
    session: "abc+/=",
    key: "KEY123",
    zoom: 15,
    bounds: { north: 35.72, south: 35.70, east: 139.80, west: 139.78 }
  }));
  assert.equal(url.origin + url.pathname, "https://tile.googleapis.com/tile/v1/viewport");
  assert.equal(url.searchParams.get("session"), "abc+/=");
  assert.equal(url.searchParams.get("key"), "KEY123");
  assert.equal(url.searchParams.get("zoom"), "15");
  assert.equal(url.searchParams.get("north"), "35.72");
  assert.equal(url.searchParams.get("south"), "35.7");
  assert.equal(url.searchParams.get("east"), "139.8");
  assert.equal(url.searchParams.get("west"), "139.78");
});

test("圖磚網址保留 Leaflet 的 {z}/{x}/{y},並帶 session 與 key", () => {
  const template = Basemap.tileUrlTemplate({ api: "https://tile.googleapis.com", session: "abc+/=", key: "KEY123" });
  assert.ok(template.startsWith("https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}?"));
  const url = new URL(template.replace("{z}/{x}/{y}", "15/1/2"));
  assert.equal(url.searchParams.get("session"), "abc+/=");
  assert.equal(url.searchParams.get("key"), "KEY123");
});
