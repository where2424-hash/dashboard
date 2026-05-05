import { useEffect, useState } from "react";

type CompanyBasic = {
  name: string;
  taxId: string;
  owner: string;
  address: string;
  contact: string;
  status: "啟用" | "停用";
};

type MemberRole = "owner" | "admin" | "member";

type CompanyMember = {
  name: string;
  email: string;
  role: MemberRole;
};

type CompanyProject = {
  code: string;
  name: string;
  owner: string;
  status: "進行中" | "暫停" | "已結案";
};

type AuditRule = {
  id: string;
  label: string;
  enabled: boolean;
};

const STORAGE_KEY = "company-settings-v1";

type CompanySettingsState = {
  basic: CompanyBasic;
  members: CompanyMember[];
  projects: CompanyProject[];
  auditRules: AuditRule[];
};

const defaultState: CompanySettingsState = {
  basic: {
    name: "牧馬影視製作",
    taxId: "12345678",
    owner: "Patrick Lin",
    address: "台北市信義區松高路 1 號",
    contact: "02-1234-5678",
    status: "啟用"
  },
  members: [
    { name: "Patrick Lin", email: "patrick@muyma.com", role: "owner" },
    { name: "Jenny Chen", email: "jenny@muyma.com", role: "admin" },
    { name: "Eric Wang", email: "eric@muyma.com", role: "member" }
  ],
  projects: [
    { code: "MMA", name: "牧馬專案 A", owner: "Patrick Lin", status: "進行中" },
    { code: "MMB", name: "牧馬專案 B", owner: "Jenny Chen", status: "暫停" }
  ],
  auditRules: [
    { id: "audit-log", label: "記錄公司層 Audit Log（不可關閉）", enabled: true },
    { id: "permission-change", label: "權限變更需寫入 Audit Log", enabled: true },
    { id: "export-log", label: "匯出紀錄需記錄操作者與時間", enabled: true }
  ]
};

function loadState(): CompanySettingsState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) } as CompanySettingsState;
  } catch {
    return defaultState;
  }
}

export function CompanySettingsPage() {
  const [state, setState] = useState<CompanySettingsState>(() => loadState());
  const [editingBasic, setEditingBasic] = useState(false);
  const [basicDraft, setBasicDraft] = useState<CompanyBasic>(state.basic);
  const [editingMembers, setEditingMembers] = useState(false);
  const [editingProjects, setEditingProjects] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const roleLabel: Record<MemberRole, string> = {
    owner: "公司負責人",
    admin: "公司管理員",
    member: "公司成員"
  };

  return (
    <section className="po-page">
      <div className="po-topbar">
        <span className="po-breadcrumb">公司工作區</span>
        <span className="po-sep">/</span>
        <span className="po-title">公司設定</span>
      </div>

      <div className="po-content">
        {/* 區塊一：公司基本資料 */}
        <article className="po-sec">
          <div className="po-sec-head">
            <span className="po-sec-title">公司基本資料</span>
            <span className="po-sec-sub">統一編號、負責人、地址與聯絡資訊</span>
            <button
              className="po-btn po-btn-ghost"
              onClick={() => {
                if (editingBasic) {
                  setEditingBasic(false);
                  setBasicDraft(state.basic);
                } else {
                  setEditingBasic(true);
                  setBasicDraft(state.basic);
                }
              }}
            >
              {editingBasic ? "取消" : "編輯"}
            </button>
          </div>
          <div className="po-sec-body">
            <div className="po-info-grid">
              {editingBasic ? (
                <>
                  <div className="po-if">
                    <label>公司名稱</label>
                    <input
                      className="bi"
                      value={basicDraft.name}
                      onChange={(e) => setBasicDraft({ ...basicDraft, name: e.target.value })}
                    />
                  </div>
                  <div className="po-if">
                    <label>統一編號</label>
                    <input
                      className="bi"
                      value={basicDraft.taxId}
                      onChange={(e) => setBasicDraft({ ...basicDraft, taxId: e.target.value })}
                    />
                  </div>
                  <div className="po-if">
                    <label>負責人</label>
                    <input
                      className="bi"
                      value={basicDraft.owner}
                      onChange={(e) => setBasicDraft({ ...basicDraft, owner: e.target.value })}
                    />
                  </div>
                  <div className="po-if">
                    <label>公司狀態</label>
                    <select
                      className="bi"
                      value={basicDraft.status}
                      onChange={(e) =>
                        setBasicDraft({ ...basicDraft, status: e.target.value as CompanyBasic["status"] })
                      }
                    >
                      <option value="啟用">啟用</option>
                      <option value="停用">停用</option>
                    </select>
                  </div>
                  <div className="po-if">
                    <label>公司地址</label>
                    <input
                      className="bi"
                      value={basicDraft.address}
                      onChange={(e) => setBasicDraft({ ...basicDraft, address: e.target.value })}
                    />
                  </div>
                  <div className="po-if">
                    <label>聯絡資訊</label>
                    <input
                      className="bi"
                      value={basicDraft.contact}
                      onChange={(e) => setBasicDraft({ ...basicDraft, contact: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="po-if">
                    <label>公司名稱</label>
                    <div>{state.basic.name}</div>
                  </div>
                  <div className="po-if">
                    <label>統一編號</label>
                    <div className="po-mono">{state.basic.taxId}</div>
                  </div>
                  <div className="po-if">
                    <label>負責人</label>
                    <div>{state.basic.owner}</div>
                  </div>
                  <div className="po-if">
                    <label>公司狀態</label>
                    <div>{state.basic.status}</div>
                  </div>
                  <div className="po-if">
                    <label>公司地址</label>
                    <div>{state.basic.address}</div>
                  </div>
                  <div className="po-if">
                    <label>聯絡資訊</label>
                    <div>{state.basic.contact}</div>
                  </div>
                </>
              )}
            </div>
            {editingBasic ? (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10, gap: 8 }}>
                <button
                  className="po-btn po-btn-ghost"
                  onClick={() => {
                    setEditingBasic(false);
                    setBasicDraft(state.basic);
                  }}
                >
                  取消
                </button>
                <button
                  className="po-btn"
                  onClick={() => {
                    setState((s) => ({ ...s, basic: basicDraft }));
                    setEditingBasic(false);
                  }}
                >
                  儲存
                </button>
              </div>
            ) : null}
          </div>
        </article>

        {/* 區塊二：公司成員 / 角色 / 權限設定 */}
        <article className="po-sec">
          <div className="po-sec-head">
            <span className="po-sec-title">公司成員 / 角色 / 權限設定</span>
            <span className="po-sec-sub">Company Owner / Admin / Member</span>
            <button
              className="po-btn po-btn-ghost"
              onClick={() => setEditingMembers((v) => !v)}
            >
              {editingMembers ? "完成" : "編輯"}
            </button>
          </div>
          <div className="po-sec-body">
            <table className="po-table">
              <thead>
                <tr>
                  <th>成員</th>
                  <th>Email</th>
                  <th>公司角色</th>
                  {editingMembers ? <th /> : null}
                </tr>
              </thead>
              <tbody>
                {state.members.map((m, idx) => (
                  <tr key={m.email}>
                    <td>{m.name}</td>
                    <td>{m.email}</td>
                    <td>
                      {editingMembers ? (
                        <select
                          className="bi"
                          value={m.role}
                          onChange={(e) => {
                            const nextRole = e.target.value as MemberRole;
                            setState((s) => ({
                              ...s,
                              members: s.members.map((x, i) =>
                                i === idx ? { ...x, role: nextRole } : x
                              )
                            }));
                          }}
                        >
                          <option value="owner">公司負責人</option>
                          <option value="admin">公司管理員</option>
                          <option value="member">公司成員</option>
                        </select>
                      ) : (
                        roleLabel[m.role]
                      )}
                    </td>
                    {editingMembers ? (
                      <td>
                        <button
                          className="po-btn po-btn-ghost"
                          onClick={() =>
                            setState((s) => ({
                              ...s,
                              members: s.members.filter((x) => x.email !== m.email)
                            }))
                          }
                        >
                          移除
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
            {editingMembers ? (
              <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                <button
                  className="po-btn po-btn-ghost"
                  onClick={() =>
                    setState((s) => ({
                      ...s,
                      members: [
                        ...s.members,
                        {
                          name: "New Member",
                          email: `user${s.members.length + 1}@example.com`,
                          role: "member"
                        }
                      ]
                    }))
                  }
                >
                  ＋ 新增成員（Demo）
                </button>
              </div>
            ) : null}
          </div>
        </article>

        {/* 區塊三：公司專案 */}
        <article className="po-sec">
          <div className="po-sec-head">
            <span className="po-sec-title">公司專案</span>
            <span className="po-sec-sub">公司底下所有專案卡片（簡化版表格）</span>
            <button
              className="po-btn po-btn-ghost"
              onClick={() => setEditingProjects((v) => !v)}
            >
              {editingProjects ? "完成" : "編輯"}
            </button>
          </div>
          <div className="po-sec-body">
            <table className="po-table">
              <thead>
                <tr>
                  <th>專案簡碼</th>
                  <th>專案名稱</th>
                  <th>專案管理人</th>
                  <th>狀態</th>
                </tr>
              </thead>
              <tbody>
                {state.projects.map((p, idx) => (
                  <tr key={p.code}>
                    <td>{p.code}</td>
                    <td>{p.name}</td>
                    <td>
                      {editingProjects ? (
                        <input
                          className="bi"
                          value={p.owner}
                          onChange={(e) =>
                            setState((s) => ({
                              ...s,
                              projects: s.projects.map((x, i) =>
                                i === idx ? { ...x, owner: e.target.value } : x
                              )
                            }))
                          }
                        />
                      ) : (
                        p.owner
                      )}
                    </td>
                    <td>
                      {editingProjects ? (
                        <select
                          className="bi"
                          value={p.status}
                          onChange={(e) =>
                            setState((s) => ({
                              ...s,
                              projects: s.projects.map((x, i) =>
                                i === idx
                                  ? { ...x, status: e.target.value as CompanyProject["status"] }
                                  : x
                              )
                            }))
                          }
                        >
                          <option value="進行中">進行中</option>
                          <option value="暫停">暫停</option>
                          <option value="已結案">已結案</option>
                        </select>
                      ) : (
                        p.status
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {editingProjects ? (
              <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button
                  className="po-btn po-btn-ghost"
                  onClick={() =>
                    setState((s) => ({
                      ...s,
                      projects: [
                        ...s.projects,
                        {
                          code: `NEW${s.projects.length + 1}`,
                          name: "新專案",
                          owner: state.basic.owner,
                          status: "進行中"
                        }
                      ]
                    }))
                  }
                >
                  ＋ 建立新專案（Demo）
                </button>
              </div>
            ) : null}
          </div>
        </article>

        {/* 區塊四：公司安全與稽核 */}
        <article className="po-sec">
          <div className="po-sec-head">
            <span className="po-sec-title">公司安全與稽核</span>
            <span className="po-sec-sub">Audit Log、權限變更紀錄、匯出紀錄</span>
          </div>
          <div className="po-sec-body">
            <div className="po-table-block">
              <div className="po-row-head">
                <span>稽核規則（示意）</span>
              </div>
              <table className="po-table">
                <thead>
                  <tr>
                    <th>規則</th>
                    <th>啟用</th>
                  </tr>
                </thead>
                <tbody>
                  {state.auditRules.map((r, idx) => (
                    <tr key={r.id}>
                      <td>{r.label}</td>
                      <td>
                        <input
                          type="checkbox"
                          checked={r.enabled}
                          disabled={r.id === "audit-log"}
                          onChange={(e) =>
                            setState((s) => ({
                              ...s,
                              auditRules: s.auditRules.map((x, i) =>
                                i === idx ? { ...x, enabled: e.target.checked } : x
                              )
                            }))
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 10, color: "#555", marginTop: 8 }}>
              實作時，公司層 Audit Log 需符合 PRD 第 10.3 節：保存年限 7 年、append-only、敏感欄位遮罩與匯出保護。
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}

