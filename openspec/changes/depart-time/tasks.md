# Tasks

## 1. 準備

- [ ] 1.1 修改 `docs/roadmap.md`：Phase 2 和「目前進度」註明建議出門時間（`depart-time`）是凍結期第 5 個破例。驗證：roadmap 兩處都寫到

## 2. 算法的純函式與測試

- [ ] 2.1 先寫 `tests/departure.test.js`（`node --test`），涵蓋：
  - `"09:30"` 減 35 分鐘 → `"08:55"`
  - 往前取整：`"10:00"` 減 23 → `"09:35"`；`"10:00"` 減 20 → `"09:40"`（剛好整 5 分不變）
  - `"9:30"` 這種一位數的小時也算得出來
  - 時間格式不對（`null`、`"abc"`、`"25:00"`）→ `null`
  - 分鐘數不是正數（`0`、`-5`、`"35"`、`undefined`）→ `null`
  - 算出來早於 00:00（`"00:10"` 減 30）→ `null`

  驗證：`departure.js` 還沒寫之前，測試會失敗
- [ ] 2.2 實作 `departure.js`：
  - 全域 `Departure`，Node 用 `module.exports`，寫法跟 `checklist.js` 一樣
  - 提供 `suggest(firstTime, minutes)`

  驗證：
  - `node --check departure.js` 通過，`node --test "tests/*.test.js"` 全部通過
  - 暫時拿掉「往前取整」和「早於 00:00 回傳 null」兩個判斷，對應的測試會失敗；還原後通過

## 3. 資料檢查與資料修正

- [ ] 3.1 修改 `tools/check-data.js`：
  - `require("../departure.js")`
  - 在逐天檢查交通說明的迴圈裡，當天第一站的前一站是飯店時，再檢查兩件事，都是 ⚠️：
    - 建議出門時間早於 `EARLIEST_DEPARTURE = "09:00"`。常數加註解，寫明對應「8 點起床、準備好再出門」
    - 第一段交通說明（`details`）寫了 `時:分` 格式的時刻。正規表示式寫在檔案裡，不要用 `node -e`
  - 檔案開頭的說明註解補上這兩條

  驗證：
  - 跑 `node tools/check-data.js`：D2 出現「08:55 出門」的 ⚠️；D3、D4、D6 出現「說明寫了出發時刻」的 ⚠️
  - D2 的第二站（檍，說明寫「10:15 龜有站搭」）不出現時刻提醒
- [ ] 3.2 修正 `data.js` 各天的第一段交通（design 決定 5）：
  - **分鐘數**：照說明逐段加總，從走出飯店算起。預計 D3 改 40、D4 改 40、D5 改 20、D6 改 65；D2 的 35 不改
  - **說明文字**：拿掉 D3「10:30」、D4「09:55」、D6「12:30」「約 13:30 抵達」這些出發、抵達時刻。D6 保留「起飛前 2 小時到機場」

  驗證：
  - `node tools/check-data.js` 沒有 ❌，「說明寫了出發時刻」的 ⚠️ 都消失，只剩 D2 出門太早和原本 D5 的 TEN&／秋葉原同時間
  - 用 node 算出各天建議出門時間，預計 D2 08:55、D3 10:20、D4 09:50、D5 09:40、D6 12:25
- [ ] 3.3 更新 `docs/行程待討論.md`：
  - D2 出門時間那一條，改寫成「資料檢查會提醒：建議出門 08:55，早於 09:00」
  - D6 那一條，改成新的出發時間 12:25

  驗證：兩條都寫到

## 4. 畫面

- [ ] 4.1 `index.html` 在 `app.js` 之前載入 `departure.js`；`sw.js` 的 `SHELL_ASSETS` 加入 `./departure.js`。驗證：`node --check sw.js`；`SHELL_ASSETS` 列的每個檔案都存在
- [ ] 4.2 修改 `app.js`：
  - `renderItinerary()` 的迴圈記住上一站是哪一天，遇到當天第一站時，用 `getTransitView()` 的結果判斷：前一站是 `HOTEL_ID` 而且有 `info`，就先插入建議出門時間那一行，再畫原本的交通說明
  - 建議出門時間用 `Departure.suggest(place.time, info.duration)`，回傳 `null` 時不顯示
  - 文字：主文字「建議 HH:MM 從飯店出發」；小字「第一站 HH:MM・路上約 N 分鐘」
  - 經過 `escapeHtml()`；這行不能點，不影響卡片點擊

  驗證：
  - `node --check app.js` 通過
  - 讀程式確認：dayStart 的那一天、自訂地點、前一站跟共用行程不同時，都不會插入
- [ ] 4.3 修改 `style.css`，在交通說明的樣式附近加修飾 class：
  - 沿用 `.transit-log` 的虛線與圓點
  - 時間用 `--accent-gold` 加粗，小字用 `--text-muted`
  - 不加框線、不寫死顏色、不用 `color-mix()`

  驗證：大括號成對；grep 確認新規則沒有寫死的色碼

## 5. 文件、版號與上線

- [ ] 5.1 更新文件：
  - `CLAUDE.md`「App 架構重點」：建議出門時間由 `departure.js` 計算、從飯店出發的交通分鐘數要算到出門、資料檢查的兩條提醒
  - `GLOSSARY.md`：加「建議出門時間」

  驗證：兩份文件都寫到；`openspec validate depart-time --strict` 通過
- [ ] 5.2 版號 +1（`sw.js` 的 `VERSION` 與 `index.html` 的 `#version-badge` 一致），跑靜態檢查。驗證：
  - `node --check`（app.js、sw.js、departure.js）通過
  - `node tools/check-data.js` 沒有 ❌
  - `node --test "tests/*.test.js"` 全部通過
- [ ] 5.3 commit、push，給使用者手機測試步驟。要測的包括：
  - D2～D6 各天最上面的建議出門時間跟 3.2 算出來的一樣
  - D1 不顯示
  - 選「全部」時每天各顯示一次
  - 深色主題看得清楚
  - 本機改了第一站時間會跟著變，換了第一站就不顯示

  交通分鐘數請使用者用 Google Maps 確認。驗證：使用者實測回報，問題都修正
- [ ] 5.4 實測沒問題後跑 `/code-review`，每個發現都要處理：修正、說明理由後不採用，或記進 `docs/backlog.md`。驗證：審查結果整理給使用者
