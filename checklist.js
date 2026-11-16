// 行前清單的純函式 (不碰 DOM)
// 瀏覽器:跟 data.js 一樣用一般 <script> 載入,在 app.js 之前,定義全域的 Checklist
// Node:module.exports,給 tests/checklist.test.js 用 (node --test)
//
// 手機上存的項目資料:{ v: 1, hidden: [刪掉的預設項目 id], custom: [{ id, text }] }
// 預設項目在 data.js 的 TRIP_METADATA.checklist;打勾狀態另外存 (app.js 的 STORAGE_KEYS.checklist)
const Checklist = (() => {
  const MAX_LENGTH = 40;

  const isNonEmptyString = (value) => typeof value === "string" && value.trim() !== "";

  // 手機上讀到的資料整理成固定格式;格式不對的部分丟掉,其他保留
  function normalize(raw) {
    const data = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    const hidden = Array.isArray(data.hidden) ? data.hidden.filter(isNonEmptyString) : [];
    const custom = Array.isArray(data.custom)
      ? data.custom
        .filter((item) => item && isNonEmptyString(item.id) && isNonEmptyString(item.text))
        .map((item) => ({ id: item.id, text: item.text }))
      : [];
    return { v: 1, hidden, custom };
  }

  // 要顯示的清單:沒被刪掉的預設項目,再接自己加的項目 (依加入順序)
  function buildItems(defaults, stored) {
    const { hidden, custom } = normalize(stored);
    const defaultItems = (Array.isArray(defaults) ? defaults : [])
      .filter((item) => !hidden.includes(item.id))
      .map((item) => ({ id: item.id, text: item.text, isDefault: true }));
    return defaultItems.concat(custom.map((item) => ({ id: item.id, text: item.text, isDefault: false })));
  }

  // 新項目的文字:去掉前後空白 (含全形空白),最多 40 字
  // 回傳 { ok: true, value } 或 { ok: false, reason: "empty" | "tooLong" }
  function parseText(text) {
    const value = String(text ?? "").trim();
    if (!value) return { ok: false, reason: "empty" };
    if ([...value].length > MAX_LENGTH) return { ok: false, reason: "tooLong" };
    return { ok: true, value };
  }

  function addItem(stored, text, id) {
    const data = normalize(stored);
    return { ...data, custom: [...data.custom, { id, text }] };
  }

  // 預設項目:記進 hidden (只在這支手機不顯示);自己的項目:直接拿掉
  function removeItem(stored, id, defaults) {
    const data = normalize(stored);
    const isDefault = (Array.isArray(defaults) ? defaults : []).some((item) => item.id === id);
    if (isDefault) {
      return data.hidden.includes(id) ? data : { ...data, hidden: [...data.hidden, id] };
    }
    return { ...data, custom: data.custom.filter((item) => item.id !== id) };
  }

  function restoreDefaults(stored) {
    return { ...normalize(stored), hidden: [] };
  }

  // 自己加的項目跟預設項目文字一樣 (例如主揪後來把它加進預設項目) → 併進預設項目,清單只出現一次
  // 打勾:任一份勾過,合併後就是勾的;這支手機刪掉了那個預設項目時不合併,保留自己的項目
  // 回傳 { stored, checked, merged: 合併了幾項 },不改到傳進來的資料
  function mergeDuplicates(stored, checked, defaults) {
    const data = normalize(stored);
    const nextChecked = { ...(checked && typeof checked === "object" ? checked : {}) };
    const visibleDefaultIdByText = new Map(
      (Array.isArray(defaults) ? defaults : [])
        .filter((item) => !data.hidden.includes(item.id))
        .map((item) => [String(item.text).trim(), item.id])
    );
    const custom = [];
    let merged = 0;
    data.custom.forEach((item) => {
      const defaultId = visibleDefaultIdByText.get(item.text.trim());
      if (!defaultId) {
        custom.push(item);
        return;
      }
      merged++;
      if (nextChecked[item.id] === true) nextChecked[defaultId] = true;
      delete nextChecked[item.id];
    });
    return { stored: { ...data, custom }, checked: nextChecked, merged };
  }

  return { MAX_LENGTH, normalize, buildItems, parseText, addItem, removeItem, restoreDefaults, mergeDuplicates };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = Checklist;
}
