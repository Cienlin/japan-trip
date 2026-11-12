# Tasks

## 1. 準備

- [ ] 1.1 `docs/roadmap.md` 的 Phase 2 註明預算分頁是凍結期的破例。驗證：roadmap 的 Phase 2 與「目前進度」都有寫到

## 2. 金額解析與預算加總（純函式與測試）

- [ ] 2.1 先寫 `tests/budget.test.js`（`node --test`），涵蓋：
  - 金額：`2050` = 2050、`2,050` 與全形 `２０５０` = 2050、前後空白、空白是 `empty`、`0` 是 `zero`、`12.5`、`-300`、`1200+850`、`12a` 是 `invalid`、超過 9 位數是 `invalid`
  - 加總：預算空白時 `status` 是 `"unset"`；`{ 50000, 14424, 9061, 0.21, ¥32,600 }` → 總花費 30331、61%、剩餘 19669、`"under"`；80% 以上是 `"near"`；超過是 `"over"` 且剩餘是負數
  - 設定轉換：v2 的 rate、flight 保留、pocket 丟掉；沒有 v 的舊資料跟舊預設值相同時丟掉

  驗證：`budget.js` 還沒寫之前，測試會失敗
- [ ] 2.2 實作 `budget.js`：`parseAmount`、`summarize`、`migrateSettings`。驗證：`node --check budget.js` 與 `node --test "tests/*.test.js"` 全部通過；暫時拿掉幾個判斷（全形轉換、0 的檢查、`"near"` 的門檻、pocket 丟掉），對應的測試會失敗，還原後通過
- [ ] 2.3 `index.html` 在 `app.js` 之前載入 `budget.js`，`sw.js` 的 `SHELL_ASSETS` 加入 `budget.js`。驗證：`node --check sw.js`、`SHELL_ASSETS` 每個檔案都存在、`node tools/check-data.js` 沒有 ❌

## 3. 預算分頁

- [ ] 3.1 `index.html`：
  - `.tab-navigation` 在美食景點與行前指南之間加「預算」按鈕（`data-tab="budget"`、圖示 `savings`）
  - 新增 `#pane-budget`，由上到下：設定、記一筆（金額欄 `type="text" inputmode="numeric" pattern="[0-9]*"`、備註、加入、錯誤提示）、結果、花費明細
  - 拿掉行前指南的「旅程預算與花費計算機」卡片

  驗證：`node tools/check-data.js` 沒有 ❌，grep 確認 `#pane-logistics` 裡沒有 `calc-` 欄位
- [ ] 3.2 `data.js` 拿掉 `TRIP_METADATA.budget.targetTwd`、`pocketJpy`；`tools/check-data.js` 改成只檢查 `flightTwd`、`jpyRate`。驗證：`node tools/check-data.js` 沒有 ❌，grep 確認程式不再用到這兩個欄位
- [ ] 3.3 `app.js`：
  - `initBudgetCalculator()` 改寫成 `initBudgetTab()`：讀設定時用 `Budget.migrateSettings()` 並存回 v3
  - 總預算、機票、匯率欄位只記改過的值
  - 加入花費（`Budget.parseAmount()`，不合法時顯示提示）、刪除前 `confirm()`、明細（最新在上、日期、備註經 `escapeHtml()`）
  - 結果區用 `Budget.summarize()`
  - `STORAGE_KEYS` 加 `expenses`

  驗證：`node --check app.js`，逐一對照 `specs/budget/spec.md` 每條需求的程式路徑
- [ ] 3.4 `style.css`：預算分頁版面（記一筆、明細清單、未填總預算的提示）；手機版底部分頁列改成圖示在上、文字在下。驗證：手機版規則在 768px 以下的 media query 裡，`:hover` 規則都包在 `@media (hover: hover)`
- [ ] 3.5 文件：
  - `CLAUDE.md`：預算的資料位置，包括 `STORAGE_KEYS.budget` v3、`expenses`、`TRIP_METADATA.budget` 剩下的欄位、`budget.js` 與測試
  - `README.md`：功能與檔案結構
  - `GLOSSARY.md`：「預算」區塊加入總預算、花費、目前花費、目前總花費、剩餘預算，「預算計算機」移過去並改寫

  驗證：用詞跟規格一致
- [ ] 3.6 更新版號，commit 並 push。給使用者手機測試清單：
  - 4 個分頁的順序與手機版排版；結果區在明細上方
  - 總預算空白時的提示，填了之後的百分比與剩餘預算
  - 記帳：點金額欄出現數字鍵盤、記一筆有備註與沒備註的、空白與 0 不能加入
  - 刪除與取消刪除、重開 App 後資料還在
  - 之前改過機票或匯率的手機，值有保留
  - 行前指南看不到計算機

  驗證：使用者回報全部通過；有問題時修好再重測

## 4. 收尾

- [ ] 4.1 執行 `/code-review`（medium 以上），每個 finding 都要處理：修正、說明理由拒絕，或記到 `docs/backlog.md`。驗證：所有 finding 都有處理結果
- [ ] 4.2 更新 `docs/roadmap.md` 的「目前進度」；歸檔（`/opsx:archive budget-tab`），同步規格，並把 `openspec/specs/pre-trip-guide` 的 Purpose 拿掉「預算計算機」；commit 並 push。驗證：`openspec/specs/budget` 已建立，`pre-trip-guide` 不再有預算需求，change 移到 `archive/`
