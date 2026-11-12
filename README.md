# 東京冬日 5 人行 🇯🇵 互動地圖與行程規劃

2026/12/9 ~ 12/14 東京 6 天 5 夜、5 人自由行的行程網頁。可以加到手機主畫面當 app 使用（PWA），離線也能看行程。

**網址：<https://cienlin.github.io/japan-trip/>**

## 📱 安裝到手機

- **iPhone**：用 Safari 開網址 → 分享 →「加入主畫面」
- **Android**：用 Chrome 開網址 → 選單 →「安裝應用程式」

之後改版不用重新安裝，有網路時打開 app 就會自動更新。左上角的版號可以確認是不是最新版。

## ✨ 功能

- **行程規劃**：D1 ~ D6 時間軸，每一站之間有交通方式、時間，以及「🧭 Google Maps 路線」一鍵導航
- **地圖**：依類別顯示地點（🏨 住宿、🍔 美食、🛍️ 購物、🗼 景點、✈️ 交通），選某一天時會畫出當天路線；底圖用 Google 的高解析度圖面，用不了時自動改用 OpenStreetMap（見下方「Google 地圖底圖」）
- **美食景點**：搜尋、依類別篩選，包含還沒排入行程的候補地點
- **旅行期間**：打開 app 自動顯示今天的行程（依日本時間），時間軸標示「下一站」
- **我的位置**：地圖右上角的定位按鈕，在地圖上顯示自己目前的位置（第一次會詢問定位權限）
- **詳細資訊**：照片輪播（可左右滑）、介紹、交通路線、Google Maps 導航
- **預算**：自己設定總預算，旅途中逐筆記下花了多少日幣，隨時看到目前總花費（機票＋住宿＋目前花費）、已用百分比與剩餘預算；記帳只存在自己的手機
- **行前指南**：機票、飯店、交通票券建議、注意事項、行前清單
- **深淺色主題**：地圖也會跟著切換
- **離線使用**：看過的頁面、所有景點照片，沒有網路也能顯示；地圖會改用 OpenStreetMap，看過的區域也看得到（Google 規定不能把 Google 地圖存在手機上）

### 在手機上調整行程（只存在自己的手機）

在地點的詳細資訊按「編輯」，可以改天數、時間、名稱、介紹與連結，也可以把候補地點排進行程或刪除地點。

- 這些修改**只存在自己的手機**，其他人看不到；刪除主畫面上的 app 時也會一起消失
- 行程頁上方的提示列可以「全部還原」，或「複製變更內容」後貼給 Claude，改成大家共用的行程

## 🛠️ 修改共用行程

所有人看到的行程都來自 `data.js`，修改後 push 到 GitHub，大家打開 app 就會更新。

- **行程、地點**：照 [`docs/行程變更範本.md`](docs/行程變更範本.md) 填寫，或直接用 app 的「複製變更內容」，交給 Claude 修改
- **地點照片**：放進 `images/<地點名稱>/`，用數字命名（`1.jpg`、`2.jpg`⋯，第 1 張是封面），再執行 `node tools/sync-images.js` 更新圖片清單（也會提醒不同地點用了同一張照片）
- **檢查資料**：改完 `data.js` 或 `index.html` 後執行 `node tools/check-data.js`，會檢查交通說明是否對應前一站、時間與天數格式、座標、預算欄位、圖示有沒有列進字型網址等
- **預算分頁**：機票與匯率的預設值在 `data.js` 的 `TRIP_METADATA.budget`，每人分攤住宿在 `TRIP_METADATA.accommodation.perPersonTwd`；改了之後大家的手機都會更新（自己在手機上改過的欄位除外）。總預算沒有預設值，各自填

## 📁 檔案結構

| 檔案 | 說明 |
|---|---|
| `index.html` | 網頁架構，行前指南的文字內容也在這裡 |
| `style.css` | 樣式（手機版面、深淺色主題） |
| `app.js` | 網頁邏輯（地圖、時間軸、編輯功能、預算分頁） |
| `basemap.js` | 地圖底圖的判斷邏輯（Google 通行碼能不能沿用、什麼時候改用 OpenStreetMap），測試在 `tests/` |
| `budget.js` | 預算分頁的計算（金額解析、目前總花費與剩餘預算、手機上舊設定的轉換），測試在 `tests/` |
| `data.js` | 行程資料：機票、飯店、每個地點的座標、時間、介紹、交通、圖片資料夾 |
| `images/<地點名稱>/` | 每個地點的照片 |
| `image-manifest.js` | 圖片清單，由 `tools/sync-images.js` 自動產生，不要手動修改 |
| `sw.js` | Service Worker（離線快取與自動更新） |
| `manifest.json`、`icon.svg`、`*.png` | PWA 設定與 app 圖示 |
| `assets/` | Google 官方的 Google Maps logo（淺色、深色地圖各一個，不可修改） |
| `tests/` | 純函式的測試，執行 `node --test "tests/*.test.js"` |
| `tools/` | `sync-images.js`（產生圖片清單）、`check-data.js`（檢查行程資料） |
| `docs/` | 行程變更範本與行程筆記 |

## 🗺️ Google 地圖底圖

地圖底圖用 Google Map Tiles API 的 2D 圖磚（2026-11 起），在 Google Cloud 主控台設定。

- **金鑰會公開在網頁原始碼裡**：網頁版的 Google 地圖一定是這樣，GitHub 會寄「Secrets detected」的警告信，選「Won't fix」關掉即可，不用撤銷。保護方式是：
  - 網站限制：只允許 `https://cienlin.github.io/*`
  - API 限制：只允許 Map Tiles API
  - 每日上限：`2D Tiles requests per day` 設成 **3,000**，整個月最多 93,000 張，不超過每月免費的 100,000 張，所以不會收費
  - 不要調低 `2D Tiles and Street View Tiles uncharged requests per day`（不計費的通行碼與版權文字請求）
- **付費方式**：即付即用，不要選訂閱方案（Starter、Essentials、Pro 是月費方案）
- **用不了時**：服務停用、超過當天上限（日本時間 17:00 重設）、沒有網路時，App 會自動改用 OpenStreetMap，不會顯示提示
- **旅行後**：可以一直開著（每日上限保證不收費）；想更放心就在「API 和服務」停用 Map Tiles API，App 會自動改用 OpenStreetMap
- **下次旅行前**：重新啟用 Map Tiles API，並確認 Google 的免費額度與計費方式沒有改變

## 🔄 改版注意事項

- 修改 HTML / CSS / JS / `data.js` 時，`sw.js` 的 `VERSION` 和 `index.html` 左上角的版號要一起改，方便確認手機是否已更新
- 修改 `basemap.js` 後執行 `node --test "tests/*.test.js"`
- 本機預覽要用 http 伺服器開啟（例如 `python -m http.server`），直接雙擊 `index.html` 的話離線快取不會運作
