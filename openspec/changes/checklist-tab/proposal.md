# Proposal

## Why

行前清單現在放在行前指南的最下面，只有 8 個固定項目，要捲很久才看得到，也不能加自己要帶的東西。使用者 2026-11-16 決定：行前清單獨立成一個分頁，每個人可以在自己的手機新增、刪除項目。出發前就要用，所以在凍結期破例，跟外觀改版（`notebook-look`）一起上線。

## What Changes

- 新增「行前清單」分頁，放在最後。分頁順序改成：行程規劃｜美食景點｜預算｜行前指南｜**行前清單**
- **BREAKING**：行前指南拿掉行前清單，整個搬到新分頁
- **預設項目**：
  - 現在的 8 個項目變成預設項目，寫進旅程資料 `TRIP_METADATA.checklist`，主揪改 `data.js` 就能幫大家加或改
  - 項目的 id 沿用現在的，所以手機上原本勾過的項目會保留
- **自己的項目**：旅伴可以在清單下方輸入文字加入新項目
  - 只存在自己的手機
  - 最多 40 個字；空白不能加入
- **刪除**：
  - 每個項目都可以刪除，預設項目也可以，刪除前要確認
  - 刪掉的預設項目只是在這支手機上不顯示。有刪過預設項目時，清單下方會出現「還原被刪掉的預設項目」
- 打勾狀態、自己的項目、刪掉的預設項目，都只存在各自的手機
- 外觀照「藍墨水手帳」：整份清單是一張便條，標題寫在紙膠帶上；新增的輸入欄只有底線
- 手機版底部分頁列從 4 個變成 5 個。電腦版側邊欄的分頁改成「圖示在上、文字在下」，5 個分頁才排得下

## Capabilities

### New Capabilities

- `packing-checklist`：行前清單分頁，包括預設項目、新增與刪除自己的項目、還原刪掉的預設項目，以及這些資料只存在各自的手機

### Modified Capabilities

- `pre-trip-guide`：拿掉「行前清單」需求，搬到 `packing-checklist`

## Impact

- **程式**：
  - `index.html`：新分頁按鈕與 `#pane-checklist`、行前指南拿掉清單、載入新的 `checklist.js`、版號
  - `app.js`：清單的畫面與互動取代原本的 `initChecklist()`
  - `style.css`：清單的樣式；電腦版分頁按鈕改成直排
  - `data.js`：新增 `TRIP_METADATA.checklist`
  - `tools/check-data.js`：檢查清單資料
  - `sw.js`：版號；`SHELL_ASSETS` 加入 `checklist.js`
- **新檔案**：清單的純函式 `checklist.js` 與 `tests/checklist.test.js`
- **手機上的資料**：原本的打勾紀錄（`tokyo_trip_checklist_state`）沿用；新增 `tokyo_trip_checklist_items`，存自己的項目與刪掉的預設項目
- **文件**：
  - `CLAUDE.md`、`README.md`、`GLOSSARY.md`（行前清單的定義）
  - `docs/roadmap.md`（凍結期破例）
  - `pre-trip-guide` 規格的 Purpose
  - `notebook-look` 外觀規格裡「區塊是便條紙」的範圍，要加上行前清單
- **風險**：
  - push 到 `main` 就會更新 5 個人的手機
  - 自己的項目只存在各自的手機，清除瀏覽器資料就會消失，跟記帳一樣
