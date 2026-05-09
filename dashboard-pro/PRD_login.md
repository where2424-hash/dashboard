# PRD_login（Dashboard × PaPiin 登入 / 帳號 / 會員資料）

> 最後更新：2026/05/07　版本：v1  
> 目的：定義 Dashboard 部署於 PaPiin 子網域後的登入整合、會員資料帶入與可編輯規範。  

---

## 0. 名詞定義

- **PaPiin**：主系統（帳號、身份、公司資料的來源系統）。
- **Dashboard**：子網域產品（例如 `dashboard.papiin.com`），以 PaPiin 登入態為準。
- **登入主體（Auth User）**：用於驗證身份的登入帳號（Email/第三方登入）。
- **會員（Member）**：PaPiin 的 `members` 記錄，含 `type` 身份。
- **當前帳號（Active Member）**：同一登入可能對應多個 `members` 記錄（可切換）；Dashboard 的「預設顯示身份（如個人/團隊）」以 Active Member 為準，但 **Dashboard 的工作區與權限**不等同於 PaPiin 的 members（見第 6、10 節）。

---

## 1. 目標與範圍

### 1.1 目標

- Dashboard **不自行管理帳密**，登入狀態由 PaPiin 帶入。
- PaPiin 已有的「個人資料」欄位，Dashboard 進站後 **自動帶入並顯示**。
- PaPiin 已有的「團隊資料（創作團隊 type=1）」欄位，Dashboard 進入團隊工作區時 **自動帶入並顯示**。
- PaPiin 未包含、但 Dashboard 業務需要的欄位，允許在 Dashboard 的：
  - **團隊資料**
  - **個人資料**
 內進行編輯與保存。

### 1.2 非目標

- 不在本 PRD 定義報帳系統流程（另見 `PRD_expense.md`）。
- 不在本 PRD 定義 PaPiin 端 UI 實作細節（僅定義互動與介面契約）。

---

## 2. PaPiin 身份（members.type）與 Dashboard 適用性

PaPiin 以 `members.type` 區分身份（來源：會員資料對照文件）。

### 2.0 PaPiin type 總覽（參照用）

| type 值 | 身份名稱 | 說明 |
| --- | --- | --- |
| -2 | 未完成資料 | 註冊後尚未選擇身份，功能最受限 |
| -1 | 基礎會員 | 略過身份選擇，功能部分受限 |
| 0 | 影視工作者 | 進階會員，影視產業個人從業者 |
| 1 | 創作團隊 | 製作公司、動畫公司等，有獨立團隊頁面，需填統編 |
| 2 | 學生 | 進階會員身份，享有 IM 與應徵職缺權限，但不能刊登職缺 |
| 3 | 劇組（Crew） | 學校劇組，不在前台一般創作者列表，與 Dashboard 較無關 |
| 5 | 廣告從業者 | 進階會員，廣告產業從業者 |
| 6 | 品牌方／行銷公司 | 進階會員，為發案方，不能應徵職缺，需填統編與公司資料 |

### 2.0.1（補充）PaPiin 各身份功能權限對照（參照用）

| 功能 | 基礎會員（-1） | 影視工作者（0） | 廣告從業者（5） | 品牌方（6） | 學生（2） | 創作團隊（1） |
| --- | --- | --- | --- | --- | --- | --- |
| 使用站內 IM | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 應徵職缺 | ✗ | ✓ | ✓ | ✗ | ✓ | ✓ |
| 刊登職缺 | ✗ | ✗ | ✓ | ✓ | ✗ | ✓ |
| 上傳作品 | ✗ | ✓ | ✓ | ✗ | ✓ | ✓ |
| 共同編輯作品 | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 建立創作團隊 | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ |
| AI 搜尋 | 有次數限制 | 不限次 | 不限次 | 不限次 | 不限次 | 不限次 |
| 帳號有個人頁（供他人搜尋） | ✗ | ✓ | ✓ | ✗ | ✗ | ✓ |

> 註：品牌方無法進入「應徵管理」頁（PaPiin 規則）。  
> 註：共同編輯作品：基礎會員需升級後才可操作（PaPiin 規則）。

### 2.1 Dashboard 進站可用狀態（必須明確）

Dashboard 的使用者狀態拆成兩層：

- **可瀏覽（Read-only）**：允許所有已登入狀態進入 Dashboard 瀏覽介面（包含 `type=-2`）。
- **可操作（Write/Submit）**：涉及寫入/送出/敏感資料的操作（如送出勞報單、送出報帳、更新匯款資訊、公司權限設定）需滿足「資料完整度」門檻。

- 若 `type = -2`：僅可瀏覽；在觸發可操作功能時，導回 PaPiin 完成/略過流程，回跳後再繼續。
- 若 `type = -1`：可操作的功能由產品決策（可填但送出前仍要求補齊必要欄位，例如手機 OTP、帳戶資料等）。
- 其餘 `type`：可進入並依權限控管可操作範圍。

### 2.2 Dashboard 登入分層（產品用語）

- **個人未註冊**：對應 `type = -2`
- **個人基礎會員**：對應 `type = -1`
- **個人進階會員**：對應 `type ∈ {0, 2, 3, 5, 6}`（其中 `type=6` 視為個人進階會員的一種）
- **團隊**：對應 `type = 1`（創作團隊帳號）

> 重要：Dashboard 只有以上四種「產品身分」分層；不在 Dashboard 提供 PaPiin 的「切換帳號/切換 Active Member」能力。  
> 使用者在 Dashboard 的切換只發生在「工作區（workspace）」層。

### 2.3 Dashboard 權限策略（基礎 vs 進階；暫定）

- **暫定規則**：在 Dashboard 內，**個人基礎會員（type=-1）與個人進階會員（type∈{0,2,3,5,6}）的權限一致**；若未來需要區分，再另行補上「差異權限清單」。
- **唯一例外**：**個人未註冊（type=-2）** 只能 Read-only；觸發任何「可操作（Write/Submit）」行為時，導回 PaPiin 完成/略過後再返回（見第 3.4）。

---

## 3. 登入與跳轉流程（User Flow）

### 3.1 進入 Dashboard（已登入 PaPiin）

1. 使用者開啟 Dashboard（子網域）。
2. Dashboard 以 PaPiin session 驗證登入狀態。
3. Dashboard 取得 **Auth User + Active Member +（必要時）Company** 資料。
4. Dashboard 預設進入 **個人工作區（Personal Workspace）**。
5. 使用者可透過 **下拉式選單** 切換到自己有權限的 **團隊工作區（Team Workspace）**。
6. 若 Active Member `type = -2`：允許進入 Dashboard，但標記為 Read-only；當使用者觸發「可操作」功能時，才導回 PaPiin 完成身份流程。

### 3.2 進入 Dashboard（未登入 PaPiin）

1. Dashboard 檢查不到有效登入態。
2. 302 導到 PaPiin 登入頁，並帶回跳參數 `returnUrl`（Dashboard 來源頁）。
3. PaPiin 登入成功後導回 Dashboard。

### 3.3 Dashboard 需要「新建帳號／補齊會員資料」

> 原則：帳號建立/身份完成屬 PaPiin；Dashboard 只負責導轉並在回跳後刷新登入資訊。

- Dashboard 導至 PaPiin 建立/補資料頁，帶：
  - `returnUrl`：回到 Dashboard 的 URL
  - `state`：防止跳轉竄改（必須可驗證）
- PaPiin 完成後導回 `returnUrl`
- Dashboard 回跳後重新呼叫「取得登入資訊」端點，確認已達到可操作功能所需的資料門檻（至少 `type != -2`）

### 3.4 `type=-2` 導回 PaPiin 後的「續作」規則

當 `type=-2` 使用者在 Dashboard 嘗試執行可操作行為而被導回 PaPiin，Dashboard 必須支援回跳後「回到原流程」：

- 導轉前：Dashboard 保存 `pendingAction`（例如目標頁、操作類型、草稿/表單 ID、提交前一步驟），並在導轉時帶入 `state`（可驗證且可過期）。
- 回跳後：Dashboard 重新呼叫 `/dashboard-auth/me` 取得最新狀態：
  - 若仍為 `type=-2`：維持 Read-only 並提示使用者尚未完成（不得自動提交）。
  - 若已 `type!=-2`：導回 `pendingAction` 對應頁面/步驟，讓使用者可繼續操作。

---

## 4. 資料來源與欄位帶入規格

### 4.0 帶入/同步原則（重要）

本 PRD 的「自動帶入」採 **一次性 seed** 原則：

- **第一次進入 Dashboard 時**：將 PaPiin 已有欄位帶入 Dashboard（作為預填/初始值）。
- **後續使用 Dashboard 編輯保存後**：以 Dashboard 端保存的值為準，**不再持續從 PaPiin 覆寫**（避免使用者在 Dashboard 的修改被刷新掉）。
- 例外：若某欄位在 Dashboard 尚未建立/尚未填寫（為空），可於特定時機再次帶入（例如重新登入時補齊空值），但不得覆寫已由使用者在 Dashboard 編輯過的欄位。

#### 4.0.1 使用者主動「重新同步」按鈕（補充）

當使用者在 PaPiin 端更新了個人/公司資料，Dashboard 需提供「重新同步」按鈕，讓使用者可主動以 PaPiin 的最新值更新 Dashboard 顯示。

- 「重新同步」的寫入範圍：僅限 **PaPiin 有對應欄位**且屬於「可由 PaPiin 同步」的欄位（例如 `name / email / mobile / pic / company name / tax id` 等），不包含 Dashboard 自管欄位（國籍、地址、金融資訊等）。
- 覆寫規則：按下後以 PaPiin 最新值覆寫 Dashboard 的「對應可同步欄位」（等同使用者明確同意用 PaPiin 取代 Dashboard 目前值）。
- 不影響：Dashboard 自管欄位（國籍、地址、金融資訊、檔案）一律保留。

##### 4.0.1.1 「重新同步」的 UX 與驗收

- 入口：個人資料頁與 team workspace 的團隊資料頁，提供「重新同步」按鈕。
- 點擊後：顯示確認視窗，列出「將被覆寫的欄位」與差異摘要（至少欄位名稱與新值）。
- 確認後才執行：同步成功需立即刷新畫面；失敗需提示錯誤並保持原值不變。

- `profileSync.papiinSeededAt`：第一次 seed 時間
- `profileSync.dashboardEditedAt`：最後一次在 Dashboard 編輯時間
- `profileSync.fieldLocks`：哪些欄位已由 Dashboard 接管（避免覆寫）

### 4.1 帳號字段：account vs email（必須遵守）

- `account`：登入帳號（可能為 email 或系統帳號）
- `email`：聯絡信箱
- 兩者分開，Dashboard 不可假設永遠相同。

### 4.2 個人資料（Personal Profile）

#### 4.2.1 PaPiin 有 → Dashboard 初次自動帶入（seed；後續以 Dashboard 為準）

- `name`（姓名）
- `account` / `email`
- `mobile`（需 OTP 才有值；Dashboard 必須允許為空）
- `pic`（頭像）
- 其他可選帶入：`tel`、`nickname`、`location`、`url_name`、`comm_software.line`

#### 4.2.2 PaPiin 無 → Dashboard 可編輯與保存（Dashboard 自管）

以下欄位 PaPiin 未提供，Dashboard 需要則由 Dashboard 保存（在個人資料頁可編輯）：

- **身分證字號**
- **國籍**
- **二代健保免扣繳身份**
- **戶籍地址**
- **通訊地址**

> 保存位置：Dashboard 個人資料，不得回寫 PaPiin 既有 `members` 結構，除非另有明確擴充方案與對應 API。

#### 4.2.3 敏感欄位（身分證字號）顯示與保護（必須明確）

- UI 顯示：預設遮罩（例如 `A123****89`），僅允許本人在「編輯」流程中查看/更新。
- 權限：不得在 team workspace 或他人可見處顯示完整值。
- 儲存：後端需做欄位加密與存取稽核（誰在何時建立/更新），並限制僅授權服務可解密。

### 4.3 金融/收款資訊（Payout / Bank）

#### 4.3.1 PaPiin 無 → Dashboard 可編輯與保存（Dashboard 自管）

- 銀行名稱
- 分行
- 銀行帳號
- 戶名
- 存摺封面上傳（檔案）

#### 4.3.2 顯示與隱私

- Dashboard UI 顯示帳號必須支援遮罩（例如 `1234****7890`），並提供「確認/修改」流程。
- 後端儲存需加密或做適當保護（依資安規範）。

---

## 5. 公司/統編資料（重要：兩套機制，必須分流）

> 這一節描述的是 **PaPiin 既有的公司/統編資料結構**（兩套機制），以便 Dashboard 在「帶入資料」與「團隊工作區對應」時能正確取值。  
> 其中 **品牌方（type=6）不進入 Dashboard 團隊工作區**，但其 company 資料仍可能在個人工作區視角被用於顯示/預填（例如抬頭資訊）。

### 5.1 創作團隊（type=1）

- 統編欄位：`members.tax_id_number`
- 公司名稱：`members.name`
- 團隊成員關係：`team_members`（含 `level` 權限層級）

### 5.2 品牌方（type=6）

- 公司資料在 `companys` 表（不是 `members`）
- `members.company_id` 連到公司
- 統編：`companys.tax_id_number`（建立後不可修改；前端 disabled）
- 公司欄位（概念）：`name / intro / location / website / phone / pic / industries`
- 文件/證明：`company_members.certificate`

### 5.3 Dashboard 顯示規則（公司名稱/統編）

- 若 Active Member 為 **品牌方（type=6）**：
  - 公司名稱 = `companys.name`
  - 統編 = `companys.tax_id_number`
- 若 Active Member 為 **創作團隊（type=1）**：
  - 公司名稱 = `members.name`
  - 統編 = `members.tax_id_number`
- 若 Active Member 為 **個人（type 0/5/2/-1）**：
  - 不提供統編（除非另定義「受雇公司」欄位，需 Dashboard 自管）

### 5.4 Dashboard 團隊工作區適用性（對齊產品）

- Dashboard 的「團隊工作區」定位為 **製作公司/創作團隊專區**，主要對應 PaPiin 的 **type=1（創作團隊）**。
- **type=6（品牌方）不進入團隊工作區**（在 Dashboard 視角為「個人進階會員」的一種）。
- 若其他身份（例如 `type=5` 廣告從業者個人）需要進入團隊工作區，必須透過 Dashboard 的成員清單/RBAC 加入對應團隊工作區或是新增團隊。

> 補充：即使 `activeMember.type=6`（品牌方/個人），若該登入帳號被列入 Dashboard 某團隊工作區的成員，仍可依 Dashboard 的權限規範進入該 team workspace（以 Dashboard RBAC 為準）。

---

## 6. Dashboard 身分與工作區切換規格（取代 Active Member 切換）

### 6.1 核心要求（重要）

- Dashboard 只提供「切換工作區（workspace）」能力，不提供 PaPiin 的「切換帳號/切換 Active Member」能力。
- Dashboard 內的權限與可見範圍，以 `workspaceMemberships` / RBAC 為準（見第 10 節）。
- `activeMember.type=6` 在 Dashboard 視角為「個人進階會員」的一種；是否可進入 team workspace 只取決於 Dashboard RBAC（見 5.4 補充）。

### 6.2 工作區切換的最小介面需求

- 取得使用者可用 `workspaces[]` 與 `workspaceMemberships[]`
- 設定 `activeWorkspaceId`（並影響後續 Dashboard 內資料邊界）

### 6.4 工作區預設與記憶規則（必須明確）

- **預設**：首次進站或無記憶時，`activeWorkspaceId` = personal workspace。
- **記憶**：若使用者上次在某個 workspace，下一次進站可回到「上次使用的 workspace」（前提是仍有該 workspace 權限）。
- **無權限處理**：若使用者透過深連結進入自己無權限的 team workspace：
  - 顯示「無權限」提示
  - 自動切回 personal workspace（或導向 personal 首頁）

### 6.3 PaPiin 創作團隊權限（參照用）

PaPiin 的創作團隊成員角色與權限（存於 `team_members.level`）如下，供理解來源系統行為；Dashboard 實際權限仍以自身 RBAC 為準。

| 層級 | 角色 | 可執行的操作 |
| --- | --- | --- |
| create_id | 建立者 | 所有操作；層級不可被其他人修改 |
| level > 0 | 管理員 | 邀請成員、調整成員層級、移除成員、編輯團隊資料 |
| level = 0 | 一般成員 | 查看成員列表、參與作品共同編輯 |

---

## 7. 介面契約（建議 API；可由 PaPiin 或 Gateway 提供）

### 7.1 取得登入資訊（Dashboard 啟動必呼叫；需支援工作區）

`GET /dashboard-auth/me`

回傳需至少包含：

- `authUser`：登入主體資訊（account/email 等）
- `activeMember`：目前選定 member（含 `type`）
- `members`：PaPiin 端 members 清單（Dashboard 不提供切換，但可用於顯示/判斷）
- `profile`：Dashboard 顯示用的個人資料（PaPiin 可帶入的欄位；不足則為空）
- `workspaces[]`：包含 1 個 personal workspace + N 個 team workspaces
- `activeWorkspaceId`：使用者目前所在工作區（預設為 personal workspace）
- `workspaceMemberships`：使用者在各工作區的角色/權限（以 Dashboard 設定為準）
- `company`：當 `activeMember.type = 6` 時提供（品牌方公司資料；不進入團隊工作區，但可供個人工作區視角顯示/預填）

範例（概念示意）：

```json
{
  "authUser": { "account": "eric@example.com", "email": "eric@example.com" },
  "activeMember": { "id": "m_001", "type": 0, "name": "Eric Wang", "pic": "..." },
  "members": [
    { "id": "m_001", "type": 0, "name": "Eric Wang" },
    { "id": "m_123", "type": 1, "name": "牧馬影視製作" }
  ],
  "profile": { "name": "Eric Wang", "mobile": null, "pic": "..." },
  "workspaces": [
    { "id": "ws_personal_m_001", "kind": "personal", "name": "Eric Wang（個人）" },
    { "id": "ws_team_aa", "kind": "team", "name": "牧馬影視製作" }
  ],
  "activeWorkspaceId": "ws_personal_m_001",
  "workspaceMemberships": [
    { "workspaceId": "ws_personal_m_001", "role": "owner" },
    { "workspaceId": "ws_team_aa", "role": "member" }
  ],
  "company": null
}
```

### 7.2 切換工作區（預設個人；下拉切換團隊）

`POST /dashboard-auth/active-workspace`

Request：

```json
{ "workspaceId": "ws_team_aa" }
```

Response：同 `/me`（切換後的結果）。

### 7.3 使用者主動「重新同步」（PaPiin → Dashboard）

`POST /dashboard-profile/resync`

- 目的：使用者在 PaPiin 更新後，手動同步 Dashboard 顯示值（見 4.0.1）。
- 行為：以 PaPiin 最新值覆寫「可同步欄位」，不影響 Dashboard 自管欄位。
 - 驗收：成功後回傳同步後的 `profile/company`（或回傳同 `/dashboard-auth/me` 結構），前端可直接刷新畫面。

### 7.4 Dashboard 自管的個人/團隊擴充資料

> 由於 PaPiin 缺少國籍、地址、金融資訊等欄位，Dashboard 需提供自有保存端點（或由後端統一提供）。

- `GET /dashboard-profile/personal`
- `PUT /dashboard-profile/personal`
- `GET /dashboard-profile/payout`
- `PUT /dashboard-profile/payout`

---

## 8. 子網域、Cookie 與安全性要求（必須明確）

### 8.1 Cookie / Session

- Dashboard 與 PaPiin 若位於同一頂網域的不同子網域，必須明確：
  - Cookie `Domain`（例如 `.papiin.com`）
  - `Secure=true`（HTTPS）
  - `SameSite` 策略（需符合導轉與 API 呼叫情境）

#### 8.1.1 必測情境（建議寫入驗收）

- 從 `dashboard.papiin.com` 未登入導到 PaPiin 登入後可成功回跳，且 Dashboard API 可帶上 session。
- Safari/Chrome/Firefox 在 `SameSite=None; Secure` 下可正常跨子網域帶 cookie（含 XHR/fetch `credentials: include`）。
- session 過期時呼叫 `/dashboard-auth/me`：
  - 回 401 → 前端導回 PaPiin 登入（需保留 `returnUrl`）。
- CORS（若 API 不同子網域）：必須允許 `credentials` 與正確的 `Access-Control-Allow-Origin`（不可用 `*`）。

### 8.2 導轉安全（returnUrl / state）

- `returnUrl` 必須 allowlist（只允許 `dashboard.papiin.com` 範圍）
- `state` 必須可驗證、可過期（避免 open redirect / CSRF）

---

## 9. 驗收條件（Acceptance Criteria）

- 使用者已登入 PaPiin 時，進入 Dashboard 會自動帶入：
  - 個人基本資料（PaPiin 有的欄位）
  - 團隊資料（若 activeMember.type=1，依對應表取值；type=6 品牌方不進入團隊工作區）
- 使用者未登入 PaPiin 時，進入 Dashboard 會導至 PaPiin 登入並可回跳。
- 若 activeMember.type=-2，Dashboard 可進站瀏覽，但觸發「可操作」功能時必須導回 PaPiin 完成/略過流程。
- Dashboard 能在「個人資料/團隊資料」頁編輯並保存 PaPiin 沒有的欄位（國籍/地址/金融資訊等）。
- Dashboard 顯示銀行帳號時具備遮罩與必要的隱私保護。
- 同一使用者第二次（含以上）登入 Dashboard 時，已在 Dashboard 編輯過並保存的個人/團隊欄位 **不得被 PaPiin 值覆寫**。
- 僅當 Dashboard 欄位仍為空值（未建立/未填寫）時，允許從 PaPiin **補齊帶入**（不得覆寫已編輯欄位）。

---

## 10. 工作區模型（Dashboard Workspace Model）

> 目的：支援「1 個個人工作區 + 多個團隊工作區」，並讓製作公司/創作團隊專區（成員清單/權限/彙整報表）可由 Dashboard 獨立治理。

### 10.1 個人工作區（Personal Workspace）

- 每個使用者永遠有且只有 **1 個**個人工作區。
- 用途：
  - 查看自己的專案
  - 上傳/送出勞報單、報帳
  - 編輯個人日程與個人資料（含 Dashboard 自管欄位）

### 10.2 團隊工作區（Team Workspace）

- 使用者可以加入 **多個**團隊工作區（N 個）。
- 定位：**製作公司 / 創作團隊專區**（對齊 PaPiin 的創作團隊概念）。
- 用途（負責人/管理者）：
  - 查閱團隊底下所有專案狀態
  - 彙整報帳/勞報單/年度預算等
  - 編輯團隊資訊與權限設定、成員清單

### 10.3 PaPiin 與 Dashboard 的對應與同步策略

- PaPiin 來源團隊（seed/sync）：
  - **創作團隊（type=1）**：可用 `members.tax_id_number` 與 `members.name` 作為 seed
- Dashboard 自建團隊工作區：
  - 允許團隊工作區 **沒有統編**
  - 是否同步/回寫至 PaPiin：需另外決策（本 PRD 僅規範 Dashboard 可獨立運作）

### 10.4 權限來源優先序

- 權限以 Dashboard 的 `workspaceMemberships` / RBAC 設定為準。
- PaPiin 僅作 seed/同步來源，不應覆寫 Dashboard 的團隊工作區權限設定（除非明確定義同步規則）。

### 10.5 Dashboard RBAC 最小角色

> 目的：讓前後端對「誰能進入/誰能管理團隊」有一致的驗收基準。

建議最小角色（team workspace）：

- **owner**：可管理所有設定與成員（包含高權限操作）。
- **admin**：可邀請/移除成員、調整角色、編輯團隊資料、查看彙整報表。
- **member**：可進入團隊、查看團隊資料（視產品）、提交與自己相關的資料。
- **viewer**：只讀（可查看但不可提交/編輯）。

> 註：實際落地可用 `permissions[]` 明列，或以 `role` 對應固定權限集合；兩者擇一，但需在後端與前端一致。

