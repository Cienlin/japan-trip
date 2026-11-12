# Tasks

## 1. 準備

- [x] 1.1 使用者完成 Google Cloud 設定：建立專案與帳單帳戶、啟用 Map Tiles API、建立金鑰（網站限制 `https://cienlin.github.io/*`、API 限制只允許 Map Tiles API），已升級成付費帳戶（確認沒有選訂閱方案）、`2D Tiles requests per day` 設成 3,000，把金鑰交給 Claude。驗證：使用者回報每一步完成，並提供金鑰
- [x] 1.2 下載官方 `Google_Maps_Attribution_Assets.zip`，挑出淺色與深色底圖要用的 logo，放進 `assets/`。驗證：檔案存在，並在 commit 訊息記下選用哪個版本、為什麼（有外框或沒外框）
- [x] 1.3 在 `docs/roadmap.md` 的 Phase 2 註明這次是凍結期的破例（地圖底圖改用 Google）。驗證：roadmap 的 Phase 2 狀態與「目前進度」都有寫到

## 2. 測試頁

- [x] 2.1 建立 `map-test.html` 與 `map-test.js`：Leaflet 加 `data.js`，用圓點畫出所有地點與 D5 路線；按鈕切換地名「日文（zh-TW）／英日並列（en-US）」、字「一般（2x + highDpi，tileSize 256）／兩倍字（4x + highDpi，tileSize 512、zoomOffset -1）」、主題「淺色／深色」；顯示 Google logo、版權文字，以及診斷資訊（建立通行碼的結果、HTTP 狀態與錯誤訊息、`tileWidth`、圖磚成功／失敗次數）。不加進 `SHELL_ASSETS`。驗證：`node --check map-test.js` 通過，App 的檔案都沒有改到
- [x] 2.2 更新版號（`sw.js` 的 `VERSION` 與 `index.html` 的 `#version-badge`），commit 並 push。驗證：兩處版號一致，`git status` 乾淨，已推到 `origin/main`
- [ ] 2.3 給使用者手機測試清單，涵蓋各種組合、預期畫面、出問題時要截診斷資訊。由使用者決定正式版的地名語言與字的大小。驗證：使用者回報測試結果與選擇；有錯誤時先修好，再重測

## 3. 底圖判斷邏輯（純函式與測試）

- [x] 3.1 先寫 `tests/basemap.test.js`（`node --test`），涵蓋：
  - 通行碼離過期不到 1 天就不沿用；字的大小或地名語言的設定不同，也不沿用
  - 圖磚載入成功時，連續失敗次數歸零
  - 沿用的通行碼連續失敗 3 次，先重新建立一次；新的通行碼連續失敗 3 次，就退回
  - viewport 網址包含 session、key、zoom 與四個邊界

  驗證：`basemap.js` 還沒寫之前，測試會失敗
- [x] 3.2 實作 `basemap.js`：一般 script 定義全域物件，加上 `module.exports` 判斷。驗證：`node --check basemap.js` 與 `node --test` 全部通過；暫時拿掉其中一個判斷時，對應的測試會失敗（人為製造紅燈），還原後通過
- [x] 3.3 在 `index.html` 的 `app.js` 之前載入 `basemap.js`，並把 `basemap.js` 和 logo 檔加進 `sw.js` 的 `SHELL_ASSETS`。驗證：`node --check sw.js`、`node tools/check-data.js` 沒有 ❌

## 4. 換進 App

- [ ] 4.1 `app.js`：
  - 新增常數 `GOOGLE_MAP_TILES_KEY`，以及依 2.3 選定的地名語言與字大小設定（含兩倍字需要的 `tileSize` 與 `zoomOffset`）
  - `STORAGE_KEYS` 加上 `googleTileSessions`
  - `initMap()` 先嘗試建立 Google 底圖：照 design 第 5 點，離線、建立失敗或逾時就用 OpenStreetMap；連續失敗時先重新建立通行碼，還是失敗就退回
  - 換底圖時保留中心點與縮放層級，`#map` 加上 `basemap-google` 或 `basemap-osm`

  驗證：`node --check app.js`，並逐一對照 design 第 5 點每個退回條件的程式路徑
- [ ] 4.2 深色主題：夜間 `styles` 常數；`applyTheme()` 在 Google 底圖使用中時，換成對應樣式的圖層，失敗就退回。`style.css` 的反轉選擇器改成只對 `#map.basemap-osm` 生效。驗證：`node --check app.js`，grep 確認反轉規則只剩 `basemap-osm` 的選擇器
- [ ] 4.3 Google logo 控制項（左下角、高度 18px、`alt="Google Maps"`、深淺色各用 1.2 選的檔案）；`moveend` 後等 500ms 更新版權文字，失敗時保留上一次的內容；手機版的 `.leaflet-bottom` 移到分頁列上方（64px 加 safe area）。驗證：`node --check app.js`，CSS 規則在手機版的 media query 裡
- [x] 4.4 `sw.js`：`tile.googleapis.com` 的請求不攔截；更新檔頭的策略註解。驗證：`node --check sw.js`，並確認 Google 請求不會進到 `staleWhileRevalidate`
- [ ] 4.5 文件：
  - `CLAUDE.md` 的「App 架構重點」補上底圖規則：Google 底圖、退回備用底圖、金鑰限制、不快取 Google 圖磚、`basemap.js` 與測試
  - `README.md` 補上檔案結構，以及 Google Cloud 的每日上限、旅行後停用與下次旅行重新啟用的方式
  - `GLOSSARY.md` 加入「底圖」「備用底圖」

  驗證：三個檔案都有對應段落，用詞跟規格一致
- [ ] 4.6 更新版號，commit 並 push。給使用者手機測試清單：
  - 淺色、深色主題的地圖都清楚，地名是選定的語言，字是選定的大小
  - logo 與版權文字在分頁列上方，拖曳地圖後版權文字會更新
  - 標記、每天的路線、我的位置、新增地點時點選座標都正常
  - 開飛航模式重開 App，會改用備用底圖，而且沒有提示
  - 在 Google Cloud 暫時停用 API 後重開 App，會改用備用底圖；測完再啟用

  驗證：使用者回報全部通過；有問題時修好再重測

## 5. 收尾

- [ ] 5.1 刪掉 `map-test.html` 與 `map-test.js`；如果金鑰的網站限制有暫時加 `openlayers.org`，請使用者移除。更新版號，commit 並 push。驗證：檔案已不存在，使用者確認 App 正常
- [ ] 5.2 執行 `/code-review`（medium 以上），每個 finding 都要處理：修正、說明理由拒絕，或記到 `docs/backlog.md`。驗證：所有 finding 都有處理結果
- [ ] 5.3 更新 `docs/roadmap.md` 的「目前進度」，執行 `/opsx:archive google-map-tiles`，commit 並 push。驗證：`openspec/specs/map` 與 `offline-updates` 已同步新規格，change 移到 `archive/`
