// checklist.js 的純函式測試:node --test
const test = require("node:test");
const assert = require("node:assert/strict");
const Checklist = require("../checklist.js");

const DEFAULTS = [
  { id: "checklist-passport", text: "護照正本" },
  { id: "checklist-cash", text: "日幣現金" },
  { id: "checklist-medicine", text: "個人常備藥物" }
];
const EMPTY = { v: 1, hidden: [], custom: [] };
const ids = (items) => items.map((item) => item.id);

// ---------- 手機上的資料 ----------

test("沒有資料或格式不對時,當成空的", () => {
  assert.deepEqual(Checklist.normalize(null), EMPTY);
  assert.deepEqual(Checklist.normalize(undefined), EMPTY);
  assert.deepEqual(Checklist.normalize("壞掉的資料"), EMPTY);
  assert.deepEqual(Checklist.normalize([]), EMPTY);
  assert.deepEqual(Checklist.normalize({ hidden: "checklist-cash", custom: {} }), EMPTY);
});

test("只丟掉格式不對的那幾筆,其他保留", () => {
  const stored = Checklist.normalize({
    v: 1,
    hidden: ["checklist-cash", 3, ""],
    custom: [
      { id: "custom-1", text: "充電線" },
      { id: "custom-2" },
      { text: "沒有 id" },
      { id: "custom-3", text: "   " },
      null
    ]
  });
  assert.deepEqual(stored, { v: 1, hidden: ["checklist-cash"], custom: [{ id: "custom-1", text: "充電線" }] });
});

// ---------- 組出清單 ----------

test("預設項目在前,自己的項目依加入順序排在後面", () => {
  const items = Checklist.buildItems(DEFAULTS, {
    v: 1, hidden: [], custom: [{ id: "custom-1", text: "充電線" }, { id: "custom-2", text: "暖暖包" }]
  });
  assert.deepEqual(ids(items), ["checklist-passport", "checklist-cash", "checklist-medicine", "custom-1", "custom-2"]);
  assert.deepEqual(items.map((item) => item.isDefault), [true, true, true, false, false]);
  assert.equal(items[3].text, "充電線");
});

test("刪掉的預設項目不出現", () => {
  const items = Checklist.buildItems(DEFAULTS, { v: 1, hidden: ["checklist-cash"], custom: [] });
  assert.deepEqual(ids(items), ["checklist-passport", "checklist-medicine"]);
});

test("主揪新增的預設項目會出現;旅程資料已經拿掉的 id 不影響結果", () => {
  const newDefaults = [...DEFAULTS, { id: "checklist-hotpack", text: "暖暖包" }];
  const items = Checklist.buildItems(newDefaults, { v: 1, hidden: ["checklist-removed-long-ago"], custom: [] });
  assert.deepEqual(ids(items), ["checklist-passport", "checklist-cash", "checklist-medicine", "checklist-hotpack"]);
});

test("手機上的資料壞掉時,仍然列出所有預設項目", () => {
  assert.deepEqual(ids(Checklist.buildItems(DEFAULTS, "壞掉的資料")), ids(DEFAULTS));
});

// ---------- 新增項目的文字 ----------

test("一般的文字可以加入", () => {
  assert.deepEqual(Checklist.parseText("充電線"), { ok: true, value: "充電線" });
});

test("去掉前後空白 (含全形空白)", () => {
  assert.deepEqual(Checklist.parseText("  充電線 "), { ok: true, value: "充電線" });
  assert.deepEqual(Checklist.parseText("　充電線　"), { ok: true, value: "充電線" });
});

test("空白不能加入", () => {
  assert.deepEqual(Checklist.parseText(""), { ok: false, reason: "empty" });
  assert.deepEqual(Checklist.parseText("   "), { ok: false, reason: "empty" });
  assert.deepEqual(Checklist.parseText(null), { ok: false, reason: "empty" });
});

test("最多 40 個字", () => {
  assert.deepEqual(Checklist.parseText("字".repeat(40)), { ok: true, value: "字".repeat(40) });
  assert.deepEqual(Checklist.parseText("字".repeat(41)), { ok: false, reason: "tooLong" });
});

// ---------- 新增、刪除、還原 ----------

test("新增的項目加在最後,不改到原本的資料", () => {
  const before = { v: 1, hidden: [], custom: [{ id: "custom-1", text: "充電線" }] };
  const after = Checklist.addItem(before, "暖暖包", "custom-2");
  assert.deepEqual(after.custom, [{ id: "custom-1", text: "充電線" }, { id: "custom-2", text: "暖暖包" }]);
  assert.equal(before.custom.length, 1);
});

test("刪除預設項目:記進 hidden,只在這支手機不顯示", () => {
  const after = Checklist.removeItem(EMPTY, "checklist-cash", DEFAULTS);
  assert.deepEqual(after.hidden, ["checklist-cash"]);
  assert.deepEqual(after.custom, []);
  assert.deepEqual(ids(Checklist.buildItems(DEFAULTS, after)), ["checklist-passport", "checklist-medicine"]);
});

test("刪除自己的項目:從 custom 拿掉,不記進 hidden", () => {
  const before = { v: 1, hidden: [], custom: [{ id: "custom-1", text: "充電線" }, { id: "custom-2", text: "暖暖包" }] };
  const after = Checklist.removeItem(before, "custom-1", DEFAULTS);
  assert.deepEqual(after.custom, [{ id: "custom-2", text: "暖暖包" }]);
  assert.deepEqual(after.hidden, []);
});

test("刪除不存在的項目,資料不變", () => {
  const before = { v: 1, hidden: ["checklist-cash"], custom: [{ id: "custom-1", text: "充電線" }] };
  assert.deepEqual(Checklist.removeItem(before, "custom-404", DEFAULTS), before);
});

test("同一個預設項目刪兩次,hidden 只記一次", () => {
  const once = Checklist.removeItem(EMPTY, "checklist-cash", DEFAULTS);
  assert.deepEqual(Checklist.removeItem(once, "checklist-cash", DEFAULTS).hidden, ["checklist-cash"]);
});

// ---------- 自己的項目後來變成預設項目 ----------

test("自己加的項目跟預設項目文字一樣時,併進預設項目,清單只出現一次", () => {
  const stored = { v: 1, hidden: [], custom: [{ id: "custom-1", text: "日幣現金" }, { id: "custom-2", text: "充電線" }] };
  const result = Checklist.mergeDuplicates(stored, {}, DEFAULTS);
  assert.equal(result.merged, 1);
  assert.deepEqual(result.stored.custom, [{ id: "custom-2", text: "充電線" }]);
  assert.deepEqual(ids(Checklist.buildItems(DEFAULTS, result.stored)), [...ids(DEFAULTS), "custom-2"]);
});

test("合併時前後空白不影響比對", () => {
  const stored = { v: 1, hidden: [], custom: [{ id: "custom-1", text: " 日幣現金　" }] };
  assert.equal(Checklist.mergeDuplicates(stored, {}, DEFAULTS).merged, 1);
});

test("自己的項目勾過,合併後預設項目也是勾的;自己項目的打勾紀錄拿掉", () => {
  const stored = { v: 1, hidden: [], custom: [{ id: "custom-1", text: "日幣現金" }] };
  const result = Checklist.mergeDuplicates(stored, { "custom-1": true, "checklist-passport": true }, DEFAULTS);
  assert.deepEqual(result.checked, { "checklist-cash": true, "checklist-passport": true });
});

test("預設項目已經勾了,自己的項目沒勾:合併後仍然是勾的", () => {
  const stored = { v: 1, hidden: [], custom: [{ id: "custom-1", text: "日幣現金" }] };
  const result = Checklist.mergeDuplicates(stored, { "checklist-cash": true, "custom-1": false }, DEFAULTS);
  assert.deepEqual(result.checked, { "checklist-cash": true });
});

test("這支手機刪掉了那個預設項目時,保留自己的項目", () => {
  const stored = { v: 1, hidden: ["checklist-cash"], custom: [{ id: "custom-1", text: "日幣現金" }] };
  const result = Checklist.mergeDuplicates(stored, { "custom-1": true }, DEFAULTS);
  assert.equal(result.merged, 0);
  assert.deepEqual(result.stored.custom, [{ id: "custom-1", text: "日幣現金" }]);
  assert.deepEqual(result.checked, { "custom-1": true });
});

test("合併不改到原本的資料", () => {
  const stored = { v: 1, hidden: [], custom: [{ id: "custom-1", text: "日幣現金" }] };
  const checked = { "custom-1": true };
  Checklist.mergeDuplicates(stored, checked, DEFAULTS);
  assert.equal(stored.custom.length, 1);
  assert.deepEqual(checked, { "custom-1": true });
});

test("還原:刪掉的預設項目回到原本的位置,自己的項目不變", () => {
  const before = { v: 1, hidden: ["checklist-passport", "checklist-cash"], custom: [{ id: "custom-1", text: "充電線" }] };
  const after = Checklist.restoreDefaults(before);
  assert.deepEqual(after, { v: 1, hidden: [], custom: [{ id: "custom-1", text: "充電線" }] });
  assert.deepEqual(ids(Checklist.buildItems(DEFAULTS, after)), [...ids(DEFAULTS), "custom-1"]);
});
