# Design

## Context

- 地圖用 Leaflet 1.9.4（unpkg CDN），底圖是單一的 OpenStreetMap 圖磚圖層（`app.js` 的 `tileUrl`、`initMap()`），`crossOrigin: true` 讓 Service Worker 能快取圖磚
- 深色主題靠 `style.css` 的 `body.theme-dark .leaflet-tile-pane { filter: invert(...) }` 反轉顏色；`applyTheme()` 只切換 body 的 class，不重新請求圖磚
- `sw.js`：`tile.openstreetmap.org` 走 cache-first，上限 1500 張；其他跨網域請求一律走 stale-while-revalidate，存進 `CDN_CACHE`
- 手機版的底部分頁列（`.sidebar`，64px）蓋在地圖底部，Leaflet 右下角的版權文字現在其實會被蓋住
- Claude 不能跑瀏覽器，所有畫面行為都要使用者 push 後用手機實測；push 到 `main` 就會更新 5 個人的手機
- 動機見 proposal.md；行為規格見 `specs/map/spec.md` 與 `specs/offline-updates/spec.md`

查證過的 Map Tiles API 事實（2026-11-12，Google 官方文件）：
- 建立通行碼：`POST https://tile.googleapis.com/v1/createSession?key=KEY`，body 必填 `mapType`、`language`、`region`，選填 `scale`（`scaleFactor1x/2x/4x`）、`highDpi`（**只能搭配 2x 或 4x**）、`styles`（只限 roadmap）、`imageFormat`；回傳 `session`、`expiry`（epoch 秒數字串）、`tileWidth`、`tileHeight`
- 通行碼有效兩週，同一個通行碼可以給多個用戶端共用
- 圖磚：`https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}?session=TOKEN&key=KEY`
- 版權文字：`GET https://tile.googleapis.com/tile/v1/viewport?session=&key=&zoom=&north=&south=&east=&west=`，回傳 `copyright`（必須完整顯示，通常放右下角）
- 只有圖磚請求計費，建立通行碼與版權文字請求不計費；2D 圖磚每月 100,000 次免費
- Google logo：用官方的 attribution assets（`Google_Maps_Attribution_Assets.zip`），高度 16～19dp，不可修改，需要 `Google Maps` 的無障礙標籤；背景複雜時用有外框的版本
- 快取：除了條款允許的情況，不得預先下載、儲存或快取內容；回應的 Cache-Control 要照 HTTP 規則處理

用使用者的金鑰實測（2026-11-12，curl，淺草 z16 的同一張圖磚）：
- 網站限制有效：沒有 Referer、或 Referer 是其他網站時，建立通行碼回 403 `PERMISSION_DENIED`；Referer 是 `https://cienlin.github.io/` 時成功
- `scaleFactor2x` + `highDpi` → 512×512 PNG，約 50KB；`scaleFactor4x` + `highDpi` → 1024×1024 PNG，約 108KB。兩者的字在圖磚中所占的比例相同，所以都以 256 CSS px 顯示時，字一樣大，只是後者更清楚
- 圖磚回應 `Cache-Control: private, max-age=86400, must-revalidate`，瀏覽器可以快取一天
- `language` 設 `zh-TW`、`zh-Hant`、`ja` 時，圖磚完全相同，地名都是日文（浅草寺、宝蔵門、伝法院通）；`en-US` 是英文與日文並列（Asakusa 浅草、Sumida Park）
- viewport 的 `copyright` 會跟著 `language`：`zh-TW` 是「地圖資料 ©2026 Google」

## Goals / Non-Goals

**Goals:**
- 底圖是唯一被換掉的部分，標記、路線、我的位置、點選座標等程式碼不動
- Google 底圖任何環節失敗都會安靜地退回現在的 OpenStreetMap 底圖，最差的情況跟現在一樣
- 同一支手機兩週內重複使用通行碼，讓瀏覽器快取發揮作用，減少計費圖磚數

**Non-Goals:**
- 不換成 Google Maps JavaScript API，也不換掉 Leaflet
- 不做 Google 底圖的離線快取
- 不做地圖上點店家看資訊、搜尋、路線規劃等 Google 地圖的互動功能
- 不在 App 裡顯示用量或錯誤提示（使用者決定退回時不提示）
- 不處理 `docs/backlog.md` 裡跟地圖有關的既有項目（例如 B1 最後一天寫死 Day 6）

## Decisions

### 1. Leaflet 加 Map Tiles API，不用 Maps JavaScript API

只把 `L.tileLayer` 的網址換成 Google 2D 圖磚，其他圖層照舊。
- 替代方案：Maps JavaScript API。要重寫所有標記、路線、定位的程式，而且退回 OpenStreetMap 時要維護兩套地圖程式；計費單位是「每次載入地圖」，退回機制更難做
- 替代方案：Google 我的地圖 / Embed API。不能放我們自己的標記與每天的路線

### 2. 字的大小：先用測試頁比較，正式版只用一種

`highDpi` 只能搭配 2x 或 4x；實測顯示 4x + `highDpi` 只會更清楚、字不會變大。所以兩個候選是：
- **一般**：`scaleFactor2x` + `highDpi`，512px 圖磚，Leaflet `tileSize: 256` → 字跟 Google 地圖網頁版一樣大，在手機上清楚
- **兩倍字**：`scaleFactor4x` + `highDpi`，1024px 圖磚，Leaflet `tileSize: 512, zoomOffset: -1` → 每張圖磚放大成 512 CSS px 顯示，地理比例不變。在 Leaflet 縮放層級 Z 時，顯示的是 Z-1 層級的圖面放大兩倍，所以字和道路都是兩倍大，細節少一層
  - 每個畫面需要的圖磚數大約是「一般」的 1/4，計費較少
  - 1024px 圖片放進 512 CSS px，在 DPR 2 的手機上剛好清楚，DPR 3 的手機會稍微柔一點

使用者在測試頁比較後，正式版用常數固定其中一種，不提供切換。

替代方案：`scaleFactor2x` 不加 `highDpi`（256px 圖磚、字兩倍大）。字會變大，但在高解析度手機上會糊，正好是這次要解決的問題。

### 3. 地名語言：日文或英日並列

Google 圖磚不會把日本地名翻成中文（見 Context 的實測），所以兩個候選是：
- **日文**：`language: "zh-TW"`。地名跟 `ja` 一樣是日文，以漢字為主，但版權文字等介面文字是中文
- **英日並列**：`language: "en-US"`。看不懂假名時可以看英文，但字比較多、比較擠

兩種都用 `region: "TW"`。正式版用常數固定其中一種。

### 3a. 獨立測試頁 `map-test.html`

先 push 一個不在 App 裡、沒有連結進來的頁面，網址是 `https://cienlin.github.io/japan-trip/map-test.html`：
- 載入 Leaflet 與 `data.js`，用簡單的圓點畫出所有地點，以及 D5 的路線，用來看標記疊在 Google 底圖上的效果
- 按鈕切換地名「日文／英日並列」、字「一般／兩倍字」、主題「淺色／深色」
- 畫面上直接顯示診斷資訊：建立通行碼成功或失敗（含 HTTP 狀態與錯誤訊息）、`tileWidth`、圖磚載入成功或失敗的次數。Claude 看不到瀏覽器，使用者截圖回報就能判斷問題
- 不加進 `SHELL_ASSETS`，正式換進 App 後刪掉

### 4. 通行碼存在 localStorage，依「樣式」分開

`STORAGE_KEYS.googleTileSessions`（`tokyo_trip_google_tile_sessions`），內容是 `{ light: {session, expiry, tileWidth, scale, language}, dark: {...} }`。
- 距離 `expiry` 還有 1 天以上，而且 `scale`、`language` 都跟目前設定相同，就直接沿用；否則重新建立
- 圖磚網址固定，瀏覽器快取才命中（OpenLayers 曾有每次重新整理都換通行碼、導致快取失效的問題，見 openlayers#17526）
- 讀取一律用 `readJson()`

### 5. 退回備用底圖的條件

- `navigator.onLine === false` → 直接用 OpenStreetMap
- 建立通行碼失敗（網路錯誤、5 秒逾時、非 200，例如 API 被停用或金鑰被擋）→ OpenStreetMap
- 已經用 Google 底圖時，連續 3 張圖磚載入失敗（中間沒有任何成功；Leaflet `tileerror` / `tileload` 事件）：
  - 如果通行碼是從手機上沿用的，先丟掉它、重新建立一次（處理通行碼過期）
  - 重新建立後還是失敗，或通行碼本來就是新的 → 換成 OpenStreetMap
- 換成 OpenStreetMap 後，這次打開 App 期間不再嘗試 Google（避免兩種底圖來回切換）；下次打開 App 再試
- 換底圖時只替換底圖圖層，地圖的中心點與縮放層級不變
- 不顯示任何提示（使用者決定）

替代方案：讀 HTTP 狀態碼判斷 `quotaExceeded`。`<img>` 圖磚拿不到狀態碼，而且不管是哪種失敗，處理方式都一樣是退回，所以用「連續失敗次數」判斷就夠了。

### 6. 深色主題

- Google 底圖：深色用 `styles` 參數建立另一個通行碼（Google 的夜間樣式 JSON 寫成 `app.js` 的常數）。`applyTheme()` 在 Google 底圖使用中時，換成對應樣式的圖層；建立深色通行碼失敗 → 跟第 5 點一樣退回
- 備用底圖：維持 CSS 反轉，但選擇器加上條件，只在備用底圖時生效。做法是在 `#map` 加 `basemap-osm` 或 `basemap-google` 的 class

### 7. Google logo 與版權文字

- logo：用 Leaflet 自訂控制項放在左下角，`<img alt="Google Maps">`，高度 18px，四周留白照規定。圖檔從官方 zip 取出後放進 repo，例如 `assets/google-maps-logo.png`，並加進 `SHELL_ASSETS`
- 版權文字：地圖 `moveend` 後等 500ms，向 viewport 端點查詢目前範圍的 `copyright`，換掉 Leaflet 版權控制項裡的文字。失敗時保留上一次的文字
- 手機版的 `.leaflet-bottom` 往上移 64px，加上 safe area，移到分頁列上方。備用底圖的 OpenStreetMap 版權文字也一起變得看得到

### 8. Service Worker

在 `fetch` 處理裡，`tile.googleapis.com` 的請求直接 `return`，不攔截，交給瀏覽器照 Cache-Control 處理，也就不會存進 `CDN_CACHE`。建立通行碼是 POST，本來就不攔截。OpenStreetMap 的快取規則不變。

### 9. 金鑰

- 放在 `app.js` 的常數 `GOOGLE_MAP_TILES_KEY`，測試頁另外放一份，測試頁刪掉時一起移除
- 金鑰本來就會公開，靠 Google Cloud 的限制保護：
  - 應用程式限制「網站」設成 `https://cienlin.github.io/*`。跨網域請求的 Referer 只送網域（瀏覽器預設的 `strict-origin-when-cross-origin`），所以不能寫成 `/japan-trip/*`
  - API 限制只允許 Map Tiles API
  - 每日上限 3,000 張圖磚（`2D Tiles requests per day`）：只有付費帳戶能設。使用者的帳單帳戶在 2026-11-12 從免費試用升級成付費帳戶（用多少付多少，不選訂閱方案）；剩下的試用額度到原本的 90 天到期前，會先抵掉超過免費額度的費用
  - 不要調低 `2D Tiles and Street View Tiles uncharged requests per day`：那是不計費的通行碼與版權文字請求，調低會讓版權文字更新或建立通行碼失敗
- 不寫進 `data.js` 的 `TRIP_METADATA`，因為金鑰跟哪一趟旅程無關

### 10. 判斷邏輯拆成 `basemap.js`，用 `node --test` 測試

通行碼能不能沿用、連續失敗時要「繼續／重新建立通行碼／退回」，以及 viewport 網址組合，都是不碰 DOM 的純函式。這些函式放在新的 `basemap.js`：
- 跟 `data.js` 一樣用一般 `<script>` 載入，在 `app.js` 之前，定義全域物件；加上 `module.exports` 判斷，讓 Node 可以 `require`
- 測試寫在 `tests/basemap.test.js`，用 `node --test`，不用安裝套件
- `app.js` 只負責 DOM 與 Leaflet 的部分

替代方案：全部寫在 `app.js` 裡。這樣沒辦法測試，而退回備用底圖的邏輯正是 Claude 無法在瀏覽器驗證、最容易出錯的部分。

## Risks / Trade-offs

- [付費帳戶不會在試用期結束時自動停用] → 每日上限 3,000 張保證整個月不超過免費額度；想更放心時，旅行後在 Google Cloud 停用 Map Tiles API
- [每日上限在太平洋時間午夜重設，也就是日本時間 17:00] → 早上用完的話，當天到傍晚都會是備用底圖。旅行期間可以在 Google Cloud 臨時調高上限，只要整個月加起來不超過 100,000
- [兩倍字的每張圖磚比較大（約 108KB，一般約 50KB）] → 但每個畫面只要約 1/4 的圖磚，整體流量大約只有一般的一半；測試頁讓使用者實際感受載入速度再決定
- [離線時，只用 Google 底圖看過的區域在備用底圖上是空白] → 已寫進規格的情境；群組用 eSIM，離線是低優先
- [金鑰被拿去其他網站用] → 網域限制加上每日上限，最多就是當天的額度被用完，退回備用底圖，不會扣錢
- [Google 調整價格或免費額度] → 每次旅行前確認；預算通知只會通知、不會停止服務，所以每日上限才是真正的保護
- [連續 3 張失敗的判斷太敏感，例如訊號瞬間不穩] → 退回後這次打開 App 期間都用備用底圖，但功能都正常；下次打開會再試 Google
- [Google 樣式或 logo 規定改變] → logo 圖檔放在 repo 裡，換檔就好
- [push 到 `main` 就會更新所有人的手機] → 先用測試頁驗證，正式版的退回機制保證最差跟現在一樣

## Migration Plan

1. 使用者完成 Google Cloud 設定，把金鑰給 Claude
2. push 測試頁（更新版號）→ 使用者用手機測試，決定字的大小
3. 正式換進 App，push → 使用者照測試清單用手機實測（淺色、深色、退回備用底圖、logo 位置）
4. 實測通過後刪掉測試頁，push
5. 程式碼審查（`/code-review` medium 以上）→ 歸檔（`/opsx:archive`）

**緊急停用**：不用改程式，在 Google Cloud 停用 Map Tiles API，所有手機都會自動退回備用底圖。要回到舊版的話 revert 這次的 commit。

**旅行後**：每日上限保證不收費，可以一直開著；想更放心就在 Google Cloud 停用 Map Tiles API（App 自動退回備用底圖），下次旅行前再啟用，並確認免費額度與計費方式沒變。

## Open Questions

- 正式版的地名用「日文」還是「英日並列」、字用「一般」還是「兩倍字」：測試頁實測後決定，只影響常數
- logo 用有外框還是沒有外框的版本、淺色與深色底圖各用哪一個：取出官方 zip 後依規定挑選
