import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { APPLICATION_TYPE_LABEL, REQUEST_STATUS_LABEL } from "../expenseStatus";
import { cashierConfirmDetails, cashierVerifyAndSchedulePayout, getRequestById, updateStatus } from "../mockApi";
import type { ExpenseRequest } from "../types";

function addDays(dateStr: string, days: number): string {
  const parts = dateStr.split("/").map((n) => parseInt(n, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return "";
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd}`;
}

export function CashierReviewPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [row, setRow] = useState<ExpenseRequest | null | undefined>(undefined);

  // UI states (mock)
  const [progOpen, setProgOpen] = useState(true);
  const [infoOpen, setInfoOpen] = useState(true);
  const [expOpen, setExpOpen] = useState(true);
  const [actionOpen, setActionOpen] = useState(true);

  const [step1Done, setStep1Done] = useState(false);
  const [step2Open, setStep2Open] = useState(false);
  const [notifyCount, setNotifyCount] = useState(0);

  const [duePreset, setDuePreset] = useState<"30" | "60" | "90" | "custom">("90");
  const [customDays, setCustomDays] = useState("");
  const [verifyDate, setVerifyDate] = useState("2026/04/29");

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignSel, setAssignSel] = useState("");

  const [result, setResult] = useState<
    | null
    | { kind: "awaiting"; notifyCount: number }
    | { kind: "scheduled"; verifyDate: string; payoutDate: string }
    | { kind: "rejected"; reason: string }
    | { kind: "assigned"; who: string }
  >(null);

  useEffect(() => {
    if (!id) {
      setRow(null);
      return;
    }
    void (async () => {
      const data = await getRequestById(id);
      setRow(data ?? null);
      if (data?.cashierNotifyCount) setNotifyCount(data.cashierNotifyCount);
      if (data?.cashierVerifiedAt) setVerifyDate(data.cashierVerifiedAt);
      // 初始步驟解鎖邏輯：若已進入待收實體單據，視作 step1 完成
      if (data?.status === "awaiting_physical_receipts" || data?.status === "payment_pending") {
        setStep1Done(true);
        setStep2Open(true);
      }
      // 若已排程待匯款，直接顯示結果摘要
      if (data?.status === "payment_pending" && data.payoutDate) {
        setResult({ kind: "scheduled", verifyDate: data.cashierVerifiedAt ?? verifyDate, payoutDate: data.payoutDate });
      }
    })();
  }, [id]);

  const days = useMemo(() => {
    if (duePreset === "custom") {
      const n = parseInt(customDays, 10);
      return Number.isFinite(n) && n > 0 ? n : 0;
    }
    return parseInt(duePreset, 10);
  }, [customDays, duePreset]);

  const payoutDate = useMemo(() => {
    if (!verifyDate || days <= 0) return "";
    return addDays(verifyDate, days);
  }, [days, verifyDate]);

  if (row === undefined) return <p className="rd-muted">載入中…</p>;
  if (!row) return <p>找不到此請款單。</p>;
  const cur = row;

  const typeLabel = cur.applicationType ? APPLICATION_TYPE_LABEL[cur.applicationType] : "—（待製片選定）";

  const canDoCashier =
    cur.status === "treasury_review" || cur.status === "awaiting_physical_receipts" || cur.status === "payment_pending";

  if (!canDoCashier) {
    return (
      <section className="csv-page">
        <p className="csv-warn">此請款單目前狀態為「{REQUEST_STATUS_LABEL[cur.status]}」，非出納審核流程可操作狀態。</p>
        <Link to={`/expenses/${cur.id}`} className="csv-backlink">
          回到報帳明細
        </Link>
      </section>
    );
  }

  async function doStep1Confirm() {
    if (notifyCount <= 0) return;
    await cashierConfirmDetails(cur.id, notifyCount);
    setStep1Done(true);
    setStep2Open(true);
    setResult({ kind: "awaiting", notifyCount });
  }

  async function doStep2Confirm() {
    if (!verifyDate || !payoutDate) return;
    await cashierVerifyAndSchedulePayout(cur.id, verifyDate, payoutDate);
    setResult({ kind: "scheduled", verifyDate, payoutDate });
  }

  async function doReject() {
    if (!rejectReason.trim()) return;
    await updateStatus(cur.id, "rejected");
    setResult({ kind: "rejected", reason: rejectReason.trim() });
  }

  return (
    <section className="csv-page">
      <header className="csv-topbar">
        <Link to="/expenses" className="csv-tb-back">
          <svg viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          報帳系統
        </Link>
        <span className="csv-tb-div">/</span>
        <span className="csv-tb-title">出納審核</span>
        <span className="csv-tb-spacer" />
        <span className="csv-inv-tag">{cur.paymentRequestNo}</span>
        <span className="csv-badge csv-badge--blue">{REQUEST_STATUS_LABEL[cur.status]}</span>
      </header>

      <div className="csv-content">
        {/* 進度條（簡化：固定顯示出納審核主線） */}
        <div className="csv-prog-wrap">
          <div className="csv-prog-head">
            <div className="csv-prog-lbl">
              目前進度：<b>出納審核中</b>　（製片已選定類型：{typeLabel}）
            </div>
            <button type="button" className="csv-col-btn" onClick={() => setProgOpen((v) => !v)}>
              {progOpen ? "−" : "+"}
            </button>
          </div>
          {progOpen ? (
            <div className="csv-prog-body">
              <div className="csv-nd-row">
                <div className="csv-nd-col">
                  <div className="csv-nd csv-nd-done">✓</div>
                  <div className="csv-nd-lbl csv-l-done">
                    申請
                    <br />
                    送出
                  </div>
                </div>
                <div className="csv-cn">
                  <div className="csv-cl csv-cl-g" />
                </div>
                <div className="csv-nd-col">
                  <div className="csv-nd csv-nd-done">✓</div>
                  <div className="csv-nd-lbl csv-l-done">
                    審核
                    <br />
                    製片
                  </div>
                </div>
                <div className="csv-cn">
                  <div className="csv-cl csv-cl-p" />
                </div>
                <div className="csv-nd-col">
                  <div className="csv-nd csv-nd-active">4</div>
                  <div className="csv-nd-lbl csv-l-active">
                    審核
                    <br />
                    出納
                  </div>
                </div>
                <div className="csv-cn">
                  <div className="csv-cl csv-cl-gray" />
                </div>
                <div className="csv-nd-col">
                  <div className="csv-nd csv-nd-after">5</div>
                  <div className="csv-nd-lbl csv-l-after">
                    待收
                    <br />
                    單據
                  </div>
                </div>
                <div className="csv-cn">
                  <div className="csv-cl csv-cl-gray" />
                </div>
                <div className="csv-nd-col">
                  <div className="csv-nd csv-nd-after">6</div>
                  <div className="csv-nd-lbl csv-l-after">待匯款</div>
                </div>
                <div className="csv-cn">
                  <div className="csv-cl csv-cl-gray" />
                </div>
                <div className="csv-nd-col">
                  <div className="csv-nd csv-nd-after">7</div>
                  <div className="csv-nd-lbl csv-l-after">已結案</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* 基本資料 */}
        <div className="csv-sec">
          <div className="csv-sec-head">
            <span className="csv-sh-t">基本資料</span>
            <button type="button" className="csv-col-btn" onClick={() => setInfoOpen((v) => !v)}>
              {infoOpen ? "−" : "+"}
            </button>
          </div>
          {infoOpen ? (
            <div className="csv-sec-body">
              <div className="csv-ig3">
                <div>
                  <div className="csv-if-label">請款單編號</div>
                    <div className="csv-if-val csv-if-mono-strong">{cur.paymentRequestNo}</div>
                </div>
                <div>
                  <div className="csv-if-label">申請人</div>
                    <div className="csv-if-val">{cur.applicant}</div>
                </div>
                <div>
                  <div className="csv-if-label">所屬專案</div>
                    <div className="csv-if-val">{cur.project}</div>
                </div>
                <div>
                  <div className="csv-if-label">申請日期</div>
                    <div className="csv-if-val">{cur.expenseDate?.replace(/-/g, "/") ?? "—"}</div>
                </div>
                <div>
                  <div className="csv-if-label">申請類型</div>
                  <div className="csv-if-val">{typeLabel}</div>
                </div>
                <div>
                  <div className="csv-if-label">收款帳戶（遮罩）</div>
                    <div className="csv-if-val">{cur.bankMasked ?? "—"}</div>
                </div>
              </div>
              <div>
                <div className="csv-if-label">摘要</div>
                  <div className="csv-if-val">{cur.summary}</div>
              </div>
            </div>
          ) : null}
        </div>

        {/* 費用明細（簡化：沿用請款單總額） */}
        <div className="csv-sec">
          <div className="csv-sec-head">
            <span className="csv-sh-t">費用明細</span>
            <span className="csv-sh-s">
              示意 · 總額 NT$ {cur.totalAmount.toLocaleString()}（銷售額 NT$ {cur.salesAmount.toLocaleString()}／稅額 NT${" "}
              {cur.taxAmount.toLocaleString()}）
            </span>
            <button type="button" className="csv-col-btn" onClick={() => setExpOpen((v) => !v)}>
              {expOpen ? "−" : "+"}
            </button>
          </div>
          {expOpen ? (
            <div className="csv-sec-body">
              <div className="csv-mini-table">
                <div className="csv-mini-row">
                  <span>發票號碼</span>
                  <span className="csv-mono">{cur.invoiceNo ?? "—"}</span>
                </div>
                <div className="csv-mini-row">
                  <span>型態</span>
                  <span>{cur.receiptType === "invoice" ? "發票" : "收據"}</span>
                </div>
                <div className="csv-mini-row">
                  <span>總額</span>
                  <span className="csv-amt">NT$ {cur.totalAmount.toLocaleString()}</span>
                </div>
                <div className="csv-mini-row">
                  <span>銷售額</span>
                  <span className="csv-amt">NT$ {cur.salesAmount.toLocaleString()}</span>
                </div>
                <div className="csv-mini-row">
                  <span>稅額</span>
                  <span className="csv-amt">NT$ {cur.taxAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* 出納審核操作 */}
        <div className="csv-action-sec">
          <div className="csv-action-head">
            <span className="csv-action-title">出納審核操作</span>
            <span className="csv-action-role">Stella Wu · 出納</span>
            <button type="button" className="csv-col-btn" onClick={() => setActionOpen((v) => !v)}>
              {actionOpen ? "−" : "+"}
            </button>
          </div>
          {actionOpen ? (
            <div className="csv-action-body">
              <div className="csv-step-card">
                <div className="csv-step-head">
                  <div className={`csv-sc-circle ${step1Done ? "csv-sc-done" : "csv-sc-active"}`}>{step1Done ? "✓" : "1"}</div>
                  <div className="csv-step-text">
                    <div className="csv-step-title">步驟① 明細 / 單據確認</div>
                    <div className={`csv-step-sub ${step1Done ? "csv-step-sub--done" : "csv-step-sub--active"}`}>
                      {step1Done ? `已完成（通知已寄出 ${notifyCount} 次）` : "寄發通知後才能確認"}
                    </div>
                  </div>
                </div>
                <div className="csv-step-body">
                  <p className="csv-notice-a">
                    請確認費用明細無誤，寄發通知後申請人將備齊正本收據。確認後狀態更新為「待收實體單據」。
                  </p>
                  <div className="csv-cr">
                    <button
                      type="button"
                      className="csv-btn-notify"
                      onClick={() => setNotifyCount((n) => n + 1)}
                      disabled={step1Done}
                    >
                      📨 寄發通知{notifyCount > 0 ? `（${notifyCount}）` : ""}
                    </button>
                    <button type="button" className="csv-btn-c" onClick={() => void doStep1Confirm()} disabled={step1Done || notifyCount === 0}>
                      確認
                    </button>
                  </div>
                </div>
              </div>

              <div className={`csv-step-card ${step2Open ? "" : "csv-step-card--locked"}`}>
                <div className="csv-step-head">
                  <div className={`csv-sc-circle ${result?.kind === "scheduled" ? "csv-sc-done" : step2Open ? "csv-sc-active" : ""}`}>
                    {result?.kind === "scheduled" ? "✓" : "2"}
                  </div>
                  <div className="csv-step-text">
                    <div className="csv-step-title">步驟② 單據核對</div>
                    <div className={`csv-step-sub ${step2Open ? "csv-step-sub--active" : ""}`}>
                      {step2Open ? "設定預計出帳區間與核對日" : "待步驟①完成後解鎖"}
                    </div>
                  </div>
                </div>
                <div className="csv-step-body">
                  <p className="csv-notice-g">
                    收到實體單據後，設定出帳天數並填入核對日期，預計出帳日將自動計算。確認後狀態更新為「待匯款」。
                  </p>
                  <div className="csv-form-row">
                    <label>預計出帳區間</label>
                    <div className="csv-form-inline">
                      <select
                        value={duePreset}
                        onChange={(e) => setDuePreset(e.target.value as "30" | "60" | "90" | "custom")}
                      >
                        <option value="30">30 天</option>
                        <option value="60">60 天</option>
                        <option value="90">90 天（預設）</option>
                        <option value="custom">自訂天數</option>
                      </select>
                      {duePreset === "custom" ? (
                        <input value={customDays} onChange={(e) => setCustomDays(e.target.value)} placeholder="輸入天數" />
                      ) : null}
                    </div>
                    <div className="csv-hint">從單據核對完成日起算 {days || "—"} 天</div>
                  </div>
                  <div className="csv-form-grid">
                    <div>
                      <label>單據核對完成日期 *</label>
                      <input value={verifyDate} onChange={(e) => setVerifyDate(e.target.value)} />
                      <div className="csv-hint">預設今日，可手動修改</div>
                    </div>
                    <div>
                      <label>預計出帳日</label>
                      <input value={payoutDate} readOnly />
                      <div className="csv-hint">自動帶入（核對日＋天數）</div>
                    </div>
                  </div>
                  <div className="csv-cr-end">
                    <button type="button" className="csv-btn-c" onClick={() => void doStep2Confirm()} disabled={!step2Open || !verifyDate || !payoutDate}>
                      確認
                    </button>
                  </div>
                </div>
              </div>

              <div className="csv-divider" />

              <div className="csv-other">
                <button
                  type="button"
                  className="csv-other-head"
                  onClick={() => {
                    setAssignOpen(false);
                    setRejectOpen((v) => !v);
                  }}
                >
                  <span className="csv-other-t">退件</span>
                  <span className="csv-other-d">退回表單至前一關負責人，請註明退件原因</span>
                  <span className="csv-other-toggle">{rejectOpen ? "−" : "+"}</span>
                </button>
                {rejectOpen ? (
                  <div className="csv-other-body">
                    <label>退件原因 *</label>
                    <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} />
                    <div className="csv-cr-end">
                      <button type="button" className="csv-btn-ghost" onClick={() => setRejectOpen(false)}>
                        取消
                      </button>
                      <button type="button" className="csv-btn-danger" onClick={() => void doReject()} disabled={!rejectReason.trim()}>
                        確認退件
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="csv-other">
                <button
                  type="button"
                  className="csv-other-head"
                  onClick={() => {
                    setRejectOpen(false);
                    setAssignOpen((v) => !v);
                  }}
                >
                  <span className="csv-other-t">指派他人審核</span>
                  <span className="csv-other-d">可指定專案其他團隊成員審核</span>
                  <span className="csv-other-toggle">{assignOpen ? "−" : "+"}</span>
                </button>
                {assignOpen ? (
                  <div className="csv-other-body">
                    <div className="csv-assign-hint">
                      1. 指派人員審核僅限專案團隊成員
                      <br />
                      2. Reassign 不改變狀態（PRD v4）
                    </div>
                    <select value={assignSel} onChange={(e) => setAssignSel(e.target.value)}>
                      <option value="">— 請選擇專案團隊成員 —</option>
                      <option>Kevin Liu（出納）</option>
                      <option>Jason Huang（出納）</option>
                      <option>Amy Chen（管理人）</option>
                    </select>
                    <div className="csv-cr-end">
                      <button type="button" className="csv-btn-ghost" onClick={() => setAssignOpen(false)}>
                        取消
                      </button>
                      <button
                        type="button"
                        className="csv-btn-c"
                        onClick={() => {
                          if (!assignSel) return;
                          setResult({ kind: "assigned", who: assignSel });
                          setAssignOpen(false);
                        }}
                        disabled={!assignSel}
                      >
                        確認指派
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {result ? (
          <div className="csv-result">
            {result.kind === "awaiting" ? (
              <div className="csv-result-card">
                <div className="csv-result-title">已完成步驟①：待收實體單據</div>
                <div className="csv-result-sub">通知已寄出 {result.notifyCount} 次</div>
                <button type="button" className="csv-btn-home" onClick={() => nav(`/expenses/${cur.id}`)}>
                  ← 回到報帳明細
                </button>
              </div>
            ) : null}
            {result.kind === "scheduled" ? (
              <div className="csv-result-card">
                <div className="csv-result-title">已完成步驟②：待匯款</div>
                <div className="csv-result-sub">
                  核對日：{result.verifyDate}　預計出帳：{result.payoutDate}
                </div>
                <button type="button" className="csv-btn-home" onClick={() => nav(`/expenses/${cur.id}`)}>
                  ← 回到報帳明細
                </button>
              </div>
            ) : null}
            {result.kind === "rejected" ? (
              <div className="csv-result-card">
                <div className="csv-result-title">已退件</div>
                <div className="csv-result-sub">原因：{result.reason}</div>
                <button type="button" className="csv-btn-home" onClick={() => nav(`/expenses/${cur.id}`)}>
                  ← 回到報帳明細
                </button>
              </div>
            ) : null}
            {result.kind === "assigned" ? (
              <div className="csv-result-card">
                <div className="csv-result-title">已指派他人審核</div>
                <div className="csv-result-sub">{result.who}</div>
                <button type="button" className="csv-btn-home" onClick={() => nav(`/expenses/${cur.id}`)}>
                  ← 回到報帳明細
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

