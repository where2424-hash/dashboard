import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ExpenseFlowDiagramV4 } from "../components/ExpenseFlowDiagramV4";
import { APPLICATION_TYPE_LABEL, REQUEST_STATUS_LABEL, requestStatusBadgeClass } from "../expenseStatus";
import { getRequestById, updateStatus } from "../mockApi";
import type { ExpenseRequest, Role } from "../types";

const MOCK_AUDIT = [
  { at: "2026-05-05 09:30", action: "送出申請", actor: "系統" },
  { at: "2026-05-05 09:31", action: "進入製片審核", actor: "路由" }
];

export function RequestDetailPage({ role }: { role: Role }) {
  const { id } = useParams();
  const [row, setRow] = useState<ExpenseRequest | null | undefined>(undefined);

  useEffect(() => {
    if (!id) {
      setRow(null);
      return;
    }
    void (async () => {
      const data = await getRequestById(id);
      setRow(data ?? null);
    })();
  }, [id]);

  if (row === undefined) return <p className="rd-muted">載入中…</p>;
  if (!row) return <p>找不到此請款單。</p>;

  const canReject = role === "producer" || role === "treasury" || role === "admin";
  const canProducerReview =
    (role === "producer" || role === "admin") && row.status === "producer_review";
  const canCashierReview =
    (role === "treasury" || role === "admin") &&
    (row.status === "treasury_review" || row.status === "awaiting_physical_receipts" || row.status === "payment_pending");
  const typeLabel = row.applicationType ? APPLICATION_TYPE_LABEL[row.applicationType] : "—（送出後由製片選定）";

  return (
    <section className="request-detail">
      <nav className="rd-breadcrumb">
        <Link to="/expenses">報帳系統</Link>
        <span className="rd-breadcrumb__sep">／</span>
        <span>報帳明細</span>
      </nav>

      <header className="rd-header">
        <div>
          <h2 className="rd-title">報帳明細</h2>
          <p className="rd-sub">{row.requestNo}</p>
        </div>
        <div className="rd-header-actions">
          <span className={requestStatusBadgeClass(row.status)}>{REQUEST_STATUS_LABEL[row.status]}</span>
          {canProducerReview ? (
            <Link to={`/expenses/${row.id}/review`} className="rd-btn rd-btn--primary">
              製片審核
            </Link>
          ) : null}
          {canCashierReview ? (
            <Link to={`/expenses/${row.id}/cashier`} className="rd-btn rd-btn--primary">
              出納審核
            </Link>
          ) : null}
        </div>
      </header>

      <div className="rd-grid">
        <div className="rd-card">
          <h3 className="rd-card__title">請款資訊</h3>
          <dl className="rd-dl">
            <div className="rd-dl__row">
              <dt>專案</dt>
              <dd>{row.project}</dd>
            </div>
            <div className="rd-dl__row">
              <dt>申請人</dt>
              <dd>{row.applicant}</dd>
            </div>
            <div className="rd-dl__row">
              <dt>申請類型</dt>
              <dd>{typeLabel}</dd>
            </div>
            <div className="rd-dl__row">
              <dt>分類</dt>
              <dd>{row.category}</dd>
            </div>
            <div className="rd-dl__row">
              <dt>型態</dt>
              <dd>{row.receiptType === "invoice" ? "發票" : "收據"}</dd>
            </div>
            <div className="rd-dl__row">
              <dt>總額</dt>
              <dd className="rd-amount">NT$ {row.totalAmount.toLocaleString()}</dd>
            </div>
            <div className="rd-dl__row">
              <dt>銷售額</dt>
              <dd>NT$ {row.salesAmount.toLocaleString()}</dd>
            </div>
            <div className="rd-dl__row">
              <dt>稅額</dt>
              <dd>NT$ {row.taxAmount.toLocaleString()}</dd>
            </div>
            <div className="rd-dl__row">
              <dt>摘要</dt>
              <dd>{row.summary || "—"}</dd>
            </div>
            <div className="rd-dl__row">
              <dt>發票號碼</dt>
              <dd>{row.invoiceNo ?? "—"}</dd>
            </div>
            <div className="rd-dl__row">
              <dt>費用發生日期</dt>
              <dd>{row.expenseDate ?? "—"}</dd>
            </div>
            <div className="rd-dl__row">
              <dt>最後更新</dt>
              <dd>{row.updatedAt}</dd>
            </div>
          </dl>

          <div className="rd-placeholder-block">
            <h4 className="rd-placeholder-block__title">附件</h4>
            <p className="rd-muted">預留：收據影像／PDF 清單（串 API 後顯示）。</p>
          </div>
          <div className="rd-placeholder-block">
            <h4 className="rd-placeholder-block__title">收款帳戶</h4>
            {row.bankMasked ? (
              <p>{row.bankMasked}</p>
            ) : (
              <p className="rd-muted">預留：由個人資料帶入之帳戶末碼與確認狀態（PRD v4 遮罩顯示）。</p>
            )}
          </div>

          {canReject && row.status !== "rejected" && row.status !== "cancelled" && row.status !== "closed" ? (
            <div className="rd-actions">
              <button
                type="button"
                className="rd-btn rd-btn--danger"
                onClick={async () => {
                  await updateStatus(row.id, "rejected");
                  setRow({ ...row, status: "rejected" });
                }}
              >
                退件
              </button>
            </div>
          ) : null}
        </div>

        <div className="rd-card">
          <h3 className="rd-card__title">狀態歷程（示意）</h3>
          <ul className="rd-audit">
            {MOCK_AUDIT.map((e) => (
              <li key={e.at}>
                <span className="rd-audit__time">{e.at}</span>
                <span className="rd-audit__text">
                  {e.action} · {e.actor}
                </span>
              </li>
            ))}
          </ul>
          <p className="rd-muted rd-footnote">完整 Audit Log 依 PRD v4 串後端後替換此區塊。</p>
        </div>
      </div>

      <div className="rd-card rd-card--wide">
        <h3 className="rd-card__title">流程總表（PRD v4）</h3>
        <ExpenseFlowDiagramV4 applicationType={row.applicationType ?? "reimbursement"} currentStatus={row.status} />
      </div>
    </section>
  );
}
