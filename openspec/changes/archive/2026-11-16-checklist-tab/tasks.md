# Tasks

## 1. 準備

- [x] 1.1 修改 `docs/roadmap.md`：Phase 2 和「目前進度」註明行前清單分頁（`checklist-tab`）是凍結期的破例。驗證：roadmap 兩處都寫到

## 2. 清單的純函式與測試

- [x] 2.1 先寫 `tests/checklist.test.js`（`node --test`），涵蓋：
  - `normalize`：
    - null、字串、壞掉的 JSON 結構 → 空的 `{ v: 1, hidden: [], custom: [] }`
    - `custom` 裡缺 id 或文字的那筆要丟掉，其他保留
  - `buildItems`：
    - 預設項目在前、自己的項目在後
    - `hidden` 的預設項目不出現
    - 預設項目新增一項時會出現
    - `hidden` 裡已經不存在的 id 不影響結果
  - `parseText`：
    - `"充電線"` 成功
    - 前後空白（含全形空白）會去掉
    - 空白 → `empty`
    - 41 個字 → `tooLong`，40 個字成功
  - `addItem`：加在最後
  - `removeItem`：預設項目進 `hidden`；自己的項目從 `custom` 拿掉；不存在的 id 不變
  - `restoreDefaults`：`hidden` 清空，`custom` 不變

  驗證：`checklist.js` 還沒寫之前，測試會失敗
- [x] 2.2 實作 `checklist.js`。驗證：
  - `node --check checklist.js` 通過，`node --test "tests/*.test.js"` 全部通過
  - 暫時拿掉 3 個判斷（hidden 過濾、空白檢查、刪預設項目時改用 hidden），對應的測試會失敗；還原後通過

## 3. 資料與網頁

- [x] 3.1 `data.js` 新增 `TRIP_METADATA.checklist`：8 個預設項目，id 與文字照 `index.html` 現在的內容；`tools/check-data.js` 檢查清單資料（是陣列、id 不重複、文字不空白）。驗證：`node tools/check-data.js` 沒有 ❌；故意把一個 id 改成重複的，會出現 ❌，改回後沒有
- [x] 3.2 修改 `index.html`：
  - 分頁列最後加「行前清單」按鈕：`data-tab="checklist"`、圖示 `playlist_add_check`、文字包在 `.tab-label` 裡
  - 新增 `#pane-checklist`：一張 `.logistics-card`，裡面有清單容器、空清單提示、新增表單（只有底線的輸入欄、`maxlength="40"`、加入按鈕、錯誤提示）、還原按鈕、說明小字
  - 拿掉行前指南的「行前清單」卡片
  - 在 `app.js` 之前載入 `checklist.js`

  驗證：
  - `node tools/check-data.js` 沒有 ❌，圖示已經在 `icon_names` 裡
  - grep 確認 `#pane-logistics` 裡沒有 `packing-checklist`
- [x] 3.3 `sw.js` 的 `SHELL_ASSETS` 加入 `checklist.js`。驗證：`node --check sw.js`；`SHELL_ASSETS` 列的每個檔案都存在

## 4. 畫面與互動

- [x] 4.1 修改 `app.js`：
  - `STORAGE_KEYS` 加 `checklistItems`
  - `initChecklist()` 改寫：讀資料時用 `Checklist.normalize()`；用 `Checklist.buildItems()` 畫出清單，文字經過 `escapeHtml()`
  - 打勾：存回 `STORAGE_KEYS.checklist`
  - 新增：用 `Checklist.parseText()` 檢查，不合法時提示並回到輸入欄
  - 刪除：先 `confirmDialog()` 確認，同時刪掉打勾紀錄
  - 還原：有刪過預設項目時才顯示

  驗證：
  - `node --check app.js` 通過
  - grep 確認清單文字都經過 `escapeHtml()`
  - 用 node 模擬一份改版前的打勾紀錄，`buildItems` 的 id 對得上
- [x] 4.2 修改 `style.css`：
  - 清單項目右側的刪除鈕
  - 新增欄與加入按鈕排在同一行，輸入欄只有底線
  - 還原按鈕、空清單提示
  - 電腦版分頁按鈕改成直排

  驗證：用 css-lint 檢查大括號成對、`:hover` 都在 `@media (hover: hover)` 裡；沒有寫死的顏色

- [x] 4.3 （2026-11-16 補）使用者把手機上自己加的 17 項整理成預設項目後，清單出現重複：
  - `checklist.js` 新增 `mergeDuplicates()`：自己的項目跟沒被刪掉的預設項目文字一樣時，併進預設項目，任一份勾過就是勾的
  - `app.js` 打開清單時先合併並存回手機
  - 規格補「跟預設項目重複的自己的項目」

  驗證：
  - 先寫 6 個測試（會失敗）再實作，`node --test` 全部通過
  - 暫時拿掉「刪掉的預設項目不合併」與「搬打勾」，對應的測試會失敗

## 5. 文件、版號與上線

- [x] 5.1 更新文件：
  - `GLOSSARY.md`：行前指南拿掉行前清單；行前清單的定義加上預設項目與自己的項目
  - `CLAUDE.md`：`TRIP_METADATA.checklist` 的說明，以及分頁順序
  - `README.md`：功能列表
  - `openspec/specs/pre-trip-guide/spec.md` 的 Purpose 拿掉行前清單
  - `notebook-look` 的 appearance 規格差異：「區塊是便條紙」加上行前清單

  驗證：這幾份文件都寫到；`openspec validate checklist-tab --strict` 與 `openspec validate notebook-look --strict` 通過
- [x] 5.2 版號升到 v1.6.0，跑靜態檢查。驗證：`node --check`（app.js、sw.js、checklist.js）、`node tools/check-data.js` 沒有 ❌、`node --test "tests/*.test.js"` 全部通過
- [x] 5.3 commit、push，給使用者手機測試清單。要測的包括：
  - 改版前勾過的項目還是勾的
  - 新增項目、空白提示、40 字上限
  - 刪除預設項目與自己的項目，確認時取消
  - 還原、關掉重開後資料還在
  - 行前指南裡已經沒有清單
  - 5 個分頁在窄手機上排得下
  - 電腦版的分頁

  驗證：使用者實測回報，問題都修正
- [x] 5.4 實測沒問題後跑 `/code-review`，每個發現都要處理：修正、說明理由後不採用，或記進 `docs/backlog.md`。驗證：審查結果整理給使用者
  - 2026-11-16 `/code-review medium`（範圍 ef36e79..HEAD，包含 notebook-look 與 checklist-tab）：沒有發現錯誤。3 個小地方的處理：
    - **修正**：`initChecklist()` 的註解說「舊的打勾紀錄直接對得上」，預設項目換成 21 項後只有 4 項沿用，註解改正（v1.6.3）
    - **不採用**：加入跟看得到的預設項目同文字的項目時會先出現兩次、重開 app 才合併。理由：這是合併設計本來的行為，清單上看得到那一項，不太會重複加
    - **不採用**：輸入欄的 `maxlength="40"` 把 emoji 算 2 個字。理由：只是比「40 字」更嚴，不會壞資料，清單項目很少用 emoji
    - 審查只抽查了 `style.css`，外觀由使用者手機實測確認
