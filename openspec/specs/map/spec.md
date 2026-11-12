# map Specification

## Purpose

地圖：依天數顯示地點標記與當天路線、從地圖打開詳細資訊，以及在旅途中顯示自己的位置，讓旅伴知道要去哪裡、自己在哪裡。

## Requirements

### Requirement: 依天數顯示標記

選某一天時，地圖 SHALL 顯示當天的站與飯店；選「全部」時 SHALL 顯示所有地點（包括候補）。地圖 MUST 自動縮放到看得到所有顯示中的標記。

#### Scenario: 選某一天

- **WHEN** 旅伴選 Day 2
- **THEN** 地圖只顯示 Day 2 的站和飯店，並縮放到全部看得到

#### Scenario: 選全部

- **WHEN** 旅伴選「全部」
- **THEN** 地圖顯示所有地點，包括候補

### Requirement: 每天的路線

選某一天時，地圖 SHALL 依時間軸的順序畫出當天路線：從起點出發，經過當天每一站，最後回到飯店；旅程最後一天 MUST NOT 回到飯店。選「全部」時不畫路線。

（目前「最後一天」寫死為 Day 6，見 `docs/backlog.md` B1）

#### Scenario: 一般日子

- **WHEN** 旅伴選 Day 3
- **THEN** 路線從飯店出發，依時間經過 Day 3 每一站，再回到飯店

#### Scenario: 抵達日

- **WHEN** 旅伴選 Day 1，Day 1 的第一站是被標成起點的機場
- **THEN** 路線從機場開始畫，不從飯店出發

#### Scenario: 最後一天

- **WHEN** 旅伴選旅程的最後一天
- **THEN** 路線從飯店出發，到回程機場結束，不回飯店

### Requirement: 定位到地點

定位到一個不在目前篩選裡的地點時，地圖 SHALL 自動切到它所在的天數；地點是候補時 SHALL 切到「全部」。

#### Scenario: 定位到別天的站

- **WHEN** 目前選 Day 2，旅伴從清單點了 Day 5 的地點
- **THEN** 地圖切到 Day 5 並移到那個地點

### Requirement: 標記與詳細資訊

點地圖上的標記 SHALL 打開該地點的詳細資訊；詳細資訊開著時，地圖 MUST NOT 同時顯示該地點的小視窗。點地圖空白處 SHALL 關閉詳細資訊。

#### Scenario: 點標記

- **WHEN** 旅伴點地圖上的標記
- **THEN** 打開詳細資訊，不另外跳出小視窗

### Requirement: 我的位置

按「我的位置」SHALL 開始持續定位，並在取得位置後移到那裡；之後再按 SHALL 移回目前位置。暫時收不到訊號時 MUST 保留最後的位置；沒有定位權限時 SHALL 停止定位並提示如何開啟權限。

#### Scenario: 在地下街收不到訊號

- **WHEN** 已經取得過位置，之後在地下街暫時收不到訊號
- **THEN** 地圖保留最後的位置，繼續等待新的位置

#### Scenario: 沒有定位權限

- **WHEN** 旅伴拒絕了定位權限
- **THEN** 停止定位，並提示到手機設定開啟定位

### Requirement: Google 底圖

有網路且 Google 圖磚可以用時，地圖 SHALL 使用 Google 的底圖，並 MUST 用高解析度圖磚，在手機上不模糊。地名的語言 SHALL 依測試頁的比較結果，固定為「日文」或「英文與日文並列」其中一種；地圖上字的大小 SHALL 依測試頁的比較結果，固定為「一般」或「兩倍字」其中一種。

#### Scenario: 用手機看淺草一帶

- **WHEN** 旅伴在有網路時打開地圖，移到淺草一帶
- **THEN** 底圖是 Google 的圖面，淺草寺、雷門、車站等地名用選定的語言顯示，文字清楚不模糊

#### Scenario: 選了兩倍字

- **WHEN** 正式版選定「兩倍字」，旅伴在同一個縮放層級看地圖
- **THEN** 地名與道路名稱的字，大約是 Google 地圖網頁版的兩倍大

### Requirement: 地圖來源標示

使用 Google 底圖時，地圖上 MUST 一直看得到 Google logo 與目前畫面的版權文字；手機版 MUST NOT 被底部的分頁列或其他按鈕蓋住。使用備用底圖時 SHALL 改顯示 OpenStreetMap 的版權文字。

#### Scenario: 手機上看地圖

- **WHEN** 旅伴用手機打開地圖，底部有分頁列
- **THEN** Google logo 與版權文字出現在分頁列上方，看得到、沒有被蓋住

#### Scenario: 移動地圖

- **WHEN** 旅伴把地圖拖到另一個區域
- **THEN** 版權文字更新成新畫面範圍的內容

### Requirement: 備用底圖

Google 圖磚用不了時，例如服務被停用、超過每日上限、沒有網路，地圖 SHALL 自動改用 OpenStreetMap 的備用底圖。標記、每天的路線、我的位置 MUST 照常顯示，MUST NOT 跳出錯誤訊息或提示。

#### Scenario: 超過每日上限

- **WHEN** 當天的 Google 圖磚已經用到每日上限，旅伴打開地圖
- **THEN** 地圖顯示備用底圖，標記與路線照常顯示，沒有任何錯誤提示

#### Scenario: 旅行後停用服務

- **WHEN** 主揪在 Google Cloud 停用了 Map Tiles API，旅伴打開 App
- **THEN** 地圖顯示備用底圖，其他功能都正常

#### Scenario: 用到一半圖磚載入失敗

- **WHEN** 旅伴正在用 Google 底圖，之後 Google 圖磚開始載入失敗
- **THEN** 地圖改用備用底圖，目前的位置與縮放不變

### Requirement: 深色主題的底圖

深色主題時，Google 底圖 SHALL 使用 Google 提供的深色樣式，MUST NOT 用反轉顏色的方式改變 Google 圖磚。使用備用底圖時，深色主題 SHALL 維持現在反轉顏色的做法。切換主題時底圖 SHALL 跟著切換，不需要重新整理頁面。

#### Scenario: 切換成深色主題

- **WHEN** 旅伴在地圖畫面把主題切成深色
- **THEN** 底圖換成 Google 的深色樣式，地名語言與字的大小不變、清楚可讀

#### Scenario: 備用底圖的深色主題

- **WHEN** 地圖正在使用備用底圖，旅伴切成深色主題
- **THEN** 備用底圖跟現在一樣用反轉顏色的方式變暗
