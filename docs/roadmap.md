# App 發展路線圖

旅行結束後，要把這個行程網站發展成多人共用的 App。以下階段是 2026-10-01 訂的，開發方式照 `docs/dev-workflow.md`。

- 完成一個階段，或進度有變時，更新這份文件
- 到 12/14 旅行結束前，網站要讓 5 個人穩定使用，所以大改動都等旅行之後

## 階段

| 階段 | 內容 | 狀態 |
|---|---|---|
| Phase 0 | 導入開發流程（OpenSpec + Matt Pocock skills）、建立名詞表 `GLOSSARY.md`，只動文件 | ✅ 2026-10-01 |
| Phase 1 | 規則考古：把現有程式的規則寫成基準規格 `openspec/specs/`（8 份）；程式跟規格不一致的地方、還沒決定的設計問題記在 `docs/backlog.md` | ✅ 2026-10-01 寫完，使用者審閱中 |
| Phase 2 | 凍結期：旅行結束前不動網站架構，只做 Quick fix（行程資料、照片、行前指南文字）。破例：地圖底圖改用 Google 圖磚（OpenSpec change `google-map-tiles`，2026-11-12 完成，v1.4.9 上線）；預算分頁與逐筆記帳（`budget-tab`，2026-11-12 完成，v1.4.16 上線） | 進行中，到 2026-12-14 |
| Phase 3 | 重構：資料跟程式分開，純邏輯拆成模組並用 `node --test` 測試；處理 backlog 標「Phase 3」的項目，並決定 D1、D2 | 旅行後 |
| Phase 4 | 加後端，讓旅伴的修改能同步；一併決定 backlog B9 | 旅行後 |
| Phase 5 | 需要手機原生功能時，才用 Capacitor 包成 App | 視需要 |

## 目前進度

最後更新：2026-11-12

- Phase 1 的規格與 backlog 已 commit，使用者還在審閱；有要改的地方直接改規格或 backlog
- 旅行前原則上只做 Quick fix；Phase 3 等旅行結束再開始
- 凍結期破例已完成（2026-11-12）：手機上地圖糊、字太小，底圖換成 Google 圖磚，用不了時自動改用 OpenStreetMap；使用者手機實測通過。紀錄在 `openspec/changes/archive/` 的 `google-map-tiles`，管理方式見 README「Google 地圖底圖」
- 凍結期破例已完成（2026-11-12）：預算計算機搬到新的「預算」分頁，總預算各自設定，旅途中逐筆記錄花費；使用者手機實測通過。紀錄在 `openspec/changes/archive/` 的 `budget-tab`
