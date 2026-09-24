# 東京冬日 5 人行 — Claude Code 專案說明

2026/12/9 ~ 12/14 東京 5 人自由行的 PWA 行程網站。純靜態網站（HTML/CSS/JS，沒有建置步驟），從 `main` 部署到 GitHub Pages：<https://cienlin.github.io/japan-trip/>。使用者和 4 位朋友都把它加到手機主畫面使用。

## 工作流程

- **開始修改前先 `git pull`**：使用者會在公司與家裡兩台電腦輪流修改
- **使用者只能在 push 之後用手機實測**：改完要 commit 並 push，再給使用者具體的手機測試步驟（預期看到什麼）
- **不要自己跑瀏覽器測試**：不用 headless 瀏覽器、puppeteer、本機伺服器（公司電腦的 IT 政策也禁止）。只做 `node --check`、讀程式碼與資料、用 node 跑純函式等靜態檢查
- **版號**：只要改到 HTML / CSS / JS / `data.js` / `image-manifest.js`，就要同時更新 `sw.js` 的 `VERSION` 與 `index.html` 的 `#version-badge`（兩處一致，例如 `v1.3.7`）。使用者靠左上角的版號確認手機是否已更新。只改 README、docs 不用更新版號
- **commit 訊息**：繁體中文，前綴 `fix:` / `feat:` / `data:` / `docs:` / `refactor:`，最後一行列出版號
- **在 Windows 的 Git Bash 裡**，heredoc 或 `node -e` 內的反斜線會被吃掉：含正規表示式的腳本請先寫成檔案再執行

## 行程資料 `data.js`

- `TRIP_METADATA`：機票、飯店、預算用數字
- `PLACES`：每個地點的欄位
  - `category`：`food` / `shopping` / `sightseeing` / `lodging` / `transport`
  - `day`：1～6；`null` 代表候補（不排入行程）
  - `time`：`"HH:MM"`
  - `dayStart: true`：當天從這裡出發（例如 Day 1 的成田機場），它前面不顯示交通，地圖路線從它開始畫；沒有的話，每天預設從飯店出發
  - `imageFolder`：照片資料夾名稱（見下方「照片」）
  - `transitInfo`：**描述「從前一站怎麼到這裡」**，欄位有 `from`、`method`（walk/subway/train/bus）、`line`、`duration`（分鐘）、`details`
- **移動、新增、刪除地點時，前後站的 `transitInfo` 都要跟著檢查**：後一站的 `from` 與交通說明要改成新的前一站。App 會比對「前一站」與 data.js 的原始行程，不一致時改顯示 Google Maps 路線，所以 data.js 本身要保持正確
- 飯店 `syla_hotel`（app.js 的 `HOTEL_ID`）是 Day 1 19:00 的 check-in 站，也是每天路線的起點，Day 6 以外會回到飯店
- 回程機場 `narita_airport_return` 是 Day 6 的最後一站

## 使用者的修改需求

- 使用者會貼上 `## 本次變更`（格式見 `docs/行程變更範本.md`），可能來自範本，也可能來自 app 的「複製變更內容」
- **使用者寫的名稱與介紹照原樣輸入，不要修正錯字**（使用者明確要求過）
- 貼上的內容可能包含上次已套用的項目，套用前先比對 data.js，只處理新的部分，並告訴使用者哪些已經套用過
- **行前指南的文字寫死在 `index.html`**（不在 data.js）：刪除地點或改天數時，要一併檢查並更新 index.html 裡提到它的地方
- 交通說明如果是依地圖推估的，要請使用者用 Google Maps 確認

## 照片

- 每個地點一個資料夾：`images/<data.js 的 imageFolder>/`，檔名用數字（`1.jpg`、`2.png`⋯），依數字排序，第 1 張是封面；多個地點可以共用同一個資料夾
- 使用者說「圖片放好了」：執行 `node tools/sync-images.js` 重新產生 `image-manifest.js`（自動產生，不要手動修改），處理它列出的警告，更新版號後 commit 並 push
- 超過 500KB 的照片：使用者同意轉成 JPG、寬度縮到 1200px、品質 85（只處理超過 500KB 的），原始檔先備份
- 網址帶有內容指紋 `?v=`，同名換圖時手機也會重新下載

## App 架構重點

- `app.js`：整個 app 包在一個 `DOMContentLoaded` 裡。儲存名稱統一用 `STORAGE_KEYS`，讀取 localStorage 用 `readJson()`，飯店用 `HOTEL_ID`
- **本機編輯**：內建地點的修改存成 localStorage 的 override（`EDITABLE_FIELDS`），自訂地點存在 `tokyo_trip_custom_places`，都只存在各自的手機。開啟時會自動清掉「已經跟 data.js 相同」的 override，以及「data.js 已有同名同座標地點」的自訂地點
- 使用者輸入的內容一律經過 `escapeHtml()` / `safeUrl()`，圖片網址用 `cssEscapeUrl()`
- `sw.js`：頁面檔案採 network-first（`cache: 'no-cache'`，3 秒逾時才用快取）；圖片與地圖圖磚採 cache-first；新增頁面要用到的檔案時，記得加進 `SHELL_ASSETS`
- CSS：`:hover` 規則要包在 `@media (hover: hover)` 裡（避免手機點擊後 hover 卡住）；顏色用 `:root` 與 `body.theme-dark` 的變數；用 `hidden` 屬性隱藏元素
- 註解使用繁體中文
