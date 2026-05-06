import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ExpenseOverviewFlow } from "../components/ExpenseOverviewFlow";
import { REQUEST_STATUS_LABEL, expenseListBadgeClass } from "../expenseStatus";
import { listRequests } from "../mockApi";
import type { ExpenseRequest } from "../types";

function formatExpenseDate(iso?: string): string {
  if (!iso?.trim()) return "—";
  return iso.replace(/-/g, "/");
}

export function ExpensesPage() {
  const nav = useNavigate();
  const [rows, setRows] = useState<ExpenseRequest[]>([]);
  const [keyword, setKeyword] = useState("");

  async function reload() {
    setRows(await listRequests());
  }

  useEffect(() => {
    void reload();
  }, []);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const blob = [
        r.requestNo,
        r.project,
        r.applicant,
        r.category,
        r.summary,
        r.invoiceNo ?? "",
        REQUEST_STATUS_LABEL[r.status],
        r.bankMasked ?? ""
      ]
        .join("|")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [rows, keyword]);

  return (
    <section className="exp-ov">
      <header className="exp-ov-head">
        <div className="exp-ov-head-text">
          <h2 className="exp-ov-title">報帳總表</h2>
          <p className="exp-ov-sub">依 PRD v4：列表顯示流水號、單據日期、遮罩帳戶與狀態；點列進入明細。</p>
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

      <ExpenseOverviewFlow />

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
        <button type="button" className="exp-ov-filter-btn" title="篩選（即將推出）" disabled>
          ⚙ 篩選
        </button>
        <button type="button" className="exp-ov-filter-btn" title="匯出需記錄操作人與時間（PRD v4）" disabled>
          📥 匯出 Excel
        </button>
      </div>

      <div className="exp-ov-tbl-wrap">
        <div className="exp-ov-table-scroll">
          <table className="exp-ov-table">
            <thead>
              <tr>
                <th className="exp-ov-th-check">
                  <input type="checkbox" className="exp-ov-cb" aria-label="全選" disabled />
                </th>
                <th>流水號</th>
                <th>專案名稱</th>
                <th>單據日期</th>
                <th>請款人</th>
                <th>發票編號</th>
                <th>金額</th>
                <th>分類</th>
                <th>摘要</th>
                <th>帳戶</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
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
                    <input type="checkbox" className="exp-ov-cb" aria-label={`選取 ${r.requestNo}`} />
                  </td>
                  <td className="exp-ov-serial">{r.requestNo}</td>
                  <td>{r.project}</td>
                  <td>{formatExpenseDate(r.expenseDate)}</td>
                  <td>{r.applicant}</td>
                  <td className="exp-ov-mono">{r.invoiceNo ?? "—"}</td>
                  <td className="exp-ov-amt">NT$ {r.amount.toLocaleString()}</td>
                  <td>
                    <span className="exp-ov-tag">{r.category}</span>
                  </td>
                  <td className="exp-ov-summary">{r.summary}</td>
                  <td className="exp-ov-bank">{r.bankMasked ?? "—"}</td>
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
