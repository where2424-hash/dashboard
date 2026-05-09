import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ExpenseOverviewFlow } from "../components/ExpenseOverviewFlow";
import { REQUEST_STATUS_LABEL, expenseListBadgeClass } from "../expenseStatus";
import { listRequests } from "../mockApi";
import type { ExpenseRequest, RequestStatus, Role } from "../types";

function formatExpenseDate(iso?: string): string {
  if (!iso?.trim()) return "—";
  return iso.replace(/-/g, "/");
}

type TabKey = "all" | "mine" | "todo" | "draft";

const TAB_LABEL: Record<TabKey, string> = {
  all: "全部申請",
  mine: "我的申請",
  todo: "待我審核",
  draft: "草稿"
};

const CURRENT_USER_NAME = "Eric Wang";

function roleTodoStatuses(role: Role): RequestStatus[] {
  if (role === "producer" || role === "admin") return ["producer_review"];
  if (role === "treasury") return ["treasury_review", "awaiting_physical_receipts", "payment_pending"];
  return [];
}

function toCsvCell(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, "\"\"")}"` : s;
}

function receiptTypeLabel(t: ExpenseRequest["receiptType"]): string {
  return t === "invoice" ? "發票" : "收據";
}

function yyyymmFromIso(iso?: string): string {
  if (!iso?.trim()) return "";
  // Expect YYYY-MM-DD
  const m = iso.match(/^(\d{4})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}` : "";
}

type PaymentRequestSummary = {
  id: string; // representative row id for navigation
  paymentRequestNo: string;
  project: string;
  applicant: string;
  appliedAt: string; // YYYY-MM-DD (from updatedAt)
  totalAmount: number;
  status: RequestStatus;
  anyReceiptType: ExpenseRequest["receiptType"];
};

function appliedDateFromUpdatedAt(updatedAt: string): string {
  if (!updatedAt?.trim()) return "";
  // mockApi uses "YYYY-MM-DD HH:mm"
  const m = updatedAt.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : updatedAt.slice(0, 10);
}

export function ExpensesPage({ role }: { role: Role }) {
  const nav = useNavigate();
  const [rows, setRows] = useState<ExpenseRequest[]>([]);
  const [keyword, setKeyword] = useState("");
  const [tab, setTab] = useState<TabKey>("todo");
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "">("");
  // (v5) list is payment-request summaries; per-item preview moved to detail page

  async function reload() {
    setRows(await listRequests());
  }

  useEffect(() => {
    void reload();
  }, []);

  const paymentRequests = useMemo((): PaymentRequestSummary[] => {
    const byNo = new Map<string, PaymentRequestSummary>();
    for (const r of rows) {
      const key = r.paymentRequestNo;
      const prev = byNo.get(key);
      if (!prev) {
        byNo.set(key, {
          id: r.id,
          paymentRequestNo: r.paymentRequestNo,
          project: r.project,
          applicant: r.applicant,
          appliedAt: appliedDateFromUpdatedAt(r.updatedAt),
          totalAmount: r.totalAmount,
          status: r.status,
          anyReceiptType: r.receiptType
        });
      } else {
        prev.totalAmount += r.totalAmount;
        // pick latest updatedAt row as representative for status/date/id (simple)
        if (r.updatedAt > prev.appliedAt) {
          prev.id = r.id;
          prev.status = r.status;
          prev.appliedAt = appliedDateFromUpdatedAt(r.updatedAt);
          prev.project = r.project;
          prev.applicant = r.applicant;
          prev.anyReceiptType = r.receiptType;
        }
      }
    }
    return Array.from(byNo.values()).sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
  }, [rows]);

  const byTab = useMemo(() => {
    const todoSet = new Set(roleTodoStatuses(role));
    return paymentRequests.filter((r) => {
      if (tab === "all") return true;
      if (tab === "mine") return r.applicant === CURRENT_USER_NAME;
      if (tab === "draft") return r.status === "draft";
      if (tab === "todo") return todoSet.has(r.status);
      return true;
    });
  }, [paymentRequests, role, tab]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    const base = byTab;
    const withStatus = statusFilter ? base.filter((r) => r.status === statusFilter) : base;
    if (!q) return withStatus;
    return withStatus.filter((r) => {
      const blob = [
        r.paymentRequestNo,
        r.project,
        r.applicant,
        r.appliedAt,
        REQUEST_STATUS_LABEL[r.status],
      ]
        .join("|")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [byTab, keyword, statusFilter]);

  const tabCounts = useMemo(() => {
    const todoSet = new Set(roleTodoStatuses(role));
    const all = paymentRequests.length;
    const mine = paymentRequests.filter((r) => r.applicant === CURRENT_USER_NAME).length;
    const todo = paymentRequests.filter((r) => todoSet.has(r.status)).length;
    const draft = paymentRequests.filter((r) => r.status === "draft").length;
    return { all, mine, todo, draft };
  }, [paymentRequests, role]);

  const statsCards = useMemo(() => {
    const now = new Date();
    const yymm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const thisMonth = paymentRequests.filter((r) => yyyymmFromIso(r.appliedAt) === yymm);

    const monthTotal = thisMonth.reduce((s, r) => s + (r.totalAmount || 0), 0);
    const monthCount = thisMonth.length;

    const reviewingCount = paymentRequests.filter((r) => r.status === "producer_review" || r.status === "treasury_review").length;
    const awaitingCount = paymentRequests.filter((r) => r.status === "awaiting_physical_receipts").length;
    const closedCount = paymentRequests.filter((r) => r.status === "closed").length;

    return { yymm, monthTotal, monthCount, reviewingCount, awaitingCount, closedCount };
  }, [paymentRequests]);

  function exportCsv() {
    const header = [
      "請款單編號",
      "專案名稱",
      "申請日期",
      "請款人",
      "申請總額",
      "狀態",
      "最後更新"
    ].join(",");
    const lines = filtered.map((r) =>
      [
        r.paymentRequestNo,
        r.project,
        formatExpenseDate(r.appliedAt),
        r.applicant,
        `NT$ ${r.totalAmount.toLocaleString()}`,
        REQUEST_STATUS_LABEL[r.status],
        r.appliedAt
      ]
        .map(toCsvCell)
        .join(",")
    );
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expense_overview_${tab}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="exp-ov">
      <header className="exp-ov-head">
        <div className="exp-ov-head-text">
          <h2 className="exp-ov-title">報帳總表</h2>
          <p className="exp-ov-sub">
            依 PRD v5：列表新增型態、總額/銷售額/稅額；點列進入明細。
          </p>
        </div>
        <div className="exp-ov-head-actions">
          <Link to="/expenses/new" className="exp-ov-tb-btn exp-ov-tb-btn--secondary">
            批次／新增
          </Link>
          <Link to="/expenses/new" className="exp-ov-tb-btn exp-ov-tb-btn--primary">
            ＋ 新增報帳申請
          </Link>
        </div>
      </header>

      <div className="exp-stats" aria-label="報帳總表摘要">
        <div className="exp-stat exp-stat--blue">
          <div className="exp-stat__label">本月申請總額</div>
          <div className="exp-stat__value">{statsCards.monthTotal.toLocaleString()}</div>
          <div className="exp-stat__sub">
            NT$ · 共 {statsCards.monthCount} 筆（{statsCards.yymm}）
          </div>
        </div>
        <div className="exp-stat exp-stat--orange">
          <div className="exp-stat__label">審核中</div>
          <div className="exp-stat__value">{statsCards.reviewingCount}</div>
          <div className="exp-stat__sub">等待核准</div>
        </div>
        <div className="exp-stat exp-stat--purple">
          <div className="exp-stat__label">等待實體單據</div>
          <div className="exp-stat__value">{statsCards.awaitingCount}</div>
          <div className="exp-stat__sub">請儘速提交</div>
        </div>
        <div className="exp-stat exp-stat--green">
          <div className="exp-stat__label">已結案</div>
          <div className="exp-stat__value">{statsCards.closedCount}</div>
          <div className="exp-stat__sub">本月完成</div>
        </div>
      </div>

      <ExpenseOverviewFlow />

      <div className="exp-ov-tabrow" role="tablist" aria-label="報帳總表分頁">
        <button
          type="button"
          className={`exp-ov-tabitem${tab === "all" ? " exp-ov-tabitem--act" : ""}`}
          onClick={() => setTab("all")}
          role="tab"
          aria-selected={tab === "all"}
        >
          {TAB_LABEL.all} <span className="exp-ov-tabn">({tabCounts.all})</span>
        </button>
        <button
          type="button"
          className={`exp-ov-tabitem${tab === "mine" ? " exp-ov-tabitem--act" : ""}`}
          onClick={() => setTab("mine")}
          role="tab"
          aria-selected={tab === "mine"}
        >
          {TAB_LABEL.mine} <span className="exp-ov-tabn">({tabCounts.mine})</span>
        </button>
        <button
          type="button"
          className={`exp-ov-tabitem${tab === "todo" ? " exp-ov-tabitem--act" : ""}`}
          onClick={() => setTab("todo")}
          role="tab"
          aria-selected={tab === "todo"}
        >
          {TAB_LABEL.todo}{" "}
          <span className="exp-ov-tabn exp-ov-tabn--warn">({tabCounts.todo})</span>
        </button>
        <button
          type="button"
          className={`exp-ov-tabitem${tab === "draft" ? " exp-ov-tabitem--act" : ""}`}
          onClick={() => setTab("draft")}
          role="tab"
          aria-selected={tab === "draft"}
        >
          {TAB_LABEL.draft}{" "}
          <span className="exp-ov-tabn exp-ov-tabn--draft">({tabCounts.draft})</span>
        </button>
      </div>

      <div className="exp-ov-toolbar">
        <div className="exp-ov-search-box">
          <span className="exp-ov-search-ic" aria-hidden>
            🔍
          </span>
          <input
            type="search"
            placeholder="搜尋流水號、專案、請款人、發票、摘要…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            aria-label="搜尋報帳列表"
          />
        </div>
        <button
          type="button"
          className={`exp-ov-filter-btn${filterOpen ? " exp-ov-filter-btn--act" : ""}`}
          title="篩選"
          onClick={() => setFilterOpen((v) => !v)}
        >
          ⚙ 篩選
        </button>
        <button
          type="button"
          className="exp-ov-filter-btn"
          title="匯出（示意：CSV；PRD v4 需記錄操作人與時間）"
          onClick={exportCsv}
          disabled={filtered.length === 0}
        >
          📥 匯出
        </button>
      </div>

      {filterOpen ? (
        <div className="exp-ov-filter-panel">
          <div className="exp-ov-filter-row">
            <span className="exp-ov-filter-lbl">狀態</span>
            <select
              className="exp-ov-filter-sel"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RequestStatus | "")}
            >
              <option value="">全部</option>
              {Object.entries(REQUEST_STATUS_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="exp-ov-filter-clear"
              onClick={() => {
                setStatusFilter("");
                setKeyword("");
              }}
            >
              清除
            </button>
          </div>
          <div className="exp-ov-filter-note">提示：此處先提供基本篩選；進階條件與匯出稽核記錄將依 PRD v4 再串。</div>
        </div>
      ) : null}

      <div className="exp-ov-tbl-wrap">
        <div className="exp-ov-table-scroll">
          <table className="exp-ov-table">
            <thead>
              <tr>
                <th className="exp-ov-th-check">
                  <input type="checkbox" className="exp-ov-cb" aria-label="全選" disabled />
                </th>
                <th>請款單編號</th>
                <th>專案名稱</th>
                <th>申請日期</th>
                <th>請款人</th>
                <th>申請總額</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.paymentRequestNo}
                  className="exp-ov-row"
                  onClick={() => nav(`/expenses/${r.id}`)}
                  role="link"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      nav(`/expenses/${r.id}`);
                    }
                  }}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" className="exp-ov-cb" aria-label={`選取 ${r.paymentRequestNo}`} />
                  </td>
                  <td className="exp-ov-serial">{r.paymentRequestNo}</td>
                  <td>{r.project}</td>
                  <td>{formatExpenseDate(r.appliedAt)}</td>
                  <td>{r.applicant}</td>
                  <td className="exp-ov-amt">NT$ {r.totalAmount.toLocaleString()}</td>
                  <td>
                    <span className={expenseListBadgeClass(r.status)}>
                      ● {REQUEST_STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td className="exp-ov-actions" onClick={(e) => e.stopPropagation()}>
                    <Link to={`/expenses/${r.id}`} className="exp-ov-act exp-ov-act--view">
                      查看
                    </Link>
                    <Link to={`/expenses/${r.id}`} className="exp-ov-act exp-ov-act--edit">
                      編輯
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="exp-ov-foot">
          <span>
            共 {filtered.length} 筆
            {keyword.trim() ? `（搜尋結果／全檔 ${rows.length} 筆）` : ""}
          </span>
          <span className="exp-ov-foot-space" />
          <button type="button" className="exp-ov-pg exp-ov-pg--cur">
            1
          </button>
          <button type="button" className="exp-ov-pg" disabled title="示意分頁">
            2
          </button>
          <button type="button" className="exp-ov-pg" disabled title="示意分頁">
            ›
          </button>
        </div>
      </div>

    </section>
  );
}
