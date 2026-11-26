// 建議出門時間的純函式 (不碰 DOM)
// 瀏覽器:跟 data.js 一樣用一般 <script> 載入,在 app.js 之前,定義全域的 Departure
// Node:module.exports,給 tools/check-data.js 與 tests/departure.test.js 用
//
// 建議出門時間 = 當天第一站的時間 - 從飯店過去的交通分鐘數,再往前取整到 5 分鐘 (寧可早到)
// 交通分鐘數要從走出飯店算起 (含走到車站、等車),所以這裡不另外加緩衝
const Departure = (() => {
  const STEP = 5;

  // "H:MM" / "HH:MM" → 從 00:00 起算的分鐘數;格式不對回傳 null
  function toMinutes(time) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(time ?? "").trim());
    if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return null;
    return Number(m[1]) * 60 + Number(m[2]);
  }

  const pad = (n) => String(n).padStart(2, "0");

  // 回傳 "HH:MM";時間格式不對、分鐘數不是正數,或算出來早於 00:00 時回傳 null
  function suggest(firstTime, minutes) {
    const arrival = toMinutes(firstTime);
    if (arrival === null || typeof minutes !== "number" || !(minutes > 0)) return null;
    const depart = Math.floor((arrival - minutes) / STEP) * STEP;
    if (depart < 0) return null;
    return `${pad(Math.floor(depart / 60))}:${pad(depart % 60)}`;
  }

  return { suggest };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = Departure;
}
