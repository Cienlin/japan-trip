# Spec Delta

## MODIFIED Requirements

### Requirement: 照片與地圖圖磚

照片與看過的備用底圖（OpenStreetMap）圖磚 SHALL 優先使用手機上的快取。備用底圖圖磚的快取 MUST 有上限（1500 張），超過時從最早存入的開始刪除。Google 底圖的圖磚 MUST NOT 存進 App 自己的離線快取（Google 的使用規定），只靠瀏覽器一般的快取。

#### Scenario: 看過的地圖區域

- **WHEN** 旅伴之前用備用底圖看過淺草附近的地圖，現在沒有網路
- **THEN** 地圖改用備用底圖，淺草附近的地圖仍然看得到

#### Scenario: 只用 Google 底圖看過的區域

- **WHEN** 旅伴只在有網路時用 Google 底圖看過新宿，現在沒有網路
- **THEN** 地圖改用備用底圖；新宿一帶沒有存過備用底圖的圖磚，底圖是空白，但標記與路線照常顯示
