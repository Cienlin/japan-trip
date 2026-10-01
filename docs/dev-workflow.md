# 開發工作流程 (SESSION START 必讀)

> **本檔案是每次開工前的 checklist**。融合 openspec (SDD) + Matt Pocock 的 TDD 精神 + 雙 AI 交叉審查機制。
>
> 「越聰明的 AI、越需要老派基本功」— AI 時代瓶頸不是產能、是**控制**。

> **本專案的對照**：專案本身的規則（版號、`data.js` 欄位、照片、commit 訊息格式⋯）寫在根目錄的 `CLAUDE.md`，以它為準；本檔只管「修改要走哪條路、每一站做什麼」。
> 2026-10-01 從通用版移植，`<!-- 本專案 -->` 標記的地方是針對本專案調整過的內容。

---

## 0. 開工前 (每次 session 開頭)

- [ ] **`git pull`** — 使用者在公司與家裡兩台電腦輪流修改 <!-- 本專案 -->
- [ ] 載入專案記憶 / 背景資訊（`CLAUDE.md` 會自動載入；上次進度看 `openspec/changes/` 與 `git log --oneline -10`） <!-- 本專案 -->
- [ ] **讀完這份 workflow** (你正在做的事)
- [ ] `git status` 看有無 uncommitted
- [ ] `ls openspec/changes/` 看有無 in-flight change (只該有 archive/、若有其他資料夾表示未完成的 change)
- [ ] （可選）用開工 skill 自動化上面幾步 <!-- 本專案：尚未建立 -->

### 工具安裝（每台電腦第一次） <!-- 本專案 -->

- `/opsx:*` 執行時會呼叫 `openspec` 指令，**每台電腦都要安裝**（需要 Node 20.19 以上）：
  ```
  npm install -g @fission-ai/openspec@latest
  openspec config set telemetry.enabled false
  ```
- skills 都在 repo 的 `.claude/skills/`，`git pull` 就有，不用另外裝
- 升級 openspec 後執行 `openspec update` 重新產生 `.claude/` 裡的 openspec skills 與指令，再 commit

---

## 1. 任務分類 — 先決定走哪條路

不是所有 task 都要走完整 5 站流程。**先分類、才走對路**：

| Task 類型 | 例子 | 路徑 |
|---|---|---|
| **Quick fix** (< 30 分) | typo、rename var、加註解、修單一 bug；**本專案：使用者貼上的「## 本次變更」、改行程資料、照片同步、行前指南文字** <!-- 本專案 --> | **跳過 openspec**、直接動、照 `CLAUDE.md` 的流程 commit + push |
| **Refactor / cleanup** | 抽 helper、統一命名、刪 dead code；本專案：把 `app.js` 的純函式抽成模組 <!-- 本專案 --> | **可跳 openspec**、需 code-review、要 verify no regression |
| **Substantial change** | 新功能、authz change、schema migration；本專案：`data.js` 格式變更、預覽網址、新畫面 <!-- 本專案 --> | ✅ **走完整 openspec 流程** (下方 Stage 1-5) |
| **Old system 對齊 / 遷移** | 從舊系統遷 code、對齊舊系統行為；本專案：靜態網站 → 有後端的 App <!-- 本專案 --> | ✅ 完整流程 + **加規則考古前置** (下方 Stage 0) |
| **Security / auth / migration** | 權限檢查、data migration、authz check；本專案：登入、旅行成員權限、把手機上的本機修改搬到伺服器 <!-- 本專案 --> | ✅ 完整流程 + **強制品質關卡** (下方 §3) |

如果不確定分類、**先問 user**、別自己拍板。

---

## 2. 完整流程 (Stage 0-5)

### Stage 0 (只 old system 遷移用):規則考古

**「舊 code 告訴你它做了什麼、不會告訴你為什麼」**

- AI 讀舊 code + 資料表、把散落的**隱性規則**整理成「功能對照表 + 改善 issue」清單
- User 逐條拍板:「當年將就 vs 刻意設計」
- 拍板結果進 Stage 1 explore 當輸入

<!-- 本專案 -->
本專案的「舊 code」是 `app.js`、`data.js`、`sw.js`、`tools/check-data.js`；拍板後的結果寫成 `openspec/specs/` 的基準規格。

---

### Stage 1: EXPLORE (拷問共識)

**工具**:`/opsx:explore` 或 `/grill-me` (更嚴) <!-- 本專案：/grilling 是被呼叫的底層 skill，使用者輸入的入口是 /grill-me -->

**規則** (Matt Pocock 精神):
1. **一次只問一題** — 避免認知超載
2. **事實自查、決策才問** — AI 可查的事實不該問 user (grep / git log / 讀檔)
3. **提供建議答案** — 讓 user「審查提案」而非「面對空白」
4. **建立名詞表** — 三方 (user / AI / code) 用同一套詞彙（寫在根目錄 `GLOSSARY.md`） <!-- 本專案 -->

> 注意：`/grilling` 原本的做法是「一輪列出所有目前能問的題目（編號＋建議答案）」，跟規則 1 不同。用 `/grill-me` 時照 skill 的一輪多題；用 `/opsx:explore` 時照規則 1 一次一題。 <!-- 本專案 -->

**輸出**:拍板需求 + 對齊詞彙 + 決定要不要進 Stage 2

**紅線**:如果連 explore 都不確定、不要進 Stage 2、多問幾輪

---

### Stage 2: PROPOSE (寫規格)

**工具**:`/opsx:propose <change-name>`

**產出** (openspec 4 artifacts，以繁體中文撰寫，設定在 `openspec/config.yaml`): <!-- 本專案 -->
- `proposal.md` — What/Why/Impact
- `design.md` — 技術設計
- `specs/<capability>/spec.md` (deltas) — Requirement 增/改/刪
- `tasks.md` — 拆成可執行步驟

**紅線**:User review 通過再進 Stage 3、**不要自己跳過 approval**

---

### Stage 3: APPLY (實作)

**工具**:`/opsx:apply <change-name>`

**核心紀律** (Matt Pocock 反 AI 作弊):

- **Security / authz / migration change → TDD**:
  - **先寫測試** (至少 integration test) → 測試必失敗 → 再寫實作使其通過
  - 原因:AI 若先寫程式後補測試、可能生「配合錯誤答案的假測試」
  - 例子:權限檢查、authz check、data migration、role change
- **替既有 code 補測試 (test-after) 時、要人為製造紅燈**:
  - 暫時拿掉 / 註解掉被測的那段實作 → 測試**必須失敗、且失敗在預期的 assertion** → 還原 → 必須通過
  - 拿掉實作還是通過 = 假測試、要重寫
  - 測試環境（例如 in-memory DB）跟正式環境行為不同時、這步也順便驗證測試環境能重現 bug
- **一般 feature change**:
  - Manual UI verify + code review 可接受
  - 但要**真的用瀏覽器操作一次**、不能只靠 build pass 就 claim done
- **UI change**:
  - **必須** 在瀏覽器實際點過、包含 golden path + edge cases
  - Type check / test suite 只驗 code 正確性、不驗 feature 正確性

<!-- 本專案 -->
**本專案的「瀏覽器實測」由使用者用手機做**：Claude 不跑瀏覽器、headless、本機伺服器（公司電腦 IT 政策）。Claude 交出測試清單（每一步寫「預期看到什麼」，含 golden path + edge cases），使用者實測回報後才能 claim done。

**本專案的測試**：用 Node 內建的 `node --test`（不用安裝套件），只測從 `app.js` 抽出來、不碰 DOM 的純函式。

**Ship pattern** (每個 task 完成): <!-- 本專案 -->
1. 靜態檢查：`node --check` 改到的 JS、改到 `data.js` / `index.html` 時跑 `node tools/check-data.js`（❌ 要修好）、有測試時跑 `node --test`
2. 改到 HTML / CSS / JS / `data.js` / `image-manifest.js` → 更新 `sw.js` 的 `VERSION` 與 `index.html` 的 `#version-badge`
3. `git commit` (commit message 說 why、不只是 what；格式見 `CLAUDE.md`)
4. Push (若 tasks.md 有明確 push 節點) → 給使用者手機測試清單 → 等實測結果
   - ⚠️ 預覽網址建立之前，push 到 `main` 就會直接更新 5 個人手機上的網站

---

### Stage 4: REVIEW (審查)

**工具**:
- Claude Code 內建 `/code-review` (medium/high/xhigh/ultra 依 change 大小)
- Optional:第二個 AI 交叉審查 (例如 Codex，high-risk change 用) <!-- 本專案：尚未設定 -->

**紀律**:
- Security / authz / data migration → 至少 xhigh 或 ultra
- 一般 refactor → medium 夠
- Findings 要 **verify premise 再套用**:reviewer 的判斷本身可能錯 — 套用或拒絕前，先分清楚它是根據實際 code / baseline 查證過的、還是推測
- **All findings triaged (fixed / rejected with reason / deferred to backlog)** 再進 Stage 5

---

### Stage 5: ARCHIVE

**工具**:`/opsx:archive <change-name>`

**做的事**:
- Sync change 的 spec deltas 到 `openspec/specs/` main spec
- Move change folder 到 `openspec/changes/archive/YYYY-MM-DD-<name>/`
- Commit archive + push（`/opsx:archive` 本身不會 commit，要另外做；只動 `openspec/` 不用更新版號） <!-- 本專案 -->

---

## 3. 品質關卡 (必守、不能 skip)

| Change 類型 | 必守的檢查 |
|---|---|
| **Security / authz / migration** | TDD 或至少 integration test + code-review xhigh 以上 + 部署時的資料 / 權限遷移（確認每個環境都有套到） |
| **UI change** | Browser 實測 (golden path + edge cases，本專案由使用者手機實測) + code-review medium 以上 |
| **Refactor** | 零 regression manual verify + code-review medium 以上 |
| **Old system 對齊** | Config / 常數逐字元 diff + 每個對齊點附舊 code 引用來源（檔案:行號） |

<!-- 本專案 -->
**本專案特有（每次都要）**：
- 版號：`sw.js` 的 `VERSION` 與 `index.html` 的 `#version-badge` 一致
- `node tools/check-data.js` 沒有 ❌，⚠️ 要確認過
- 使用者寫的地點名稱與介紹照原樣，不修正錯字
- 移動 / 新增 / 刪除地點：前後站的 `transitInfo` 與 `index.html` 行前指南裡提到它的句子都要檢查

---

## 4. 常見陷阱 (別重蹈覆轍)

1. **AI 是作弊仔** — 別讓 AI 自己寫測試又自己驗過 (Matt Pocock 洞見)；測試寫完要給 user 看「到底檢查了什麼」
2. **Reviewer 的 premise 也要 verify** — 對 fix 建議 & 診斷 (冗餘 / dead code) 都要驗證背後假設
3. **開發環境的設定不等於正式環境** — 權限、角色、seed 資料、DB 設定若是在 dev 手動建 / 手動勾的，新環境不會自動有；要補 data migration 或寫進上線 checklist
4. **對齊舊系統要字元級 diff** — 概念層次描述會漏（例如兩個 domain 只差一個字母、看起來一樣其實是不同服務）
5. **AI 幫不上忙的事 = 最花時間** — 業務單位需求確認、取捨拍板、外部單位回覆速度
6. **爛程式碼比以前更貴** — 一爛 AI 就繼續生垃圾 (Matt Pocock)
7. **文件 / backlog 會過時** — 推薦或宣稱「已修好 / 還沒做」前，先對 code + git log 確認現況；沒實際跑過就說「code 看起來對、未實測」

<!-- 本專案 -->
8. **push 到 `main` 就是上線** — GitHub Pages 從 `main` 部署，使用者和 4 位朋友的手機都會更新
9. **兩台電腦** — 開工先 `git pull`；只存在某台電腦的東西（下載資料夾的檔案、Claude 的記憶）另一台看不到，要放進 repo
10. **不要自己跑瀏覽器測試** — 公司電腦的 IT 政策禁止，也不要換工具繞過；交測試清單給使用者
11. **行前指南的句子不會自動更新** — 天數標籤 `data-day-of` 會自動填，但句子裡寫死的「D5 上野」不會
12. **流程文件本身也會過時** — 例如通用版寫 `/domain-modeling` 會寫 `CONTEXT.md`，實際版本是 `GLOSSARY.md`；更新 skill 後要對照 `SKILL.md` 修正本檔

---

## 5. 動詞速查 (skills 有哪些)

### 先看 skill 功用（第一次使用或改寫前必做）

每個 skill 是 `.claude/skills/<名稱>/` 底下的一個資料夾。第一次用、或要依專案修改前，先讀過：

1. **`SKILL.md` 開頭的 `description`** — 它在什麼情境會被觸發
2. **`SKILL.md` 本文** — 實際步驟、會問 user 什麼、最後產出什麼
3. **同資料夾的其他檔案**（參考文件、`agents/`）— skill 會引用它們，搬移時**整個資料夾一起搬**，不要只複製 `SKILL.md`
4. **它會讀寫哪些檔案、依賴哪些其他 skill** — 例如： <!-- 本專案：依 2026-09-29 版的 SKILL.md 修正 -->
   - `/domain-modeling` 會寫 `GLOSSARY.md` 與 `docs/adr/`（需要時才建立）
   - `/tdd`、`/improve-codebase-architecture` 會讀 `GLOSSARY.md` 與 `docs/adr/`
   - `/improve-codebase-architecture` 會用到 `/codebase-design`、`/grilling`、`/domain-modeling`
   - `/grill-me` 只是呼叫 `/grilling`
   - `/tdd` 說重構屬於 review 階段、指向 `code-review` skill；本專案用 Claude Code 內建的 `/code-review`

   缺了被依賴的 skill 或檔案，流程會跑不完整

讀完再決定：這個 skill 本專案用不用得到、要不要調整內容。

### 速查表

| 動詞 | Skill | 功用 | 用時 |
|---|---|---|---|
| 開工 | （尚未建立） | 讀專案狀態、整理上次進度與待辦 | Session start |
| 收工 | （尚未建立） | 整理當日進度、更新紀錄 | Session end |
| 探索 | `/opsx:explore` | 思考夥伴模式：探索想法、調查問題、釐清需求 | Stage 1 |
| 探索（更嚴） | `/grill-me`（底層是 `grilling`） | 針對計畫 / 決策逐輪拷問，壓力測試想法 | Stage 1 |
| 提案 | `/opsx:propose` | 一次產出 proposal / design / specs / tasks 四份文件 | Stage 2 |
| 實作 | `/opsx:apply` | 依 change 的 tasks.md 逐項實作 | Stage 3 |
| 寫測試 | `/tdd` | 測試先行（紅 → 綠）、先跟 user 確認要測哪些 seam | Stage 3 內、security/authz change 必用 |
| 找 refactor 機會 | `/improve-codebase-architecture` | 掃 codebase 找可「加深」的模組、產出 HTML 報告，再針對選定項目拷問 | 定期跑（例如 sprint 收尾）、掃 hot spots 提候選 |
| 深模組討論 | `/codebase-design` | 設計深模組的共用詞彙（seam、depth 等），討論 interface 與可測試性 | 討論 interface 設計、當作 vocabulary reference |
| 維護詞彙表 | `/domain-modeling` | 建立專案名詞表 `GLOSSARY.md`、記錄架構決策 ADR | 加新業務詞彙、記 ADR |
| 審查 | `/code-review` | Claude Code 內建：審查 diff 的正確性問題 | Stage 4 |
| 同步規格 | `/opsx:sync` | 不歸檔、只把 change 的 spec deltas 同步到 main spec | 需要時（`/opsx:archive` 會自動呼叫） |
| 歸檔 | `/opsx:archive` | 實作完成後歸檔 change、同步 spec | Stage 5 |
| 上線 | （尚未建立） | 部署前檢查 | Deploy 前 |

<!-- 本專案 -->
**來源與版本**（更新時照這裡重新下載，整個資料夾覆蓋，再對照本檔第 4 點）：
- `openspec-*` skills 與 `/opsx:*` 指令：`openspec init --tools claude` 產生（openspec 1.14.0），不要手動修改
- `grilling`、`grill-me`、`tdd`、`domain-modeling`、`codebase-design`、`improve-codebase-architecture`：<https://github.com/mattpocock/skills> commit `d81f3a1`（2026-09-29），MIT 授權（`.claude/skills/LICENSE-mattpocock-skills.txt`），未修改內容
- **刻意不裝** Matt Pocock 的 `code-review`：跟 Claude Code 內建的 `/code-review` 同名
- `/improve-codebase-architecture` 的報告寫在系統暫存資料夾；本專案**不自動開啟瀏覽器**，告訴使用者檔案路徑，由使用者自己開

**專有詞彙**（Matt Pocock 的，詳細定義在 `/codebase-design` 與 `/tdd`）：
- **seam**（縫合處）：公開邊界、測試該架在這裡而不摸內部
- **module**（模組）：一組相關功能 + 清楚 interface 的單位
- **depth**（深度）：caller 每學一單位 interface 能用到多少行為（深 = 簡單 interface + 複雜實作 = 好用）
- **leverage**（槓桿）：一段 code 有多少 reuse、改動影響多大
- **locality**（局部性）：相關 code 是否放一起
- **tracer bullet**（曳光彈）：一個 task/ticket 打穿所有 layer 的垂直切片（`/tdd`）
- **deletion test**：問「刪掉這個會集中複雜度還是搬移複雜度」— 集中 = 深、搬移 = 淺

**Skill 是動詞、workflow 是食譜。這份 workflow 說明「動詞怎麼串起來」**。

---

## 6. 融合三家精華對照

| 來源 | 貢獻 |
|---|---|
| **openspec** | SDD 主架構 (propose → apply → archive)、governance 完整 |
| **Matt Pocock skills** | Grill 精神 (Stage 1 更嚴)、TDD 防 AI 作弊 (Stage 3)、code-review 節點 (Stage 4) |
| **舊系統重寫實務** | 規則考古 (Stage 0)、Issue → Branch → PR → review → Merge 標準流程、雙 AI 交叉審查 |

**融合、不糾結誰勝誰**。SDD 回答「要做什麼」、TDD 回答「怎麼確保做對」、交叉審查回答「有沒有盲點」— 三者不同層級、疊起來用。

---

## 附錄:一句話總結

> **openspec (SDD framework) + TDD (implement 品質關卡) + 雙 AI 交叉審查 + grill 精神 (逼問共識) — 融合、不糾結誰勝誰**。二選一是假問題、真問題是「你現在最弱的環節是哪個」。
