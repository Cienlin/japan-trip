// departure.js 的純函式測試:node --test
const test = require("node:test");
const assert = require("node:assert/strict");
const Departure = require("../departure.js");

test("第一站時間減掉交通分鐘數", () => {
  assert.equal(Departure.suggest("09:30", 35), "08:55");
  assert.equal(Departure.suggest("13:30", 65), "12:25");
});

test("往前取整到 5 分鐘", () => {
  assert.equal(Departure.suggest("10:00", 23), "09:35");
  assert.equal(Departure.suggest("10:00", 21), "09:35");
  assert.equal(Departure.suggest("10:00", 20), "09:40");
});

test("一位數的小時也算得出來", () => {
  assert.equal(Departure.suggest("9:30", 35), "08:55");
});

test("時間格式不對時回傳 null", () => {
  assert.equal(Departure.suggest(null, 35), null);
  assert.equal(Departure.suggest(undefined, 35), null);
  assert.equal(Departure.suggest("abc", 35), null);
  assert.equal(Departure.suggest("25:00", 35), null);
  assert.equal(Departure.suggest("10:60", 35), null);
});

test("分鐘數不是正數時回傳 null", () => {
  assert.equal(Departure.suggest("10:00", 0), null);
  assert.equal(Departure.suggest("10:00", -5), null);
  assert.equal(Departure.suggest("10:00", "35"), null);
  assert.equal(Departure.suggest("10:00", undefined), null);
  assert.equal(Departure.suggest("10:00", NaN), null);
});

test("算出來早於 00:00 時回傳 null", () => {
  assert.equal(Departure.suggest("00:10", 30), null);
  assert.equal(Departure.suggest("00:30", 30), "00:00");
});
