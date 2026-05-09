import { useEffect, useMemo, useState } from "react";

type CompanyRole = "owner" | "admin" | "member";

type PermissionRow = {
  perm: string;
  owner: boolean;
  admin: boolean;
  member: boolean;
  note?: string;
};

const roleLabel: Record<CompanyRole, string> = {
  owner: "Company Owner（公司負責人）",
  admin: "Company Admin（公司管理員）",
  member: "Company Member（公司成員）"
};

const companyPermissionRows: PermissionRow[] = [
  {
    perm: "進入公司工作區",
    owner: true,
    admin: true,
    member: true,
    note: "需為公司成員；非公司成員不可進入。"
  },
  {
    perm: "預設可見公司所有專案",
    owner: true,
    admin: true,
    member: false,
    note: "Owner/Admin 預設可見所有專案；Member 需綁定專案角色才可見特定專案。"
  },
  {
    perm: "公司基本資料（查看）",
    owner: true,
    admin: true,
    member: true,
    note: "可見範圍可由公司政策調整。"
  },
  {
    perm: "公司基本資料（編輯）",
    owner: true,
    admin: true,
    member: false,
    note: "高風險操作，需記錄 Audit Log。"
  },
  {
    perm: "公司成員管理（邀請/移除）",
    owner: true,
    admin: true,
    member: false,
    note: "角色/成員異動需記錄 Audit Log。"
  },
  {
    perm: "公司角色指派（Owner/Admin/Member）",
    owner: true,
    admin: true,
    member: false,
    note: "Owner/Admin 可依公司政策限制。"
  },
  {
    perm: "公司層稽核（Audit Log / 匯出紀錄）查看",
    owner: true,
    admin: true,
    member: false,
    note: "敏感欄位需遮罩；匯出需記錄操作者與時間。"
  },
  {
    perm: "公司層稽核（匯出）",
    owner: true,
    admin: true,
    member: false,
    note: "屬高風險操作；需雙層授權檢查（公司層 + 專案層）。"
  }
];

type ProjectRole = "專案管理人" | "製片" | "出納" | "一般成員" | "收支審核";

type CompanyProjectMatrixRow = {
  companyRole: CompanyRole;
  projectRoles: Record<ProjectRole, string>;
};

const companyProjectMatrix: CompanyProjectMatrixRow[] = [
  {
    companyRole: "owner",
    projectRoles: {
      專案管理人: "可指派",
      製片: "可指派",
      出納: "可指派",
      一般成員: "可指派",
      收支審核: "可指派"
    }
  },
  {
    companyRole: "admin",
    projectRoles: {
      專案管理人: "可指派（依公司政策）",
      製片: "可指派",
      出納: "可指派",
      一般成員: "可指派",
      收支審核: "可指派"
    }
  },
  {
    companyRole: "member",
    projectRoles: {
      專案管理人: "可被授權為專案角色",
      製片: "可被授權為專案角色",
      出納: "可被授權為專案角色",
      一般成員: "可被授權為專案角色",
      收支審核: "可被授權為專案角色"
    }
  }
];

type CompanyMember = {
  id: string;
  name: string;
  email: string;
  role: CompanyRole;
  status: "active" | "disabled";
};

const MEMBERS_STORAGE_KEY = "company-members-v1";

const defaultMembers: CompanyMember[] = [
  { id: "u1", name: "Patrick Lin", email: "patrick@muyma.com", role: "owner", status: "active" },
  { id: "u2", name: "Jenny Chen", email: "jenny@muyma.com", role: "admin", status: "active" },
  { id: "u3", name: "Eric Wang", email: "eric@muyma.com", role: "member", status: "active" }
];

function loadMembers(): CompanyMember[] {
  try {
    const raw = window.localStorage.getItem(MEMBERS_STORAGE_KEY);
    if (!raw) return defaultMembers;
    const parsed = JSON.parse(raw) as CompanyMember[];
    return Array.isArray(parsed) && parsed.length ? parsed : defaultMembers;
  } catch {
    return defaultMembers;
  }
}

export function CompanyMembersPage() {
  const [currentRole, setCurrentRole] = useState<CompanyRole>("owner");
  const canManageMembers = useMemo(() => currentRole === "owner" || currentRole === "admin", [currentRole]);

  const [members, setMembers] = useState<CompanyMember[]>(() => loadMembers());
  const [invite, setInvite] = useState({ name: "", email: "", role: "member" as CompanyRole });
  const [inviteError, setInviteError] = useState("");

  useEffect(() => {
    window.localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(members));
  }, [members]);

  return (
    <section className="po-page">
      <div className="po-topbar">
        <span className="po-breadcrumb">公司工作區</span>
        <span className="po-sep">/</span>
        <span className="po-title">公司成員管理</span>
      </div>

      <div className="po-content">
        <article className="po-sec">
          <div className="po-sec-head">
            <span className="po-sec-title">成員清單</span>
            <span className="po-sec-sub">預設：Company Owner / Admin 可新增與管理成員</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, color: "#888" }}>Mock 目前角色：</span>
              <button
                className={currentRole === "owner" ? "po-btn" : "po-btn po-btn-ghost"}
                onClick={() => setCurrentRole("owner")}
              >
                Owner
              </button>
              <button
                className={currentRole === "admin" ? "po-btn" : "po-btn po-btn-ghost"}
                onClick={() => setCurrentRole("admin")}
              >
                Admin
              </button>
              <button
                className={currentRole === "member" ? "po-btn" : "po-btn po-btn-ghost"}
                onClick={() => setCurrentRole("member")}
              >
                Member
              </button>
            </div>
          </div>
          <div className="po-sec-body">
            {canManageMembers ? (
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.6fr 1fr auto", gap: 8, marginBottom: 10 }}>
                <input
                  className="bi"
                  placeholder="姓名"
                  value={invite.name}
                  onChange={(e) => setInvite((v) => ({ ...v, name: e.target.value }))}
                />
                <input
                  className="bi"
                  placeholder="Email"
                  value={invite.email}
                  onChange={(e) => setInvite((v) => ({ ...v, email: e.target.value }))}
                />
                <select
                  className="bi"
                  value={invite.role}
                  onChange={(e) => setInvite((v) => ({ ...v, role: e.target.value as CompanyRole }))}
                >
                  <option value="member">Company Member</option>
                  <option value="admin">Company Admin</option>
                  <option value="owner">Company Owner</option>
                </select>
                <button
                  className="po-btn"
                  onClick={() => {
                    setInviteError("");
                    const name = invite.name.trim();
                    const email = invite.email.trim().toLowerCase();
                    if (!name) return setInviteError("請輸入姓名");
                    if (!email || !email.includes("@")) return setInviteError("請輸入正確 Email");
                    if (members.some((m) => m.email.toLowerCase() === email)) return setInviteError("此 Email 已存在");
                    setMembers((m) => [
                      ...m,
                      { id: `u${m.length + 1}`, name, email, role: invite.role, status: "active" }
                    ]);
                    setInvite({ name: "", email: "", role: "member" });
                  }}
                >
                  新增成員
                </button>
              </div>
            ) : (
              <div style={{ fontSize: 10, color: "#888", marginBottom: 10 }}>
                你目前角色為 {roleLabel[currentRole]}，沒有新增/管理成員權限。
              </div>
            )}
            {inviteError ? <div className="po-error" style={{ marginBottom: 10 }}>{inviteError}</div> : null}

            <table className="po-table">
              <thead>
                <tr>
                  <th>姓名</th>
                  <th>Email</th>
                  <th>公司角色</th>
                  <th>狀態</th>
                  {canManageMembers ? <th /> : null}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>{m.email}</td>
                    <td>{roleLabel[m.role]}</td>
                    <td>{m.status === "active" ? "啟用" : "停權"}</td>
                    {canManageMembers ? (
                      <td>
                        <button
                          className="po-btn po-btn-ghost"
                          onClick={() => setMembers((list) => list.filter((x) => x.id !== m.id))}
                        >
                          移除
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="po-sec">
          <div className="po-sec-head">
            <span className="po-sec-title">公司角色與權限（Company Layer）</span>
            <span className="po-sec-sub">治理規則（可 review）</span>
          </div>
          <div className="po-sec-body">
            <table className="po-table">
              <thead>
                <tr>
                  <th>權限</th>
                  <th>{roleLabel.owner}</th>
                  <th>{roleLabel.admin}</th>
                  <th>{roleLabel.member}</th>
                  <th>備註</th>
                </tr>
              </thead>
              <tbody>
                {companyPermissionRows.map((r) => (
                  <tr key={r.perm}>
                    <td>{r.perm}</td>
                    <td>{r.owner ? "✓" : "—"}</td>
                    <td>{r.admin ? "✓" : "—"}</td>
                    <td>{r.member ? "✓" : "—"}</td>
                    <td style={{ color: "#888" }}>{r.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: 14, fontSize: 10, color: "#888" }}>
              補充：具備公司層角色不代表自動擁有所有專案資料權限；敏感操作（權限調整、匯出、取消）需同時通過公司層與專案層授權檢查。
            </div>
          </div>
        </article>

        <article className="po-sec">
          <div className="po-sec-head">
            <span className="po-sec-title">公司層 × 專案層（簡版矩陣）</span>
            <span className="po-sec-sub">Owner/Admin/Member vs Project roles</span>
          </div>
          <div className="po-sec-body">
            <table className="po-table">
              <thead>
                <tr>
                  <th>公司層角色</th>
                  <th>專案管理人</th>
                  <th>製片</th>
                  <th>出納</th>
                  <th>一般成員</th>
                  <th>收支審核</th>
                </tr>
              </thead>
              <tbody>
                {companyProjectMatrix.map((row) => (
                  <tr key={row.companyRole}>
                    <td>{roleLabel[row.companyRole]}</td>
                    <td>{row.projectRoles["專案管理人"]}</td>
                    <td>{row.projectRoles["製片"]}</td>
                    <td>{row.projectRoles["出納"]}</td>
                    <td>{row.projectRoles["一般成員"]}</td>
                    <td>{row.projectRoles["收支審核"]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
}

