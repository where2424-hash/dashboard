import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { APPLICATION_TYPE_LABEL, REQUEST_STATUS_LABEL } from "../expenseStatus";
import { getRequestById, producerApprove, producerReject } from "../mockApi";
import type { ApplicationType, ExpenseRequest } from "../types";

/** 選定類型按鈕：對齊 progress_v13 / PRD §4.1 四類 */
const TYPE_KEYS: ApplicationType[] = ["reimbursement", "overage", "surplus", "unpaid"];

const TYPE_CODE: Record<ApplicationType, string> = {
  reimbursement: "2-a",
  overage: "2-b",
  surplus: "2-c",
  unpaid: "2-d"
};

function typeMeta(t: ApplicationType): { dotBg: string } {
  const map: Record<ApplicationType, string> = {
    reimbursement: "#F59E0B",
    overage: "#EF4444",
    surplus: "#7C3AED",
    unpaid: "#059669"
  };
  return { dotBg: map[t] };
}

function TypeNodeLabel({ text }: { text: string }) {
  if (text.length <= 4) return <>{text}</>;
  const mid = Math.ceil(text.length / 2);
  return (
    <>
      {text.slice(0, mid)}
      <br />
      {text.slice(mid)}
    </>
  );
}

/** 與 mockup 一致之費用明細（總額與請款單一致時顯示） */
const DEMO_LINES = [
  {
    serial: "MMA#001",
    receipt: "receipt_001.jpg",
    date: "2026/04/17",
    invoice: "AB-12345678",
    category: "交通費",
    amount: 2000,
    summary: "計程車 往返勘景地點"
  },
  {
    serial: "MMA#002",
    receipt: "receipt_002.jpg",
    date: "2026/04/17",
    invoice: "CD-87654321",
    category: "交通費",
    amount: 1500,
    summary: "高鐵 台北→台中"
  }
];

function ToggleBtn({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button type="button" className="prv-col-btn" onClick={onClick} aria-label={open ? "收合" : "展開"}>
      {open ? "−" : "+"}
    </button>
  );
}

export function ProducerReviewPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [row, setRow] = useState<ExpenseRequest | null | undefined>(undefined);
  const [selectedType, setSelectedType] = useState<ApplicationType | null>(null);
  const [progOpen, setProgOpen] = useState(true);
  const [infoOpen, setInfoOpen] = useState(true);
  const [expOpen, setExpOpen] = useState(true);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [assignSel, setAssignSel] = useState("");
  const [lightbox, setLightbox] = useState<null | { name: string; invoice: string; date: string; amt: string; cat: string }>(
    null
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) {
      setRow(null);
      return;
    }
    void (async () => {
      const data = await getRequestById(id);
      setRow(data ?? null);
      if (data?.applicationType) setSelectedType(data.applicationType);
    })();
  }, [id]);

  const lines = useMemo(() => {
    if (row && DEMO_LINES.reduce((s, l) => s + l.amount, 0) === row.totalAmount) return DEMO_LINES;
    if (!row) return [];
    return [
      {
        serial: row.expenseNo,
        receipt: "receipt.jpg",
        date: row.expenseDate?.replace(/-/g, "/") ?? "—",
        invoice: row.invoiceNo ?? "—",
        category: row.category,
        amount: row.totalAmount,
        summary: row.summary || "—"
      }
    ];
  }, [row]);

  const totalAmt = lines.reduce((s, l) => s + l.amount, 0);

  async function handleApprove() {
    if (!row || !selectedType || busy) return;
    setBusy(true);
    await producerApprove(row.id, selectedType);
    nav(`/expenses/${row.id}`);
  }

  async function handleReject() {
    if (!row || !rejectReason.trim() || busy) return;
    setBusy(true);
    await producerReject(row.id);
    nav(`/expenses/${row.id}`);
  }

  function closeAssignOthers() {
    setAssignOpen(false);
    setRejectOpen(false);
  }

  if (row === undefined) return <p className="rd-muted">載入中…</p>;
  if (!row) return <p>找不到此請款單。</p>;

  if (row.status !== "producer_review") {
    return (
      <section className="prv-page">
        <p className="prv-warn-inline">
          此請款單目前狀態為「{REQUEST_STATUS_LABEL[row.status]}」，非製片審核中。
        </p>
        <Link to={`/expenses/${row.id}`} className="prv-link-back">
          回到報帳明細
        </Link>
      </section>
    );
  }

  const typeLabel = selectedType ? APPLICATION_TYPE_LABEL[selectedType] : null;
  const typeCode = selectedType ? TYPE_CODE[selectedType] : null;

  return (
    <section className="prv-page">
      {/* 內嵌頂列（報帳明細子頁） */}
      <header className="prv-topbar">
        <Link to="/expenses" className="prv-tb-back">
          <svg viewBox="0 0 14 14" fill="none" aria-hidden>
            <path
              d="M9 3L5 7l4 4"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          報帳系統
        </Link>
        <span className="prv-tb-div">/</span>
        <span className="prv-tb-title">製片審核</span>
        <span className="prv-tb-spacer" />
        <span className="prv-inv-tag">{row.paymentRequestNo}</span>
        <span className="prv-badge prv-badge--orange">{REQUEST_STATUS_LABEL[row.status]}</span>
      </header>

      <div className="prv-content">
        {/* 進度（PRD v4 狀態用語） */}
        <div className="prv-prog-wrap">
          <div className="prv-prog-head">
            <div className="prv-prog-lbl">
              目前進度：
              <strong>製片審核中</strong>
              　負責：Patrick Lin（示意）・送出：{row.updatedAt?.slice(0, 10) ?? "—"}
            </div>
            <ToggleBtn open={progOpen} onClick={() => setProgOpen((v) => !v)} />
          </div>
          {progOpen ? (
            <div className="prv-prog-body">
              <div className="prv-nd-row">
                <div className="prv-nd-col">
                  <div className="prv-nd prv-nd-done">✓</div>
                  <div className="prv-nd-lbl prv-l-done">
                    申請
                    <br />
                    送出
                  </div>
                </div>
                <div className="prv-cn">
                  <div className="prv-cl prv-cl-g" />
                </div>
                <div className="prv-nd-col">
                  <div className="prv-nd prv-nd-active">2</div>
                  <div className="prv-nd-lbl prv-l-active">
                    審核
                    <br />
                    製片
                  </div>
                </div>
                <div className="prv-cn">
                  <div className="prv-cl prv-cl-p" />
                </div>
                <div className="prv-nd-col">
                  <div
                    className="prv-nd"
                    style={
                      selectedType
                        ? {
                            background: typeMeta(selectedType).dotBg,
                            color: "#fff",
                            fontSize: 10,
                            fontWeight: 700,
                            border: "none"
                          }
                        : {}
                    }
                  >
                    {typeCode ?? "?"}
                  </div>
                  <div
                    className="prv-nd-lbl"
                    style={
                      selectedType
                        ? { color: typeMeta(selectedType).dotBg, fontWeight: 600 }
                        : { color: "var(--color-text-tertiary)" }
                    }
                  >
                    {typeLabel ? <TypeNodeLabel text={typeLabel} /> : (
                      <>
                        待定
                        <br />
                        類型
                      </>
                    )}
                  </div>
                </div>
                <div className="prv-cn">
                  <div className="prv-cl prv-cl-gray" />
                </div>
                <div className="prv-nd-col">
                  <div className="prv-nd prv-nd-after">4</div>
                  <div className="prv-nd-lbl prv-l-after">
                    出納
                    <br />
                    審核中
                  </div>
                </div>
                <div className="prv-cn">
                  <div className="prv-cl prv-cl-gray" />
                </div>
                <div className="prv-nd-col">
                  <div className="prv-nd prv-nd-after">5</div>
                  <div className="prv-nd-lbl prv-l-after">
                    待收
                    <br />
                    實體單據
                  </div>
                </div>
                <div className="prv-cn">
                  <div className="prv-cl prv-cl-gray" />
                </div>
                <div className="prv-nd-col">
                  <div className="prv-nd prv-nd-after">6</div>
                  <div className="prv-nd-lbl prv-l-after">
                    待
                    <br />
                    匯款
                  </div>
                </div>
                <div className="prv-cn">
                  <div className="prv-cl prv-cl-gray" />
                </div>
                <div className="prv-nd-col">
                  <div className="prv-nd prv-nd-after">7</div>
                  <div className="prv-nd-lbl prv-l-after">
                    已
                    <br />
                    結案
                  </div>
                </div>
              </div>
              <div className="prv-prog-foot">
                申請類型須於下方<strong>選定</strong>後，方可核准並送交<strong>出納審核中</strong>（PRD v4）。
              </div>
            </div>
          ) : null}
        </div>

        {/* 基本資料 */}
        <div className="prv-sec">
          <div className="prv-sec-head">
            <span className="prv-sh-t">基本資料</span>
            <ToggleBtn open={infoOpen} onClick={() => setInfoOpen((v) => !v)} />
          </div>
          {infoOpen ? (
            <div className="prv-sec-body">
              <div className="prv-ig3">
                <div>
                  <div className="prv-if-label">請款單編號</div>
                  <div className="prv-if-val prv-if-mono-strong">{row.paymentRequestNo}</div>
                </div>
                <div>
                  <div className="prv-if-label">申請人</div>
                  <div className="prv-if-val">{row.applicant}</div>
                </div>
                <div>
                  <div className="prv-if-label">所屬專案</div>
                  <div className="prv-if-val">{row.project}</div>
                </div>
                <div>
                  <div className="prv-if-label">申請日期</div>
                  <div className="prv-if-val">{row.expenseDate?.replace(/-/g, "/") ?? "—"}</div>
                </div>
                <div>
                  <div className="prv-if-label">申請類型</div>
                  <div style={{ marginTop: 3 }}>
                    {typeLabel ? (
                      <>
                        <span className="prv-mini-badge">{typeLabel}</span>
                        <span className="prv-hint-inline">製片選定</span>
                      </>
                    ) : (
                      <span className="prv-muted">尚未選定（請於下方操作區選擇）</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="prv-if-label">收款（遮罩）</div>
                  <div className="prv-if-val">{row.bankMasked ?? "—"}</div>
                </div>
              </div>
              <div>
                <div className="prv-if-label">摘要說明</div>
                <div className="prv-if-val" style={{ marginTop: 3 }}>
                  {row.summary}
                </div>
              </div>
              <div className="prv-pdf-bar">
                <div className="prv-pdf-ic" aria-hidden>
                  <svg viewBox="0 0 14 14" fill="none">
                    <path d="M2 1h7l3 3v9H2V1z" stroke="currentColor" strokeWidth="1.1" />
                    <path d="M4 7h6M4 9.5h4" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <div className="prv-pdf-name">{row.paymentRequestNo}_報帳申請.pdf</div>
                  <div className="prv-pdf-sub">送出時自動產生・含申請內容與費用明細（示意）</div>
                </div>
                <button type="button" className="prv-btn-dl" onClick={() => alert("（Mock）下載 PDF")}>
                  ⬇ 下載
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* 費用明細 */}
        <div className="prv-sec">
          <div className="prv-sec-head">
            <span className="prv-sh-t">費用明細</span>
            <span className="prv-sh-s">{lines.length} 筆 · 點縮圖預覽</span>
            <ToggleBtn open={expOpen} onClick={() => setExpOpen((v) => !v)} />
          </div>
          {expOpen ? (
            <div className="prv-exp-wrap">
              <table className="prv-exp-table">
                <thead>
                  <tr>
                    <th style={{ width: 72 }}>流水號</th>
                    <th style={{ width: 36 }}>收據</th>
                    <th style={{ width: 78 }}>單據日期</th>
                    <th style={{ width: 98 }}>發票號碼</th>
                    <th style={{ width: 72 }}>分類</th>
                    <th style={{ width: 82, textAlign: "right" }}>總額</th>
                    <th>摘要</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => (
                    <tr key={line.serial}>
                      <td>
                        <span className="prv-line-serial">{line.serial}</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="prv-thumb"
                          onClick={() =>
                            setLightbox({
                              name: line.receipt,
                              invoice: line.invoice,
                              date: line.date,
                              amt: `NT$ ${line.amount.toLocaleString()}`,
                              cat: line.category
                            })
                          }
                          aria-label="預覽收據"
                        >
                          <svg viewBox="0 0 14 14" fill="none">
                            <path d="M2 1h7l3 3v9H2V1z" stroke="currentColor" strokeWidth="1" />
                          </svg>
                        </button>
                      </td>
                      <td>{line.date}</td>
                      <td className="prv-cell-mono">{line.invoice}</td>
                      <td>
                        <span className="prv-cat-badge">{line.category}</span>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 500 }}>
                        NT$ {line.amount.toLocaleString()}
                      </td>
                      <td>{line.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="prv-total-row">
                <span>合計</span>
                <span className="prv-total-amt">NT$ {totalAmt.toLocaleString()}</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* 製片審核操作 */}
        <div className="prv-action-sec">
          <div className="prv-action-head">
            <span className="prv-action-title">製片審核操作</span>
            <span className="prv-action-role">Patrick Lin · 製片</span>
          </div>
          <div className="prv-action-body">
            <p className="prv-notice-a">
              請確認費用與單據合理後，<strong>選定申請類型</strong>
              （PRD：申請人無須預選，由製片於此決定）。核准後狀態將為「出納審核中」。
            </p>

            <div className="prv-type-row">
              <span className="prv-type-lbl">選定類型：</span>
              {TYPE_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`prv-type-btn prv-type-btn--${k}${selectedType === k ? " prv-type-btn--selected" : ""}`}
                  onClick={() => setSelectedType(k)}
                >
                  {APPLICATION_TYPE_LABEL[k]}
                </button>
              ))}
            </div>

            <div className="prv-cr">
              <button
                type="button"
                className="prv-btn-primary"
                disabled={!selectedType || busy}
                onClick={() => void handleApprove()}
              >
                核准並送交出納
              </button>
            </div>

            <div className="prv-divider" />

            <div className="prv-other">
              <button
                type="button"
                className="prv-other-head"
                onClick={() => {
                  closeAssignOthers();
                  setRejectOpen((v) => !v);
                }}
              >
                <span className="prv-oic prv-oic-red" aria-hidden>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 2l6 6M8 2l-6 6" stroke="#791F1F" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </span>
                <span>
                  <span className="prv-other-t">退件</span>
                  <span className="prv-other-d">退回申請人修改，原因將寫入紀錄</span>
                </span>
                <span className="prv-col-btn" style={{ marginLeft: "auto" }}>
                  {rejectOpen ? "−" : "+"}
                </span>
              </button>
              {rejectOpen ? (
                <div className="prv-other-body">
                  <label className="prv-fl">
                    退件原因 <span className="prv-req">*</span>
                  </label>
                  <textarea
                    className="prv-ta"
                    placeholder="請說明退件原因…"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                  />
                  <div className="prv-cr-end">
                    <button type="button" className="prv-btn-ghost" onClick={() => setRejectOpen(false)}>
                      取消
                    </button>
                    <button
                      type="button"
                      className="prv-btn-danger"
                      disabled={!rejectReason.trim() || busy}
                      onClick={() => void handleReject()}
                    >
                      確認退件
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="prv-other">
              <button
                type="button"
                className="prv-other-head"
                onClick={() => {
                  setRejectOpen(false);
                  setAssignOpen((v) => !v);
                }}
              >
                <span className="prv-oic prv-oic-gray" aria-hidden>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M5 1a2 2 0 100 4 2 2 0 000-4z"
                      stroke="#5F5E5A"
                      strokeWidth="1.1"
                    />
                    <path d="M1 9c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="#5F5E5A" strokeWidth="1.1" strokeLinecap="round" />
                  </svg>
                </span>
                <span>
                  <span className="prv-other-t">指派他人代審</span>
                  <span className="prv-other-d">Reassign：僅專案成員；狀態不變（PRD v4）</span>
                </span>
                <span className="prv-col-btn" style={{ marginLeft: "auto" }}>
                  {assignOpen ? "−" : "+"}
                </span>
              </button>
              {assignOpen ? (
                <div className="prv-other-body">
                  <p className="prv-assign-hint">
                    指派人員後，被指派者可於待辦處理；<strong>責任歸屬維持原審核人</strong>。
                  </p>
                  <select className="prv-fs" value={assignSel} onChange={(e) => setAssignSel(e.target.value)}>
                    <option value="">— 請選擇專案成員 —</option>
                    <option>Amy Chen（管理人）</option>
                    <option>Kevin Liu（製片）</option>
                  </select>
                  <div className="prv-cr-end">
                    <button type="button" className="prv-btn-ghost" onClick={() => setAssignOpen(false)}>
                      取消
                    </button>
                    <button
                      type="button"
                      className="prv-btn-primary"
                      onClick={() => {
                        if (!assignSel) {
                          alert("請先選擇人員");
                          return;
                        }
                        alert(`（Mock）已指派：${assignSel}`);
                        setAssignOpen(false);
                      }}
                    >
                      確認指派
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {lightbox ? (
        <button
          type="button"
          className="prv-lb-overlay"
          onClick={() => setLightbox(null)}
          aria-label="關閉預覽"
        >
          <div className="prv-lb-card" onClick={(e) => e.stopPropagation()}>
            <div className="prv-lb-top">
              <span>{lightbox.name}</span>
              <button type="button" className="prv-lb-x" onClick={() => setLightbox(null)}>
                ×
              </button>
            </div>
            <div className="prv-lb-img" aria-hidden>
              <svg viewBox="0 0 20 20" fill="none">
                <path d="M4 2h8.5L16 5.5V18H4V2z" stroke="var(--color-text-tertiary)" strokeWidth="1.1" />
              </svg>
            </div>
            <div className="prv-lb-meta">
              <div className="prv-lb-row">
                <span>發票號碼</span>
                <span>{lightbox.invoice}</span>
              </div>
              <div className="prv-lb-row">
                <span>單據日期</span>
                <span>{lightbox.date}</span>
              </div>
              <div className="prv-lb-row">
                <span>總額</span>
                <span>{lightbox.amt}</span>
              </div>
              <div className="prv-lb-row">
                <span>分類</span>
                <span>{lightbox.cat}</span>
              </div>
            </div>
          </div>
        </button>
      ) : null}
    </section>
  );
}
