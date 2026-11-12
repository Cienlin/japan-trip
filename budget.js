// 預算分頁的計算 (純函式,不碰 DOM)
// 瀏覽器:跟 data.js 一樣用一般 <script> 載入,在 app.js 之前,定義全域的 Budget
// Node:module.exports,給 tests/budget.test.js 用 (node --test)
const Budget = (() => {
  const MAX_DIGITS = 9;       // 金額上限 ¥999,999,999,避免異常輸入
  const NEAR_PERCENT = 80;    // 已用 80% 以上提醒注意

  // 全形數字轉半形 (日文、中文輸入法常打出全形)
  const toHalfWidth = (text) => text.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));

  // 一筆花費的金額:只接受正整數日圓;去掉前後空白 (含全形空白) 與千分位逗號
  // 回傳 { ok: true, value } 或 { ok: false, reason: "empty" | "invalid" | "zero" }
  function parseAmount(text) {
    const cleaned = toHalfWidth(String(text ?? "")).trim().replace(/[,，]/g, "");
    if (!cleaned) return { ok: false, reason: "empty" };
    if (!/^\d+$/.test(cleaned)) return { ok: false, reason: "invalid" };
    const digits = cleaned.replace(/^0+/, "");
    if (!digits) return { ok: false, reason: "zero" };
    if (digits.length > MAX_DIGITS) return { ok: false, reason: "invalid" };
    return { ok: true, value: Number(digits) };
  }

  const finiteOrZero = (value) => (Number.isFinite(value) ? value : 0);

  // 目前總花費 = 機票 + 住宿 + 目前花費 (日圓,依匯率換算台幣);有總預算時再算已用百分比與剩餘預算
  // status:"unset" 沒填總預算;"under" 低於 80%;"near" 80% 以上到總預算;"over" 超過總預算 (用金額判斷,不用四捨五入後的 %)
  function summarize({ budgetTwd, flightTwd, hotelTwd, rate, expenses }) {
    const spentJpy = (Array.isArray(expenses) ? expenses : []).reduce(
      (sum, expense) => (expense && Number.isInteger(expense.amount) && expense.amount > 0 ? sum + expense.amount : sum),
      0
    );
    const spentTwd = Math.round(spentJpy * finiteOrZero(rate));
    const totalTwd = Math.round(finiteOrZero(flightTwd) + finiteOrZero(hotelTwd) + spentTwd);

    if (!(Number.isFinite(budgetTwd) && budgetTwd > 0)) {
      return { spentJpy, spentTwd, totalTwd, percentage: null, remainingTwd: null, status: "unset" };
    }
    const percentage = Math.round((totalTwd / budgetTwd) * 100);
    const remainingTwd = budgetTwd - totalTwd;
    let status = "near";
    if (totalTwd > budgetTwd) status = "over";
    else if (percentage < NEAR_PERCENT) status = "under";
    return { spentJpy, spentTwd, totalTwd, percentage, remainingTwd, status };
  }

  const isPositive = (value) => typeof value === "number" && Number.isFinite(value) && value > 0;
  const isNonNegative = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0;
  const VALIDATORS = { rate: isPositive, flight: isNonNegative, budgetTwd: isPositive };

  // 手機上存的預算設定轉成 v3:{ v: 3, rate?, flight?, budgetTwd? },只留旅伴改過的欄位
  // - v2 { v: 2, rate?, flight?, pocket? }:pocket (零用金) 已改成逐筆記帳,丟掉
  // - 沒有 v 的舊資料 (v1.4.1 以前一打開就全部存起來):跟當時預設值 legacyDefaults 相同的視為沒改過
  // - 跟目前預設值 defaults 相同的也視為沒改過,之後主揪更新旅程資料才會生效
  function migrateSettings(stored, { legacyDefaults = {}, defaults = {} } = {}) {
    const result = { v: 3 };
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) return result;

    const isLegacy = stored.v === undefined;
    const keys = stored.v === 3 ? ["rate", "flight", "budgetTwd"] : ["rate", "flight"];
    keys.forEach((key) => {
      const value = stored[key];
      if (!VALIDATORS[key](value)) return;
      if (key in defaults && value === defaults[key]) return;
      if (isLegacy && value === legacyDefaults[key]) return;
      result[key] = value;
    });
    return result;
  }

  return { parseAmount, summarize, migrateSettings };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = Budget;
}
