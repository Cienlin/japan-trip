// budget.js 的純函式測試:node --test
const test = require("node:test");
const assert = require("node:assert/strict");
const Budget = require("../budget.js");

// ---------- 金額 ----------

test("一般的數字", () => {
  assert.deepEqual(Budget.parseAmount("2050"), { ok: true, value: 2050 });
});

test("千分位逗號、全形數字、前後空白都當成一般數字", () => {
  assert.deepEqual(Budget.parseAmount("2,050"), { ok: true, value: 2050 });
  assert.deepEqual(Budget.parseAmount("２０５０"), { ok: true, value: 2050 });
  assert.deepEqual(Budget.parseAmount("２，０５０"), { ok: true, value: 2050 });
  assert.deepEqual(Budget.parseAmount("  2050 "), { ok: true, value: 2050 });
  assert.deepEqual(Budget.parseAmount("　2050　"), { ok: true, value: 2050 });
});

test("空白不能加入", () => {
  assert.deepEqual(Budget.parseAmount(""), { ok: false, reason: "empty" });
  assert.deepEqual(Budget.parseAmount("   "), { ok: false, reason: "empty" });
  assert.deepEqual(Budget.parseAmount(null), { ok: false, reason: "empty" });
  assert.deepEqual(Budget.parseAmount(undefined), { ok: false, reason: "empty" });
});

test("0 不能加入", () => {
  assert.deepEqual(Budget.parseAmount("0"), { ok: false, reason: "zero" });
  assert.deepEqual(Budget.parseAmount("000"), { ok: false, reason: "zero" });
});

test("小數、負數、算式、其他字元都不能加入", () => {
  ["12.5", "-300", "1200+850", "12a", "¥300", "1 2"].forEach((text) => {
    assert.deepEqual(Budget.parseAmount(text), { ok: false, reason: "invalid" }, text);
  });
});

test("超過 9 位數不能加入", () => {
  assert.deepEqual(Budget.parseAmount("999999999"), { ok: true, value: 999999999 });
  assert.deepEqual(Budget.parseAmount("1000000000"), { ok: false, reason: "invalid" });
});

// ---------- 加總 ----------

const TRIP = { flightTwd: 14424, hotelTwd: 9061, rate: 0.21 };

test("旅途中:總預算 50,000、目前花費 ¥32,600", () => {
  const result = Budget.summarize({ ...TRIP, budgetTwd: 50000, expenses: [{ amount: 32600 }] });
  assert.equal(result.spentJpy, 32600);
  assert.equal(result.spentTwd, 6846);
  assert.equal(result.totalTwd, 30331);
  assert.equal(result.percentage, 61);
  assert.equal(result.remainingTwd, 19669);
  assert.equal(result.status, "under");
});

test("目前花費是所有明細的合計", () => {
  const result = Budget.summarize({ ...TRIP, budgetTwd: 50000, expenses: [{ amount: 2050 }, { amount: 300 }, { amount: 30250 }] });
  assert.equal(result.spentJpy, 32600);
});

test("明細裡不合法的金額不算進去", () => {
  const result = Budget.summarize({
    ...TRIP,
    budgetTwd: 50000,
    expenses: [{ amount: 1000 }, { amount: -500 }, { amount: 12.5 }, { amount: "300" }, {}, null]
  });
  assert.equal(result.spentJpy, 1000);
});

test("沒有花費時,目前總花費是機票加住宿", () => {
  const result = Budget.summarize({ ...TRIP, budgetTwd: 50000, expenses: [] });
  assert.equal(result.spentJpy, 0);
  assert.equal(result.totalTwd, 23485);
});

test("總預算空白或不是正數時,不算百分比與剩餘預算", () => {
  [undefined, null, 0, -1, NaN].forEach((budgetTwd) => {
    const result = Budget.summarize({ ...TRIP, budgetTwd, expenses: [{ amount: 32600 }] });
    assert.equal(result.status, "unset", String(budgetTwd));
    assert.equal(result.percentage, null);
    assert.equal(result.remainingTwd, null);
    assert.equal(result.totalTwd, 30331);
  });
});

// 只看機票的情況,方便測門檻
const onlyFlight = (flightTwd, budgetTwd) => Budget.summarize({ flightTwd, hotelTwd: 0, rate: 0.21, budgetTwd, expenses: [] });

test("已用低於 80% 是充裕", () => {
  assert.equal(onlyFlight(39000, 50000).status, "under");
});

test("80% 以上到總預算之間要注意", () => {
  assert.equal(onlyFlight(40000, 50000).status, "near");
  assert.equal(onlyFlight(49999, 50000).status, "near");
});

test("剛好花完總預算是要注意,不是超支", () => {
  const result = onlyFlight(50000, 50000);
  assert.equal(result.status, "near");
  assert.equal(result.remainingTwd, 0);
});

test("超過總預算是超支,剩餘預算是負數", () => {
  const result = onlyFlight(50400, 50000);
  assert.equal(result.status, "over");
  assert.equal(result.remainingTwd, -400);
  assert.equal(result.percentage, 101);
});

test("機票空白當成 0", () => {
  const result = Budget.summarize({ flightTwd: NaN, hotelTwd: 9061, rate: 0.21, budgetTwd: 50000, expenses: [] });
  assert.equal(result.totalTwd, 9061);
});

// ---------- 設定欄位的值 ----------

test("合法的設定值", () => {
  assert.equal(Budget.parseSetting("rate", "0.21"), 0.21);
  assert.equal(Budget.parseSetting("flight", "14424"), 14424);
  assert.equal(Budget.parseSetting("flight", "0"), 0);
  assert.equal(Budget.parseSetting("budgetTwd", "50000"), 50000);
  assert.equal(Budget.parseSetting("budgetTwd", " 50000 "), 50000);
});

test("空白、負數、0 (機票以外) 都不合法", () => {
  assert.equal(Budget.parseSetting("flight", ""), null);
  assert.equal(Budget.parseSetting("flight", "-14424"), null);
  assert.equal(Budget.parseSetting("rate", "-0.21"), null);
  assert.equal(Budget.parseSetting("rate", "0"), null);
  assert.equal(Budget.parseSetting("budgetTwd", "0"), null);
  assert.equal(Budget.parseSetting("budgetTwd", undefined), null);
  assert.equal(Budget.parseSetting("budgetTwd", "abc"), null);
});

test("不認得的欄位不合法", () => {
  assert.equal(Budget.parseSetting("pocket", "50000"), null);
});

// ---------- 手機上的設定轉換 ----------

const LEGACY_DEFAULTS = { rate: 0.22, flight: 14424 };
const DEFAULTS = { rate: 0.21, flight: 14424 };
const migrate = (stored) => Budget.migrateSettings(stored, { legacyDefaults: LEGACY_DEFAULTS, defaults: DEFAULTS });

test("v2:改過的匯率、機票保留,零用金丟掉", () => {
  assert.deepEqual(migrate({ v: 2, rate: 0.215, flight: 13000, pocket: 80000 }), { v: 3, rate: 0.215, flight: 13000 });
});

test("v2:沒改過任何欄位", () => {
  assert.deepEqual(migrate({ v: 2 }), { v: 3 });
});

test("沒有 v 的舊資料:跟當時預設值相同的視為沒改過", () => {
  assert.deepEqual(migrate({ rate: 0.22, flight: 14424, pocket: 50000 }), { v: 3 });
  assert.deepEqual(migrate({ rate: 0.215, flight: 14424, pocket: 60000 }), { v: 3, rate: 0.215 });
});

test("跟目前預設值相同的欄位不記", () => {
  assert.deepEqual(migrate({ v: 3, rate: 0.21, flight: 13000 }), { v: 3, flight: 13000 });
});

test("v3:總預算保留,不合法的欄位丟掉", () => {
  assert.deepEqual(migrate({ v: 3, budgetTwd: 50000, rate: 0.22 }), { v: 3, budgetTwd: 50000, rate: 0.22 });
  assert.deepEqual(migrate({ v: 3, budgetTwd: "50000", rate: NaN, flight: -1 }), { v: 3 });
});

test("沒有存過或格式不對", () => {
  assert.deepEqual(migrate(null), { v: 3 });
  assert.deepEqual(migrate(undefined), { v: 3 });
  assert.deepEqual(migrate("壞掉的資料"), { v: 3 });
  assert.deepEqual(migrate([1, 2]), { v: 3 });
});
