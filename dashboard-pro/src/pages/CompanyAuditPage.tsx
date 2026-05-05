import { useEffect, useMemo, useState } from "react";

type AuditTargetType =
  | "company"
  | "company_member"
  | "company_role"
  | "export_job"
  | "project"
  | "payment_request"
  | "attachment";

type AuditAction =
  | "company.update_profile"
  | "company.members.invite"
  | "company.members.remove"
  | "company.members.change_role"
  | "company.export"
  | "company.projects.create"
  | "expenses.attachment.download"
  | "audit.export";

type AuditLog = {
  audit_log_id: string;
  actor_name: string;
  actor_role: string;
  action: AuditAction;
  target_type: AuditTargetType;
  target_id: string;
  before_value?: string;
  after_value?: string;
  reason?: string;
  ip_address?: string;
  created_at: string;
};

const STORAGE_KEY = "company-audit-logs-v1";

function maskIp(ip?: string) {
  if (!ip) return "—";
  const parts = ip.split(".");
  if (parts.length !== 4) return "—";
  return `${parts[0]}.${parts[1]}.***.***`;
}

function maskEmail(email: string) {
  const [u, d] = email.split("@");
  if (!u || !d) return email;
  const head = u.slice(0, 2);
  return `${head}***@${d}`;
}

const defaultLogs: AuditLog[] = [
  {
    audit_log_id: "al_0001",
    actor_name: "Patrick Lin",
    actor_role: "Company Owner",
    action: "company.update_profile",
    target_type: "company",
    target_id: "company-a",
    before_value: "地址：台北市信義區松高路 1 號",
    after_value: "地址：台北市信義區松高路 1 號（10F）",
    ip_address: "203.0.113.42",
    created_at: "2026/05/05 21:10"
  },
  {
    audit_log_id: "al_0002",
    actor_name: "Jenny Chen",
    actor_role: "Company Admin",
    action: "company.members.invite",
    target_type: "company_member",
    target_id: "u4",
    after_value: `邀請：${maskEmail("chloe@example.com")}`,
    reason: "新增出納協作",
    ip_address: "203.0.113.42",
    created_at: "2026/05/05 21:20"
  },
  {
    audit_log_id: "al_0003",
    actor_name: "Patrick Lin",
    actor_role: "Company Owner",
    action: "company.members.change_role",
    target_type: "company_role",
    target_id: "u3",
    before_value: "Eric Wang：Company Member",
    after_value: "Eric Wang：Company Admin",
    reason: "臨時授權協助管理成員",
    ip_address: "203.0.113.42",
    created_at: "2026/05/05 21:33"
  },
  {
    audit_log_id: "al_0004",
    actor_name: "Jenny Chen",
    actor_role: "Company Admin",
    action: "company.export",
    target_type: "export_job",
    target_id: "exp_9a1d",
    after_value: "匯出：報帳總表（篩選：2026/05, 狀態=出納審核中）",
    reason: "月結對帳",
    ip_address: "203.0.113.42",
    created_at: "2026/05/05 21:45"
  },
  {
    audit_log_id: "al_0005",
    actor_name: "Stella Wu",
    actor_role: "Company Member",
    action: "expenses.attachment.download",
    target_type: "attachment",
    target_id: "att_0012",
    after_value: "下載附件：MMA#00003_發票.jpg（已遮罩/需授權）",
    ip_address: "203.0.113.99",
    created_at: "2026/05/05 22:02"
  },
  {
    audit_log_id: "al_0006",
    actor_name: "Patrick Lin",
    actor_role: "Company Owner",
    action: "audit.export",
    target_type: "export_job",
    target_id: "audit_31f0",
    after_value: "匯出：Company Audit Logs（篩選：近 7 天）",
    reason: "外部稽核準備",
    ip_address: "203.0.113.42",
    created_at: "2026/05/05 22:20"
  }
];

function loadLogs(): AuditLog[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultLogs;
    const parsed = JSON.parse(raw) as AuditLog[];
    return Array.isArray(parsed) && parsed.length ? parsed : defaultLogs;
  } catch {
    return defaultLogs;
  }
}

function actionLabel(a: AuditAction) {
  if (a === "company.update_profile") return "公司資料修改";
  if (a === "company.members.invite") return "邀請成員";
  if (a === "company.members.remove") return "移除成員";
  if (a === "company.members.change_role") return "角色調整";
  if (a === "company.export") return "匯出報表";
  if (a === "company.projects.create") return "建立專案";
  if (a === "expenses.attachment.download") return "下載附件";
  return "匯出稽核";
}

function actionBadge(a: AuditAction) {
  if (a.includes("export")) return "badge badge-blue";
  if (a.includes("members")) return "badge badge-purple";
  if (a.includes("update")) return "badge badge-amber";
  return "badge badge-gray";
}

export function CompanyAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>(() => loadLogs());
  const [keyword, setKeyword] = useState("");
  const [actionFilter, setActionFilter] = useState<AuditAction | "all">("all");

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  }, [logs]);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return logs
      .filter((l) => (actionFilter === "all" ? true : l.action === actionFilter))
      .filter((l) => {
        if (!k) return true;
        return (
          l.audit_log_id.toLowerCase().includes(k) ||
          l.actor_name.toLowerCase().includes(k) ||
          l.actor_role.toLowerCase().includes(k) ||
          l.action.toLowerCase().includes(k) ||
          (l.reason ?? "").toLowerCase().includes(k) ||
          (l.before_value ?? "").toLowerCase().includes(k) ||
          (l.after_value ?? "").toLowerCase().includes(k)
        );
      });
  }, [actionFilter, keyword, logs]);

  return (
    <section className="po-page">
      <div className="po-topbar">
        <span className="po-breadcrumb">公司工作區</span>
        <span className="po-sep">/</span>
        <span className="po-title">公司稽核紀錄</span>
      </div>

      <div className="po-content">
        <article className="po-sec">
          <div className="po-sec-head">
            <span className="po-sec-title">Audit Log（Demo）</span>
            <span className="po-sec-sub">示意：append-only、敏感欄位遮罩、匯出需記錄操作者/時間/篩選條件</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select className="bi" value={actionFilter} onChange={(e) => setActionFilter(e.target.value as any)}>
                <option value="all">全部事件</option>
                <option value="company.update_profile">公司資料修改</option>
                <option value="company.members.invite">邀請成員</option>
                <option value="company.members.change_role">角色調整</option>
                <option value="company.export">匯出報表</option>
                <option value="expenses.attachment.download">下載附件</option>
                <option value="audit.export">匯出稽核</option>
              </select>
              <input
                className="bi"
                placeholder="搜尋：人員 / action / reason / before / after"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                style={{ width: 240 }}
              />
              <button className="po-btn po-btn-ghost" onClick={() => setLogs(defaultLogs)}>
                重置 Demo
              </button>
            </div>
          </div>
          <div className="po-sec-body">
            <table className="po-table">
              <thead>
                <tr>
                  <th>時間</th>
                  <th>事件</th>
                  <th>操作者</th>
                  <th>角色</th>
                  <th>Target</th>
                  <th>變更</th>
                  <th>原因</th>
                  <th>IP（遮罩）</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.audit_log_id}>
                    <td>{l.created_at}</td>
                    <td>
                      <span className={actionBadge(l.action)}>{actionLabel(l.action)}</span>
                    </td>
                    <td>{l.actor_name}</td>
                    <td style={{ color: "#888" }}>{l.actor_role}</td>
                    <td style={{ color: "#888" }}>
                      {l.target_type}:{l.target_id}
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {l.before_value ? <span style={{ color: "#888" }}>Before：{l.before_value}</span> : null}
                        {l.after_value ? <span>After：{l.after_value}</span> : null}
                      </div>
                    </td>
                    <td style={{ color: "#888" }}>{l.reason ?? "—"}</td>
                    <td className="po-mono" style={{ color: "#888" }}>
                      {maskIp(l.ip_address)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!filtered.length ? (
              <div style={{ fontSize: 11, color: "#888", textAlign: "center", padding: 18 }}>
                沒有符合的稽核紀錄
              </div>
            ) : null}
          </div>
        </article>
      </div>
    </section>
  );
}

