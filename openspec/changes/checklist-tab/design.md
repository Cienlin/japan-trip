# Design

## Context

- **現在的行前清單**：
  - 寫死在 `index.html` 行前指南的最後一張卡片
  - 8 個 `<label class="todo-item">`，裡面的 `<input type="checkbox" id="checklist-…">`
  - `app.js` 的 `initChecklist()` 用 input 的 id 當 key，把打勾狀態存進 `STORAGE_KEYS.checklist`（`tokyo_trip_checklist_state`），格式是 `{ "checklist-passport": true, … }`
- **分頁的切換**是通用的：`.tab-btn[data-tab="x"]` 對應 `#pane-x`，`switchTab()` 只切換 class。加一個分頁只要加按鈕和 pane
- **手機版分頁列**：底部 64px，4 個按鈕是「圖示在上、文字在下」
- **電腦版分頁列**：在 420px 寬的側邊欄裡，按鈕是「圖示＋文字」橫排
- **已經有的做法**：
  - 純函式拆成模組加 `node --test`：`basemap.js`、`budget.js`
  - 自訂確認視窗 `confirmDialog()`
- **外觀**：照 `notebook-look` 的「藍墨水手帳」
  - 便條：`--bg-card` 加 `--note-shadow`
  - 紙膠帶標題：`.card-header`
  - 只有底線的輸入欄
  - 行前清單手繪感的方框
- 動機見 proposal.md，行為見 `specs/packing-checklist/spec.md`

## Goals / Non-Goals

**Goals:**

- 清單的組合、新增、刪除、還原都是純函式，有測試；畫面只負責顯示和輸入
- 改版前勾過的項目照樣是勾選的，不用轉換資料

**Non-Goals:**

- 不能修改項目文字（刪掉重加）
- 不能調整順序
- 不分類別
- 不跨手機同步（沒有後端，見 backlog B9）
- 不顯示完成進度（例如 3/8）

## Decisions

### 1. 預設項目搬到 `data.js` 的 `TRIP_METADATA.checklist`

- 格式是 `[{ id, text }]`，id 沿用現在 input 的 id（`checklist-passport`⋯），原本的打勾紀錄直接對得上
- 主揪要幫大家加預設項目時，跟改其他旅程資料一樣改 `data.js`
- `tools/check-data.js` 檢查三件事：是陣列、id 不重複、文字不空白
- **替代方案**：繼續寫在 `index.html`
- **不採用的原因**：畫面改由 `app.js` 依資料產生，項目寫在 HTML 就得另外解析

### 2. 存在手機上的資料：打勾沿用原本的 key，項目另外存

- **打勾**：沿用 `tokyo_trip_checklist_state`，格式不變。刪除項目時，順便刪掉它的打勾紀錄
- **項目**：新增 `STORAGE_KEYS.checklistItems`（`tokyo_trip_checklist_items`），格式是 `{ v: 1, hidden: [預設項目 id], custom: [{ id, text }] }`
  - 自己的項目 id 是 `custom-<時間戳記>-<亂數>`，不會跟預設項目撞到
- 讀到格式不對的資料時當成空的。只略過有問題的那幾筆，其他照常顯示
- **替代方案**：把整份清單（含預設項目）存進手機
- **不採用的原因**：主揪之後改的預設項目就到不了旅伴的手機

### 3. 純函式放在新的 `checklist.js`

跟 `budget.js` 一樣：
- 用一般 `<script>` 在 `app.js` 之前載入，定義全域的 `Checklist`
- 加上 `module.exports` 的判斷，`node --test` 才能載入
- 測試在 `tests/checklist.test.js`

| 函式 | 做什麼 |
|---|---|
| `normalize(raw)` | 把手機上的資料整理成 `{ v: 1, hidden, custom }`，丟掉格式不對的部分 |
| `buildItems(defaults, stored)` | 組出要顯示的清單：沒被刪的預設項目，再接自己的項目，每項標示是不是預設項目 |
| `parseText(text)` | 檢查新項目的文字。成功回傳 `{ ok: true, value }`；失敗回傳 `{ ok: false, reason: "empty" \| "tooLong" }`。去掉前後空白（含全形空白），最多 40 字 |
| `addItem(stored, text, id)` | 回傳加了一項的新資料 |
| `removeItem(stored, id, defaults)` | 預設項目加進 `hidden`；自己的項目從 `custom` 拿掉 |
| `restoreDefaults(stored)` | 清空 `hidden` |

替代方案是寫在 `app.js` 裡。但 Claude 不能在瀏覽器驗證，邊界情況又多，例如預設項目改版、資料壞掉、刪預設與刪自己的項目要分開處理，所以要能測試。

### 4. 畫面：一張便條

`#pane-checklist` 只有一張 `.logistics-card`，標題「行前清單 (5人出發)」寫在紙膠帶上。由上到下：

1. 清單：`.todo-item` 的手繪方框；每一項右邊有刪除鈕，跟花費明細的刪除鈕一樣
2. 全部刪光時，顯示「清單是空的，可以從下面加入要帶的東西。」
3. 新增：只有底線的輸入欄，加上「加入」按鈕。用 form submit，按 Enter 也能加入；空白或超過 40 字時顯示提示
4. 有刪過預設項目時，顯示「還原被刪掉的預設項目」按鈕
5. 小字說明：清單只存在這支手機

刪除用 `confirmDialog()` 確認，訊息是「刪除「〇〇」？」。項目文字一律經過 `escapeHtml()`。

### 5. 電腦版分頁改成直排

5 個「圖示＋文字」橫排的按鈕，放不進 420px 的側邊欄。電腦版也改成「圖示在上、文字在下」，跟手機版一致。螢光筆只畫在 `.tab-label` 上，不受影響。

## Risks / Trade-offs

- **[手機版 5 個分頁比較擠]** 375px 寬的手機，每個分頁約 71px，四個字的名稱大約 50px，放得下
  - 測試清單請使用者看最窄的手機
- **[刪掉的預設項目還原後是沒勾的]** 刪除時就清掉打勾紀錄了，還原後要重新勾
  - 規格已經寫明
- **[自己的項目只存在手機]** 清除瀏覽器資料或換手機就沒了，跟記帳、本機修改一樣
  - 清單下方寫明

## Migration Plan

1. 照 tasks.md 改完，跑 `node --test`、`node tools/check-data.js`、`node --check`
2. 版號升到 v1.6.0，commit、push，給使用者手機測試清單
   - 特別測：改版前勾過的項目還是勾的
3. 實測沒問題後跑 `/code-review`，然後歸檔
4. **退回**：`git revert` 後 push。手機上原本的打勾紀錄 key 沒變，退回後仍然有效；新增的 `tokyo_trip_checklist_items` 舊版不會讀，留著不影響
