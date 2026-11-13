# Design

## Context

- **外觀的定案樣板**：`https://claude.ai/artifact/RNG8n7mhDqtyTCEPW47Q8H`
  - 原始檔是當時 session 暫存資料夾的 `newlook/template.html`
  - 顏色數值、間距、元件長相都以它為準
  - 樣板只做了手機畫面
- **`style.css` 現況**：
  - 約 2,500 行
  - 顏色集中在 `:root` 與 `body.theme-dark` 的變數，`var()` 用了 300 多次
  - 字型變數是 `--font-primary`（Outfit）與 `--font-chinese`（Noto Sans TC）
  - 卡片多半用半透明加 `backdrop-filter` 的毛玻璃效果
- **畫面怎麼產生**：
  - 時間軸、地點清單、詳細資訊、花費明細由 `app.js` 用字串組出 HTML
  - 分頁按鈕、天數按鈕、預算與行前指南的區塊寫在 `index.html`
  - class 名稱和結構這次大多不動，外觀幾乎都能只靠 CSS 改
- **天數按鈕**：寫死在 `index.html`，是 6 個 `.day-btn`（backlog B1）。`app.js` 已經有 `getTripNow()`，用 UTC 換算日本日期，`WEEKDAYS` 是星期的中文
- **既有的限制**：
  - Claude 不能跑瀏覽器，畫面只能等使用者 push 後用手機實測
  - push 到 `main` 就會更新 5 個人的手機
  - `:hover` 要包在 `@media (hover: hover)` 裡
  - 用 `hidden` 屬性隱藏元素
  - Google 底圖不能用 CSS 反轉顏色，Google logo 與版權文字要一直看得到

## Goals / Non-Goals

**Goals:**

- 照樣板改外觀，功能和操作完全不變
- 幾乎全部只改 CSS。HTML 和 JS 只動兩個地方：分頁名稱包一層 `span`，天數按鈕加日期
- 淺色、深色主題都完整，桌機版也能用

**Non-Goals:**

- 不改版面配置：手機的底部分頁、地圖在上方，以及展開、收起的方式都不變。分頁列展開後在螢幕中間、單手不好按的問題留到旅行後
- 不改地圖：底圖、標記、路線顏色都不動
- 不處理 backlog 的其他項目，例如天數寫死 6 天（B1）
- 不新增 Material Symbols 圖示；按鈕上的 SVG 圖示照舊

## Decisions

### 1. 直接改寫 `style.css`，不另外開主題檔

每一段（標題列、時間軸、地點清單⋯）都直接改寫成新外觀，用不到的規則一起刪掉，例如類別色點、彩色標籤、毛玻璃。

- **替代方案**：在檔尾加一層覆蓋用的規則
- **不採用的原因**：新舊規則會互相打架，以後改樣式要同時看兩套

### 2. 沿用現有的顏色變數名稱，只改值，另外補新元素的變數

| 現有變數 | 改成 |
|---|---|
| `--bg-app`、`--bg-sidebar` | 純色底，不再半透明 |
| `--bg-card` | 便條紙的白 |
| `--text-main`、`--text-muted` | 墨色、淡墨色 |
| `--primary`、`--accent-gold` | 藍墨水色 |

- 新增 `--tape`（淺藍紙膠帶）、`--highlighter`（螢光筆）、`--grid-line`（方格紙線）、`--line-strong`（底線、虛線）、`--note-shadow`（便條紙陰影）
- 類別顏色 `--color-<類別>` 只留給地圖標記用
- **替代方案**：全部改成新名稱
- **不採用的原因**：要改 300 多處，跟外觀無關的 diff 太大；更名留給 Phase 3

### 3. 字型：Google Fonts 的霞鶩文楷，系統字型當備用

- 載入 `LXGW WenKai TC`，粗細只要 400 和 700，不再載入 Outfit 與 Noto Sans TC
- 備用字型依序是 `"PingFang TC", "Heiti TC", "Microsoft JhengHei", sans-serif`
- 兩條 Google Fonts 連結（文字字型、圖示字型）都加上 `crossorigin`。Service Worker 只會快取 `ok` 的回應，加了之後字型的 CSS 才能進快取，離線時也有字型和圖示
  - 之前把這項修正列為低優先。當時的結論是：反正要改 `index.html` 時再順便加，這次正好要改
- 用 `display=swap`：字型還沒到時先用系統字顯示，不會整頁空白

### 4. 螢光筆、紙膠帶、便條紙都用 CSS 畫

- **螢光筆**：用斜角的 `linear-gradient` 背景，只蓋住文字的下半部
- **紙膠帶**：半透明淺藍底，用 `clip-path` 剪出鋸齒邊，稍微斜一點
- **便條紙**：白底、小圓角、陰影，不加框線
- 不用圖片
- 不用 `color-mix()`：舊一點的 iOS 不支援，需要半透明的顏色都直接寫成 rgba 變數

### 5. 天數按鈕的日期由 `app.js` 算出來

- 開啟時把每個 `.day-btn` 的內容換成 `<span class="day-btn-label">D2</span><span class="day-btn-date">12/10 四</span>`
- 日期用 `getTripNow()` 那一套 UTC 換算：`Date.parse(startDate)` 加上 (N−1) 天，再用 `getUTC*` 讀出月、日、星期，跟手機時區無關
- 「全部」顯示日期範圍：同一個月寫「12/9–14」，跨月寫「12/30–1/2」
- **替代方案**：把日期直接寫進 `index.html`
- **不採用的原因**：出發日改了就會對不上
- 函式很小，跟 `getTripNow()` 放在一起；用 node 換幾個時區跑一次確認

### 6. 分頁名稱包一層 `span`

`index.html` 的 4 個分頁按鈕，把文字包成 `<span class="tab-label">`，螢光筆才能只畫在文字下面、不蓋到圖示。`switchTab()` 只切換按鈕的 `active` class，不受影響。

### 7. 各分頁的背景

- **行程分頁**：`#pane-itinerary` 鋪方格紙。天數列是 sticky 且純色，捲動時會蓋住方格紙
- **其他分頁**：純色

### 8. 手機狀態列與啟動畫面的顏色

- `theme-color` 改成藍墨水色 `#2f4f8f`。原本是深藍，狀態列文字一樣是白色
- `manifest.json` 的 `background_color` 改成新的淺色底 `#f6f7f9`

## Risks / Trade-offs

- **[大量 CSS 只能靠手機驗證]** Claude 看不到畫面，可能有跑版或漏改的地方
  - 依樣板逐段改，給使用者逐頁的測試清單
  - 出問題時先修再 push
  - 整個改壞時用 `git revert` 退回 v1.4.22
- **[字型比較寬，窄手機的標題列可能擠不下]** 霞鶩文楷的字寬跟 Noto 不同，360px 寬的 Android 上，倒數可能被擠出去
  - 標題列維持不換行
  - 400px 以下縮小倒數的字
  - 測試清單請使用者特別看標題列
- **[第一次要下載中文字型]** Google Fonts 會依頁面用到的字分批下載，第一次打開多花幾百 KB 到 1～2 MB
  - 之後留在瀏覽器與 Service Worker 的快取
  - 在日本大家都有 eSIM，可以接受
- **[字型換手時畫面會跳一下]** `display=swap` 會先用系統字，字型到了再換，換的時候行高、字寬會變一點
  - 只有第一次會發生，可以接受
- **[桌機版沒有樣板]** 側邊欄加地圖的版面是依手機樣板推出來的
  - 測試清單請使用者用電腦打開看一次
- **[出發前不到 4 週改外觀]** 使用者決定出發前就做
  - 有問題就退回 v1.4.22
  - 功能和資料都沒動，退回不會遺失任何手機上的資料

## Migration Plan

1. 照 tasks.md 改完，跑靜態檢查（`node --check`、`node tools/check-data.js`、`node --test`）
2. 版號升到 **v1.5.0**（整體外觀改版，所以進 minor 版號）
3. commit、push，給使用者手機測試清單（逐頁、淺色和深色、窄螢幕、桌機）
4. 依實測回報修正（patch 版號），然後跑 `/code-review`
5. 歸檔
6. **退回方式**：`git revert` 這次的 commit，再 push。頁面檔案是 network-first，大家下次打開就回到舊外觀；手機上存的資料（記帳、本機修改、主題）都不受影響
