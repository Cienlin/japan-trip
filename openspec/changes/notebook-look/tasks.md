# Tasks

外觀以樣板 `https://claude.ai/artifact/RNG8n7mhDqtyTCEPW47Q8H` 為準。顏色數值見 design.md 決策 2，以及樣板的 `.phone` 與 `.phone.dark` 變數。

## 1. 準備

- [ ] 1.1 在 `docs/roadmap.md` 的 Phase 2 和「目前進度」註明：外觀改版（`notebook-look`）是凍結期的第三次破例。驗證：roadmap 兩處都寫到

## 2. 網頁骨架與日期（HTML、JS）

- [ ] 2.1 修改 `index.html`：
  - 字型網址換成 `LXGW WenKai TC`（400、700），拿掉 Outfit 與 Noto Sans TC
  - 兩條 Google Fonts 連結加上 `crossorigin`
  - `theme-color` 改成 `#2f4f8f`
  - 4 個分頁按鈕的文字包成 `<span class="tab-label">`

  驗證：`node tools/check-data.js` 沒有 ❌（圖示清單不變）；grep 確認 `Outfit`、`Noto+Sans` 都不見了
- [ ] 2.2 `manifest.json` 的 `background_color` 改成 `#f6f7f9`，`theme_color` 改成 `#2f4f8f`。驗證：用 node 解析 JSON 不出錯
- [ ] 2.3 修改 `app.js`：
  - 開啟時把每個 `.day-btn` 換成「天數＋日期」兩行
  - 日期跟 `getTripNow()` 一樣用 UTC 換算
  - 「全部」顯示日期範圍：同一個月寫「12/9–14」，跨月寫「12/30–1/2」

  驗證：
  - `node --check app.js` 通過
  - 用 node 在 `TZ=Asia/Taipei`、`TZ=America/Los_Angeles`、`TZ=UTC` 下跑同一段日期計算，結果都是 D1「12/9 三」、D2「12/10 四」、D6「12/14 一」、全部「12/9–14」
  - 出發日換成 `2026-12-30` 時，全部是「12/30–1/4」

## 3. 樣式：共用基礎

- [ ] 3.1 `style.css` 的 `:root` 與 `body.theme-dark`：
  - 照 design.md 決策 2 改顏色變數的值，新增 `--tape`、`--highlighter`、`--grid-line`、`--line-strong`、`--note-shadow`
  - 字型變數改成霞鶩文楷加系統備用字型
  - 拿掉毛玻璃（`--glass-blur` 與 `backdrop-filter`）

  驗證：grep 確認沒有 `Outfit`、`backdrop-filter`，也沒有 `color-mix(`
- [ ] 3.2 共用元件：
  - 按鈕：`.btn`、`.btn-primary`、`.btn-outline`、`.btn-danger`、`.btn-sm`
  - 輸入欄只有底線：`input`、`select`；`textarea` 是橫線紙
  - 空狀態 `.empty-state`
  - 捲軸

  驗證：grep 確認 `:hover` 規則都在 `@media (hover: hover)` 裡

## 4. 樣式：標題列、分頁、行程

- [ ] 4.1 標題列與分頁列：
  - 純色
  - 倒數不要框；旅行中的「今天 Day N」用螢光筆
  - 目前的分頁用螢光筆標示 `.tab-label`，按鈕沒有色塊底
  - 400px 以下縮小倒數的字

  驗證：對照樣板；grep 確認 `.tab-btn.active` 沒有 `background` 色塊
- [ ] 4.2 天數列：
  - 純色、sticky
  - 天數不加粗，日期是小字
  - 選中的那天是小便條，上面貼紙膠帶
  - 今天的小綠點保留

  驗證：對照樣板
- [ ] 4.3 行程區與時間軸：
  - `#pane-itinerary` 鋪方格紙
  - 拿掉時間軸直線、`.timeline-marker` 與類別色點規則
  - `.timeline-card` 是便條紙；`.timeline-time-badge` 是貼在上緣的淺藍紙膠帶
  - 「Day N」是淡字
  - 「下一站」「已修改」「自訂」用螢光筆
  - 選取中的卡片用藍框
  - 交通說明 `.transit-log` 維持原本的呈現，只換成新配色

  驗證：grep 確認沒有 `.timeline-item[data-cat` 規則；對照樣板
- [ ] 4.4 本機修改提示列（`.local-changes-banner`）是放在純色區的便條。驗證：對照樣板「有修改」狀態

## 5. 樣式：美食景點、預算、行前指南

- [ ] 5.1 美食景點：
  - 「新增自訂地點」是虛線框按鈕
  - 搜尋欄只有底線
  - 類別篩選用螢光筆標示選中的
  - `.place-card` 是便條，封面照片像貼上紙膠帶的拍立得
  - 類別是純文字，沒有彩色底
  - 自訂地點的刪除鈕維持可用

  驗證：grep 確認 `.place-card-category[data-cat` 的彩色底規則都拿掉了；對照樣板
- [ ] 5.2 預算與行前指南共用的 `.logistics-card`：
  - 是便條，`.card-header` 變成貼在左上的紙膠帶標題，圖示保留
  - 標題不能被捲動區切掉

  驗證：對照樣板
- [ ] 5.3 預算分頁：
  - 設定與記一筆的欄位只有底線，住宿是點線底的固定值
  - 結果像帳本：每列點線分隔，總計用雙底線
  - 進度條：充裕是螢光筆黃，接近是橘，超支是紅
  - 狀態文字的顏色跟進度條一致
  - 花費明細是點線分隔的列表

  驗證：對照樣板；`node --test "tests/*.test.js"` 仍全部通過
- [ ] 5.4 行前指南：
  - 去程、回程用螢光筆
  - 飯店兩個按鈕照新按鈕樣式
  - 建議文字裡的天數標籤用藍墨水色
  - 行前清單是手繪感的方框，打勾後文字劃掉

  驗證：對照樣板

## 6. 樣式：詳細資訊、視窗、地圖上的元件、桌機

- [ ] 6.1 地點詳細資訊：
  - 照片放在白邊框、貼紙膠帶的相框裡
  - 類別與 Day 是純文字
  - 交通區塊的分鐘數用藍墨水色的大字
  - 按鈕照新樣式

  驗證：對照樣板
- [ ] 6.2 視窗：
  - 新增／編輯地點、確認、複製變更內容都是便條，標題寫在紙膠帶上
  - 表單欄位只有底線，備註是橫線紙
  - 地圖選點的提示列也換成新樣式

  驗證：對照樣板
- [ ] 6.3 地圖上的元件：
  - 版號是紙膠帶
  - 右上角的按鈕是紙質圓形按鈕
  - 提示訊息與地圖 popup 換成新配色和新字型
  - Google logo 與版權文字的位置、樣式都不動，也不能反轉 Google 底圖

  驗證：grep 確認 `#map.basemap-osm` 以外沒有 `invert`；`.leaflet-bottom` 的位置規則不變
- [ ] 6.4 桌機版：
  - 側邊欄的分頁按鈕是橫排，套用同一套螢光筆
  - 便條和紙膠帶標題不能被側邊欄切掉

  驗證：讀過 768px 以上的規則，沒有沿用舊配色的寫死顏色

## 7. 文件、版號與上線

- [ ] 7.1 更新文件：
  - `CLAUDE.md` 的 CSS 規則：字型、配色變數、方格紙只鋪在行程區、不用 `color-mix()`、螢光筆與紙膠帶的寫法
  - `README.md` 補一段外觀說明

  驗證：兩份文件都寫到
- [ ] 7.2 版號升到 v1.5.0（`sw.js` 的 `VERSION` 與 `index.html` 的 `#version-badge`），跑靜態檢查。驗證：`node --check app.js sw.js`、`node tools/check-data.js` 沒有 ❌、`node --test "tests/*.test.js"` 全部通過
- [ ] 7.3 commit、push，給使用者手機測試清單：
  - 逐頁看過：行程、美食景點、預算、行前指南、詳細資訊、新增／編輯表單、確認視窗、複製變更內容
  - 淺色和深色都看
  - 檢查窄螢幕的標題列
  - 用電腦打開看桌機版

  驗證：使用者實測回報，問題都修正
- [ ] 7.4 實測沒問題後跑 `/code-review`，每個發現都要處理：修正、說明理由後不採用，或記進 `docs/backlog.md`。驗證：審查結果整理給使用者
