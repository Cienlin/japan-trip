# Design

## Context

- 預算計算機現在是行前指南（`#pane-logistics`）裡的一張卡片，由 `app.js` 的 `initBudgetCalculator()` 處理：
  - 三個輸入欄：匯率、機票、零用金
  - 住宿是固定值 `accommodation.perPersonTwd`
  - 預算目標來自 `TRIP_METADATA.budget.targetTwd`
- 手機上的預算設定存在 `STORAGE_KEYS.budget`（`tokyo_trip_budget_inputs`），格式是 `{ v: 2, rate?, flight?, pocket? }`，只記改過的欄位；`LEGACY_DEFAULTS` 處理 v1.4.1 以前沒有 `v` 的舊資料
- 分頁：`index.html` 的 `.tab-navigation` 有 3 個 `.tab-btn[data-tab]`，對應 `#pane-<name>`；`switchTab()` 依 `data-tab` 切換。手機版點分頁會展開底部面板（`.sidebar.expanded`）
- 手機版底部分頁列高 64px，按鈕是「圖示＋文字」橫排、`flex: 1`
- 已經有拆出來測試的純函式模式：`basemap.js` 加上 `tests/basemap.test.js`（`node --test`）
- Claude 不能跑瀏覽器，畫面行為要使用者 push 後用手機實測
- 動機見 proposal.md；行為規格見 `specs/budget/spec.md`

## Goals / Non-Goals

**Goals:**
- 金額解析與預算加總都是純函式，有測試；畫面只負責輸入與顯示
- 舊的預算設定（改過的機票、匯率）沿用，不讓旅伴重填

**Non-Goals:**
- 不支援算式、不做計算機鍵盤（使用者決定先只輸入數字）
- 不分類別、不做統計圖表、不做每日小計
- 不能修改已記的一筆（刪掉重記）
- 不跨手機同步、不匯出（沒有後端，見 backlog B9）
- 不改行前指南的其他內容

## Decisions

### 1. 純函式放在新的 `budget.js`，用 `node --test` 測試

跟 `basemap.js` 一樣：一般 `<script>` 載入（在 `app.js` 之前），定義全域的 `Budget`，加上 `module.exports` 判斷。測試在 `tests/budget.test.js`。內容：
- `parseAmount(text)` → `{ ok: true, value }` 或 `{ ok: false, reason }`
- `parseSetting(key, text)` → 設定欄位（總預算、機票、匯率）合法時回傳數字，否則 `null`；存進手機與畫面計算共用，不合法時畫面改用預設值（程式碼審查發現負數會被算進總額）
- `summarize({ budgetTwd, flightTwd, hotelTwd, rate, expenses })` → `spentJpy`、`spentTwd`、`totalTwd`、`percentage`、`remainingTwd`、`status`（`"unset" | "under" | "near" | "over"`）
- `migrateSettings(stored, legacyDefaults)` → 新格式的設定

替代方案：寫在 `app.js` 裡。舊資料轉換與加總的邊界情況（空白預算、80% 門檻、超支）容易出錯，Claude 又不能在瀏覽器驗證，所以要能測試。

### 2. 金額只接受正整數

- 先把全形數字轉成半形，去掉空白與千分位逗號（`2,050`、`２０５０` 都是 2050）
- 剩下的必須全部是數字，而且大於 0
- 不同情況的處理：

| 情況 | 結果 | 提示 |
|---|---|---|
| 空白 | `reason: "empty"` | 輸入時不提示；按加入（或在備註欄按 Enter）時提示「請先輸入金額」。加入按鈕不停用，因為按鈕停用時按 Enter 不會送出表單（程式碼審查發現） |
| 有數字以外的字元，例如 `12.5`、`-300`、`1200+850` | `reason: "invalid"` | 金額要是大於 0 的整數 |
| 0 | `reason: "zero"` | 金額要是大於 0 的整數 |

- 長度上限 9 位數，最多 ¥999,999,999，避免異常輸入

### 3. 數字鍵盤

金額欄用 `type="text"` 加上 `inputmode="numeric"` 與 `pattern="[0-9]*"`，iPhone 和 Android 都會叫出只有數字的鍵盤。

不用 `type="number"` 的原因：
- 它在 iOS 會出現小數點鍵盤
- 它會接受 `e`、`-` 這類字元
- 瀏覽器拿到不合法的輸入時 `value` 會變成空字串，沒辦法告訴使用者哪裡錯

備註用一般文字欄，上限 40 字。

### 4. 手機上的資料

- 設定：沿用 `STORAGE_KEYS.budget`，升級成 `{ v: 3, rate?, flight?, budgetTwd? }`
  - v2 的 `rate`、`flight` 照搬
  - `pocket`（零用金）丟掉
  - 沒有 `v` 的舊資料照原本 `LEGACY_DEFAULTS` 規則轉換
  - 由 `Budget.migrateSettings()` 處理
- 花費：新的 `STORAGE_KEYS.expenses`（`tokyo_trip_expenses`），格式是陣列 `[{ id, amount, note, createdAt }]`
  - `id` 用 `Date.now()` 加亂數
  - `createdAt` 存 ISO 時間，日期用手機的時區顯示（在日本就是日本時間）
- 讀取一律用 `readJson()`；讀到格式不對的花費資料，只留下 `amount` 是正整數的項目；寫入失敗（例如私密瀏覽）不中斷畫面

### 5. 總預算沒有預設值

- `TRIP_METADATA.budget` 拿掉 `targetTwd` 與 `pocketJpy`，只留 `flightTwd`、`jpyRate`
- `tools/check-data.js` 跟著只檢查這兩個
- 總預算欄空白 → `status: "unset"`：結果區照常顯示目前總花費，進度條與剩餘預算換成「先填總預算」的提示

### 6. 分頁與版面

- `.tab-navigation` 加第 4 個按鈕 `data-tab="budget"`（圖示 `savings`，文字「預算」），放在美食景點與行前指南之間；新增 `#pane-budget`。`switchTab()` 本來就依 `data-tab` 運作，不用改
- 預算分頁由上到下（使用者 2026-11-12 選定結果放在明細上方）：
  1. 設定：總預算、機票、住宿分攤（唯讀）、匯率
  2. 記一筆：金額、備註、加入按鈕、錯誤提示
  3. 結果：目前花費（¥ 與 NT$）、目前總花費、進度條與已用 %、剩餘預算或提示
  4. 花費明細：最新在上，每筆有刪除按鈕，刪除前用 `confirm()` 確認
- 手機版底部分頁列改成圖示在上、文字在下（`flex-direction: column`、文字 0.72rem），4 個分頁在 375px 寬的手機也放得下。桌機版維持橫排
- 沿用現有的 `.calc-*`、`.result-item`、`.budget-progress-*` 樣式；備註顯示前經過 `escapeHtml()`

### 7. 行前指南

`index.html` 拿掉「旅程預算與花費計算機」卡片。`initBudgetCalculator()` 改寫成預算分頁用的 `initBudgetTab()`。

## Risks / Trade-offs

- [花費只存在手機，清除瀏覽器資料或換手機就沒了] → 跟其他本機修改一樣，旅程短，可以接受；README 會提醒
- [分帳要自己先算好] → 使用者決定先只輸入數字；之後需要再加算式（`parseAmount` 換成解析器即可，資料格式不變）
- [4 個分頁在很窄的手機（320px）還是擠] → 改成直排並縮小文字；實測有問題再調
- [`confirm()` 在 iOS 主畫面 App 的樣式很陽春] → 功能正確即可，不另做對話框
- [push 到 `main` 就會更新所有人的手機] → 純函式先有測試；舊資料轉換也有測試

## Migration Plan

1. 先寫 `budget.js` 的測試與實作（不影響畫面），push
2. 換上新分頁、拿掉舊計算機，push → 使用者手機實測（含已經改過機票、匯率的手機）
3. 程式碼審查 → 歸檔；歸檔時一併更新 `pre-trip-guide` 規格的 Purpose，拿掉「預算計算機」

要回到舊版的話，revert 這次的 commit。手機上的花費明細存在新的儲存名稱，不會影響舊版。
