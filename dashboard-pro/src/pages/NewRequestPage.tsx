import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createRequest, deleteDraft, listRequests } from "../mockApi";
import type { ExpenseRequest } from "../types";

const CATS = [
  "交通費",
  "餐費",
  "道具費",
  "人員費用",
  "器材費用",
  "服裝費用",
  "場地費用",
  "雜支",
  "後製費",
  "其他"
];

const BANK_OPTIONS: { code: string; name: string }[] = [
  { code: "004", name: "臺灣銀行" },
  { code: "005", name: "土地銀行" },
  { code: "006", name: "合作金庫" },
  { code: "007", name: "第一銀行" },
  { code: "008", name: "華南銀行" },
  { code: "009", name: "彰化銀行" },
  { code: "011", name: "上海銀行" },
  { code: "012", name: "台北富邦" },
  { code: "013", name: "國泰世華" },
  { code: "017", name: "兆豐銀行" },
  { code: "021", name: "花旗銀行" },
  { code: "050", name: "臺灣企銀" },
  { code: "052", name: "渣打銀行" },
  { code: "700", name: "中華郵政" },
  { code: "803", name: "聯邦銀行" },
  { code: "806", name: "元大銀行" },
  { code: "807", name: "永豐銀行" },
  { code: "808", name: "玉山銀行" },
  { code: "809", name: "凱基銀行" },
  { code: "810", name: "星展銀行" },
  { code: "812", name: "台新銀行" },
  { code: "816", name: "安泰銀行" },
  { code: "822", name: "中國信託" }
];

const BRANCH_SUGGESTIONS = ["信義分行", "敦南分行", "忠孝分行", "板橋分行", "新莊分行", "中山分行"];

type UploadStatus = "ok" | "warn" | "err";

interface UploadRow {
  id: string;
  name: string;
  size: string;
  batch: 1 | 2;
  status: UploadStatus;
  amt: number;
  inv: string;
  date: string;
  cat: string;
  sum: string;
  tmp: number;
  checked: boolean;
  /** PRD v4：草稿亦為正式流水號（MMA#00001）；帶入時保留顯示 */
  expenseNo?: string;
}

const BATCH_PRESETS: Record<1 | 2, Omit<UploadRow, "id" | "tmp" | "checked">[]> = {
  1: [
    {
      name: "receipt_001.jpg",
      size: "1.2 MB",
      batch: 1,
      status: "ok",
      amt: 3500,
      inv: "AB-12345678",
      date: "2026/04/17",
      cat: "交通費",
      sum: "勘景交通補貼"
    },
    {
      name: "receipt_002.png",
      size: "870 KB",
      batch: 1,
      status: "ok",
      amt: 1200,
      inv: "BC-23456789",
      date: "2026/04/18",
      cat: "餐費",
      sum: ""
    },
    {
      name: "receipt_003.pdf",
      size: "2.4 MB",
      batch: 1,
      status: "warn",
      amt: 8800,
      inv: "CD-34567890",
      date: "2026/04/1",
      cat: "道具費",
      sum: "場景道具租借"
    }
  ],
  2: [
    {
      name: "receipt_004.jpg",
      size: "1.6 MB",
      batch: 2,
      status: "err",
      amt: 0,
      inv: "",
      date: "",
      cat: "",
      sum: ""
    },
    {
      name: "receipt_005.png",
      size: "980 KB",
      batch: 2,
      status: "ok",
      amt: 5400,
      inv: "EF-56789012",
      date: "2026/04/21",
      cat: "後製費",
      sum: "剪接外包費"
    }
  ]
};

let uidSeq = 1;
let tempSeq = 1;

function isRowComplete(u: UploadRow): boolean {
  return (
    u.date.trim() !== "" &&
    u.inv.trim() !== "" &&
    u.cat !== "" &&
    u.amt > 0 &&
    u.sum.trim() !== ""
  );
}

function dateFieldClass(u: UploadRow): string {
  if (u.date === "") return "enr-ef enr-ef-err";
  if (/\d{4}\/\d{2}\/\d$/.test(u.date)) return "enr-ef enr-ef-warn";
  return "enr-ef";
}

function formatExpenseDate(iso?: string): string {
  if (!iso?.trim()) return "—";
  return iso.replace(/-/g, "/");
}

function maskAccount(acct: string): string {
  const raw = (acct ?? "").trim();
  if (raw.length <= 8) return raw;
  return `${raw.slice(0, 4)}****${raw.slice(-4)}`;
}

export function NewRequestPage() {
  const nav = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<"form" | "draft">("form");

  const [applicant, setApplicant] = useState("Eric Wang");
  const [project, setProject] = useState("牧馬專案 A");
  const [requestDate, setRequestDate] = useState("2026/04/25");
  const [summaryNote, setSummaryNote] = useState("");
  const [projConflict, setProjConflict] = useState(false);

  const [basicConfirmed, setBasicConfirmed] = useState(false);
  /** 一旦確認過基本資料，收據／明細／帳戶區塊解鎖；再按「修改」不重新鎖定。 */
  const [basicFlowStarted, setBasicFlowStarted] = useState(false);

  const [uploads, setUploads] = useState<UploadRow[]>([]);

  const [bankCode, setBankCode] = useState("808");
  const [bankBranch, setBankBranch] = useState("信義分行");
  const [bankAccount, setBankAccount] = useState("001-234-567890");
  const [bankHolder, setBankHolder] = useState("王大明");
  const [bankConfirmed, setBankConfirmed] = useState(false);
  const [submitUnlocked, setSubmitUnlocked] = useState(false);
  const [bankEditing, setBankEditing] = useState(false);
  const [bankBackup, setBankBackup] = useState<null | {
    code: string;
    branch: string;
    acct: string;
    holder: string;
  }>(null);

  // ── draft banner panel (draft_page_v4) ──
  const [draftPanelOpen, setDraftPanelOpen] = useState(false);
  const [drafts, setDrafts] = useState<ExpenseRequest[]>([]);
  const [draftSel, setDraftSel] = useState<Record<string, boolean>>({});

  async function reloadDrafts() {
    const all = await listRequests();
    const d = all.filter((r) => r.status === "draft");
    setDrafts(d);
    setDraftSel((prev) => {
      const next: Record<string, boolean> = {};
      for (const row of d) next[row.id] = prev[row.id] ?? false;
      return next;
    });
  }

  useEffect(() => {
    void reloadDrafts();
  }, []);

  const unlockSections = basicFlowStarted;

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    const area = scrollRef.current;
    if (el && area) {
      window.setTimeout(() => {
        area.scrollTo({ top: Math.max(0, el.offsetTop - 16), behavior: "smooth" });
      }, 80);
    }
  }, []);

  function confirmBasic() {
    setBasicConfirmed(true);
    setBasicFlowStarted(true);
    scrollToSection("enr-sec-upload");
  }

  function editBasic() {
    setBasicConfirmed(false);
  }

  function confirmBank() {
    setBankConfirmed(true);
    setSubmitUnlocked(true);
    setBankEditing(false);
    setBankBackup(null);
    scrollToSection("enr-sec-submit");
  }

  function editBank() {
    setBankBackup({ code: bankCode, branch: bankBranch, acct: bankAccount, holder: bankHolder });
    setBankEditing(true);
    setSubmitUnlocked(false);
  }

  function cancelEditBank() {
    if (bankBackup) {
      setBankCode(bankBackup.code);
      setBankBranch(bankBackup.branch);
      setBankAccount(bankBackup.acct);
      setBankHolder(bankBackup.holder);
    }
    setBankEditing(false);
    setBankBackup(null);
    setSubmitUnlocked(false);
  }

  function addBatch(bnum: 1 | 2) {
    const data = BATCH_PRESETS[bnum];
    setUploads((prev) => {
      const next = [...prev];
      for (const d of data) {
        const isErr = d.status === "err";
        next.push({
          ...d,
          id: `u${uidSeq++}`,
          tmp: tempSeq++,
          checked: !isErr
        });
      }
      return next;
    });
  }

  const draftStats = useMemo(() => {
    const ids = Object.keys(draftSel).filter((id) => draftSel[id]);
    const selRows = drafts.filter((d) => ids.includes(d.id));
    const total = selRows.reduce((s, r) => s + r.amount, 0);
    return { ids, selRows, total };
  }, [draftSel, drafts]);

  function toggleDraftAll(v: boolean) {
    setDraftSel((prev) => {
      const next = { ...prev };
      for (const d of drafts) next[d.id] = v;
      return next;
    });
  }

  async function doDeleteSelectedDrafts() {
    if (draftStats.ids.length === 0) return;
    // 簡化：直接刪除，不做二次確認（UI 後續可補）
    for (const id of draftStats.ids) await deleteDraft(id);
    await reloadDrafts();
  }

  function doEnterDrafts() {
    if (draftStats.selRows.length === 0) return;
    const sel = draftStats.selRows;

    const projSet = new Set(sel.map((d) => d.project));
    const conflict = projSet.size > 1;
    setProjConflict(conflict);
    if (!conflict) setProject(sel[sel.length - 1]?.project ?? project);
    if (conflict) setProject("");

    setApplicant(sel[sel.length - 1]?.applicant ?? applicant);
    setRequestDate(new Date().toISOString().slice(0, 10).replace(/-/g, "/"));

    setBasicFlowStarted(true);
    setBasicConfirmed(true);

    setUploads((prev) => {
      const next = [...prev];
      for (const d of sel) {
        next.push({
          id: `u${uidSeq++}`,
          name: `draft_${d.requestNo}.pdf`,
          size: "—",
          batch: 1,
          status: "ok",
          amt: d.amount,
          inv: d.invoiceNo ?? "",
          date: d.expenseDate ? d.expenseDate.replace(/-/g, "/") : "",
          cat: d.category,
          sum: d.summary,
          tmp: tempSeq++,
          checked: true,
          expenseNo: d.requestNo
        });
      }
      return next;
    });

    setDraftPanelOpen(false);
    scrollToSection("enr-sec-review");
  }

  function removeUpload(id: string) {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  }

  function patchUpload(id: string, field: keyof UploadRow, val: string | number) {
    setUploads((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        if (field === "amt") {
          const n = parseInt(String(val).replace(/,/g, ""), 10);
          return { ...u, amt: Number.isFinite(n) ? n : 0 };
        }
        return { ...u, [field]: val } as UploadRow;
      })
    );
  }

  function toggleRowCheck(id: string, checked: boolean) {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, checked } : u)));
  }

  function toggleAll(master: boolean) {
    setUploads((prev) =>
      prev.map((u) => (u.status === "err" ? u : { ...u, checked: master }))
    );
  }

  const stats = useMemo(() => {
    let sel = 0;
    let draft = 0;
    let sum = 0;
    let allOk = true;
    for (const u of uploads) {
      const complete = isRowComplete(u);
      const disabled = u.status === "err";
      if (disabled) {
        draft++;
        continue;
      }
      if (u.checked) {
        sel++;
        sum += u.amt || 0;
        if (!complete) allOk = false;
      } else {
        draft++;
      }
    }
    const canSubmit = sel > 0 && allOk;
    const showBlockedHint = sel > 0 && !allOk;
    return { sel, draft, sum, canSubmit, showBlockedHint };
  }, [uploads]);

  const prog = useMemo(() => {
    const ok = uploads.filter((u) => u.status === "ok").length;
    const err = uploads.filter((u) => u.status === "err").length;
    const total = uploads.length;
    const pct = total > 0 ? Math.round(((ok + err) / total) * 100) : 0;
    return { ok, err, total, pct };
  }, [uploads]);

  const showUploadList = uploads.length > 0;

  async function handleSubmit() {
    if (!stats.canSubmit) return;
    const selected = uploads.filter((u) => u.status !== "err" && u.checked);
    const cats = [...new Set(selected.map((u) => u.cat))];
    const catLabel = cats.length <= 1 ? cats[0] ?? "其他" : "複合申請";
    const summaryParts = summaryNote.trim()
      ? [summaryNote.trim()]
      : selected.map((u) => u.sum).filter(Boolean);
    const summaryText =
      summaryParts.length > 0 ? summaryParts.slice(0, 3).join("；") : "報帳申請";
    await createRequest({
      requestNo: `MUY-2605-${String(Math.floor(Math.random() * 900) + 100)}`,
      project,
      applicant,
      category: catLabel,
      amount: stats.sum,
      summary: summaryText,
      status: "producer_review",
      invoiceNo: selected[0]?.inv,
      expenseDate: selected[0]?.date?.replace(/\//g, "-")
    });
    nav("/expenses");
  }

  function saveAllDraft() {
    setUploads((prev) => prev.map((u) => (u.status === "err" ? u : { ...u, checked: false })));
    setView("draft");
  }

  return (
    <section className="expense-new-request">
      <h2 className="enr-sr-only">報帳申請表單（新增）</h2>
      <p className="enr-page-hint">
        點「前往草稿 ↗」或橫幅可切換至草稿清單 · 「選取檔案」模擬批次一（3 張），「再次上傳」模擬批次二（2 張）
      </p>

      {view === "form" ? (
        <div className="enr-page">
          <div className="enr-topbar">
            <button type="button" className="enr-tb-back" onClick={() => setView("draft")}>
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
            </button>
            <span className="enr-tb-div">/</span>
            <span className="enr-tb-title">新增報帳申請 · {project}</span>
            <button type="button" className="enr-btn enr-btn-g" onClick={() => nav("/expenses")}>
              取消
            </button>
          </div>

          <div className="enr-scroll-area" ref={scrollRef}>
            {/* 草稿橫幅（draft_page_v4：可展開、可勾選帶入） */}
            <button
              type="button"
              className="enr-draft-banner"
              onClick={() => setDraftPanelOpen((v) => !v)}
              disabled={drafts.length === 0}
            >
              <div className="enr-db-ic" aria-hidden>
                <svg viewBox="0 0 13 13" fill="none">
                  <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.2" />
                  <path
                    d="M6.5 3.5v3.5l2 1.5"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="enr-db-text">
                <div className="enr-db-t">你有 {drafts.length} 筆草稿未完成</div>
                <div className="enr-db-s">點擊展開後可勾選多筆草稿帶入此次申請</div>
              </div>
              <span className="enr-db-btn" onClick={(e) => e.stopPropagation()}>
                {draftPanelOpen ? "收起草稿 ▴" : "展開草稿 ▾"}
              </span>
            </button>

            {draftPanelOpen ? (
              <div className="enr-draft-panel">
                <div className="enr-dp-toolbar">
                  <input
                    type="checkbox"
                    checked={draftStats.ids.length > 0 && draftStats.ids.length === drafts.length}
                    ref={(el) => {
                      if (!el) return;
                      el.indeterminate = draftStats.ids.length > 0 && draftStats.ids.length < drafts.length;
                    }}
                    onChange={(e) => toggleDraftAll(e.target.checked)}
                  />
                  <span className="enr-dp-selinfo">
                    {draftStats.ids.length === 0
                      ? "未選取任何草稿"
                      : `已選 ${draftStats.ids.length} 筆・合計 NT$ ${draftStats.total.toLocaleString()}`}
                  </span>
                  <button
                    type="button"
                    className="enr-dp-btn enr-dp-btn--del"
                    disabled={draftStats.ids.length === 0}
                    onClick={() => void doDeleteSelectedDrafts()}
                  >
                    刪除選取
                  </button>
                  <button
                    type="button"
                    className="enr-dp-btn enr-dp-btn--enter"
                    disabled={draftStats.ids.length === 0}
                    onClick={doEnterDrafts}
                  >
                    帶入申請 →
                  </button>
                  <button type="button" className="enr-dp-btn" onClick={() => setDraftPanelOpen(false)}>
                    取消
                  </button>
                </div>
                <div className="enr-dp-tablewrap">
                  <table className="enr-dp-table">
                    <thead>
                      <tr>
                        <th style={{ width: 32 }} />
                        <th>草稿編號</th>
                        <th>收據</th>
                        <th>單據日期</th>
                        <th>發票號碼</th>
                        <th>分類</th>
                        <th style={{ textAlign: "right" }}>金額</th>
                        <th>摘要</th>
                        <th>建立時間</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drafts.map((d) => (
                        <tr key={d.id} className={draftSel[d.id] ? "enr-dp-row--sel" : ""}>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={!!draftSel[d.id]}
                              onChange={(e) => setDraftSel((p) => ({ ...p, [d.id]: e.target.checked }))}
                            />
                          </td>
                          <td>
                            <span className="enr-dp-sn">{d.requestNo}</span>
                          </td>
                          <td>
                            <span className="enr-dp-thumb" aria-hidden>
                              📄
                            </span>
                          </td>
                          <td>{formatExpenseDate(d.expenseDate)}</td>
                          <td className="enr-dp-mono">{d.invoiceNo ?? "—"}</td>
                          <td>{d.category}</td>
                          <td style={{ textAlign: "right", fontWeight: 500 }}>NT$ {d.amount.toLocaleString()}</td>
                          <td>{d.summary}</td>
                          <td className="enr-dp-muted">{d.updatedAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            <div className="enr-sec" id="enr-sec-basic">
              <div className="enr-sec-head">
                <div className="enr-sh-left">
                  <span className="enr-sh-title">基本資料</span>
                  {basicConfirmed ? (
                    <span className="enr-sh-ok">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                        <path
                          d="M2 5l2 2 4-4"
                          stroke="#27500A"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>{" "}
                      已確認
                    </span>
                  ) : (
                    <span className="enr-sh-tag">系統預填，可手動修改</span>
                  )}
                </div>
                <div>
                  {basicConfirmed ? (
                    <button type="button" className="enr-btn-edit-sm" onClick={editBasic}>
                      修改
                    </button>
                  ) : (
                    <button type="button" className="enr-btn-confirm" onClick={confirmBasic}>
                      確認基本資料
                    </button>
                  )}
                </div>
              </div>
              <div className="enr-sec-body">
                <div className="enr-fg3" style={{ marginBottom: 10 }}>
                  <div className="enr-field">
                    <label>
                      申請人 <span className="enr-req">*</span>
                    </label>
                    <input
                      className="enr-inp"
                      value={applicant}
                      onChange={(e) => setApplicant(e.target.value)}
                    />
                    <div className="enr-inp-hint">預設為登入帳號，可手動修改</div>
                  </div>
                  <div className="enr-field">
                    <label>
                      所屬專案 <span className="enr-req">*</span>
                    </label>
                    <select
                      className="enr-sel"
                      value={project}
                      onChange={(e) => setProject(e.target.value)}
                    >
                      <option value="">— 請選擇 —</option>
                      <option>牧馬專案 A</option>
                      <option>牧馬專案 B</option>
                      <option>牧馬專案 C</option>
                    </select>
                    <div className="enr-inp-hint">預設為目前選取的專案，可切換</div>
                    {projConflict ? (
                      <div className="enr-inp-hint" style={{ color: "#A32D2D" }}>
                        ⚠ 草稿來自不同專案，請手動選擇
                      </div>
                    ) : null}
                  </div>
                  <div className="enr-field">
                    <label>
                      申請日期 <span className="enr-req">*</span>
                    </label>
                    <input
                      className="enr-inp"
                      value={requestDate}
                      onChange={(e) => setRequestDate(e.target.value)}
                    />
                    <div className="enr-inp-hint">預設為今天，可手動修改</div>
                  </div>
                </div>
                <div className="enr-field">
                  <label>摘要說明（選填，送出後可於明細頁補填）</label>
                  <input
                    className="enr-inp"
                    placeholder="例如：04/25 拍攝日交通、餐飲費用"
                    value={summaryNote}
                    onChange={(e) => setSummaryNote(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className={`enr-sec ${!unlockSections ? "enr-locked" : ""}`} id="enr-sec-upload">
              <div className="enr-sec-head">
                <div className="enr-sh-left">
                  <span className="enr-sh-title">收據上傳</span>
                  <span className="enr-sh-gray">
                    可多次上傳，每次新增至清單，AI 自動辨識並即時更新明細
                  </span>
                </div>
              </div>
              <div className="enr-sec-body">
                <div className="enr-mockup-notice">
                  <svg viewBox="0 0 11 11" fill="none" aria-hidden>
                    <circle cx="5.5" cy="5.5" r="5" stroke="currentColor" strokeWidth="1" />
                    <path
                      d="M5.5 3.5v3M5.5 7.5v.5"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="round"
                    />
                  </svg>
                  Mockup：點「選取檔案」帶入批次一（3 張），「再次上傳」帶入批次二（2 張）；實作後將開啟系統檔案選取
                </div>

                {!showUploadList ? (
                  <div className="enr-upload-area">
                    <div className="enr-ua-t">拖曳收據至此，或點擊選取</div>
                    <div className="enr-ua-d">可一次選取多張，支援多次批次上傳</div>
                    <div className="enr-ua-acts">
                      <button type="button" className="enr-btn" onClick={() => addBatch(1)}>
                        選取檔案（模擬批次一）
                      </button>
                      <button type="button" className="enr-btn" onClick={() => addBatch(1)}>
                        拍照上傳（模擬批次一）
                      </button>
                    </div>
                    <div className="enr-ua-hint">支援 JPG、PNG、PDF · 單檔上限 20MB · 最多 50 張</div>
                  </div>
                ) : null}

                {showUploadList ? (
                  <div>
                    <div className="enr-upload-list-header">
                      <span className="enr-uh-title">
                        已上傳 {uploads.length} 張收據（共{" "}
                        {new Set(uploads.map((u) => u.batch)).size} 次批次）
                      </span>
                      <button type="button" className="enr-uh-add" onClick={() => addBatch(2)}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                          <path
                            d="M5 1v8M1 5h8"
                            stroke="currentColor"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                          />
                        </svg>
                        再次上傳（模擬批次二）
                      </button>
                    </div>
                    <div className="enr-upload-list">
                      {uploads.map((u) => (
                        <div key={u.id} className="enr-uitem">
                          <div className="enr-uitem-ic" aria-hidden>
                            <svg viewBox="0 0 12 12" fill="none">
                              <path
                                d="M2 1h5L10 4v7H2V1z"
                                stroke="currentColor"
                                strokeWidth="1"
                              />
                            </svg>
                          </div>
                          <span className="enr-uitem-name">{u.name}</span>
                          <span className="enr-uitem-sz">{u.size}</span>
                          <span className={`enr-uitem-batch ${u.batch === 1 ? "enr-b1" : "enr-b2"}`}>
                            批次 {u.batch}
                          </span>
                          <span
                            className={`enr-uitem-st ${u.status === "ok" ? "enr-st-ok" : "enr-st-err"}`}
                          >
                            {u.status === "ok" ? "辨識完成" : u.status === "warn" ? "需確認" : "辨識失敗"}
                          </span>
                          <button
                            type="button"
                            className="enr-uitem-rm"
                            onClick={() => removeUpload(u.id)}
                            aria-label="移除"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="enr-prog-section">
                      <div className="enr-prog-header">
                        <span className="enr-prog-title">AI 辨識進度</span>
                        <span className="enr-prog-count">
                          {prog.ok + prog.err} / {prog.total} 張完成
                        </span>
                      </div>
                      <div className="enr-prog-wrap">
                        <div className="enr-prog-bar" style={{ width: `${prog.pct}%` }} />
                      </div>
                      <div className="enr-prog-status">
                        <div className="enr-ps-item">
                          <div className="enr-ps-dot enr-ps-ok" />
                          <span>完成 {prog.ok} 張</span>
                        </div>
                        <div className="enr-ps-item">
                          <div className="enr-ps-dot enr-ps-proc" />
                          <span>辨識中 {uploads.filter((u) => u.status === "warn").length} 張</span>
                        </div>
                        <div className="enr-ps-item">
                          <div className="enr-ps-dot enr-ps-err" />
                          <span>失敗 {prog.err} 張</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className={`enr-sec ${!unlockSections ? "enr-locked" : ""}`}>
              <div className="enr-sec-head">
                <div className="enr-sh-left">
                  <span className="enr-sh-title">報帳明細確認</span>
                  <span className="enr-sh-gray">勾選要送出的項目；未勾選自動存入草稿</span>
                </div>
              </div>
              <div className="enr-sec-body">
                <div className="enr-table-note">
                  PRD v4：草稿階段即產生正式流水號（例如 <b>MMA#00001</b>）。勾選項目所有 <b>*</b> 欄位須填完整，
                  缺漏時顯示提示且送出按鈕鎖定。
                </div>
                <div className="enr-rt-wrap">
                  <table className="enr-rt">
                    <thead>
                      <tr>
                        <th style={{ width: 28 }}>
                          <input
                            type="checkbox"
                            style={{ width: 11, height: 11 }}
                            aria-label="全選"
                            onChange={(e) => toggleAll(e.target.checked)}
                            disabled={!unlockSections}
                          />
                        </th>
                        <th style={{ width: 18 }} />
                        <th style={{ width: 88 }}>流水號</th>
                        <th style={{ width: 22 }}>收據</th>
                        <th style={{ width: 82 }}>單據日期 *</th>
                        <th style={{ width: 98 }}>發票號碼 *</th>
                        <th style={{ width: 80 }}>分類 *</th>
                        <th style={{ width: 68 }}>金額 *</th>
                        <th>摘要 *</th>
                        <th style={{ width: 42 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {uploads.map((u) => {
                        const isDraft = u.status === "err";
                        const complete = isRowComplete(u);
                        const checked = u.checked && !isDraft;
                        const showAlert =
                          !isDraft && u.checked && !complete;
                        const rowErr = checked && !complete;
                        return (
                          <tr
                            key={u.id}
                            className={`${isDraft ? "enr-draft-row" : ""} ${rowErr ? "enr-has-error" : ""}`}
                          >
                            <td>
                              <input
                                type="checkbox"
                                className="enr-rchk"
                                style={{ width: 11, height: 11 }}
                                checked={u.checked}
                                disabled={isDraft}
                                onChange={(e) => toggleRowCheck(u.id, e.target.checked)}
                              />
                            </td>
                            <td>
                              <div
                                className={`enr-alert-icon ${showAlert ? "enr-alert-icon--show" : ""}`}
                              >
                                <svg viewBox="0 0 9 9" fill="none" aria-hidden>
                                  <path
                                    d="M4.5 2v3M4.5 6.5v.5"
                                    stroke="white"
                                    strokeWidth="1.2"
                                    strokeLinecap="round"
                                  />
                                </svg>
                              </div>
                            </td>
                            <td>
                              <span className={`enr-temp-b ${isDraft ? "enr-temp-b-gray" : ""}`}>
                                {u.expenseNo ?? `MMA#${String(u.tmp).padStart(5, "0")}`}
                              </span>
                            </td>
                            <td>
                              <div
                                className="enr-thumb"
                                style={{
                                  background: isDraft
                                    ? "var(--color-background-secondary)"
                                    : "#EEEDFE"
                                }}
                              >
                                <svg
                                  width="10"
                                  height="10"
                                  viewBox="0 0 12 12"
                                  fill="none"
                                  aria-hidden
                                >
                                  <path
                                    d="M2 1h5L10 4v7H2V1z"
                                    stroke={isDraft ? "var(--color-text-tertiary)" : "#3C3489"}
                                    strokeWidth="1"
                                  />
                                </svg>
                              </div>
                            </td>
                            <td>
                              <input
                                className={dateFieldClass(u)}
                                value={u.date}
                                placeholder="YYYY/MM/DD"
                                onChange={(e) => patchUpload(u.id, "date", e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                className={u.inv === "" ? "enr-ef enr-ef-err" : "enr-ef"}
                                value={u.inv}
                                placeholder="發票號碼"
                                onChange={(e) => patchUpload(u.id, "inv", e.target.value)}
                              />
                            </td>
                            <td>
                              <select
                                className={u.cat === "" ? "enr-cs enr-cs-err" : "enr-cs"}
                                value={u.cat}
                                onChange={(e) => patchUpload(u.id, "cat", e.target.value)}
                              >
                                <option value="">— 請選擇 —</option>
                                {CATS.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                className={
                                  u.amt === 0 ? "enr-ef enr-ef-err" : "enr-ef"
                                }
                                value={u.amt || ""}
                                placeholder="0"
                                style={{ textAlign: "right" }}
                                onChange={(e) => patchUpload(u.id, "amt", e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                className={u.sum === "" ? "enr-ef enr-ef-err" : "enr-ef"}
                                value={u.sum}
                                placeholder={isDraft ? "請補填" : "必填"}
                                onChange={(e) => patchUpload(u.id, "sum", e.target.value)}
                              />
                            </td>
                            <td>
                              <button
                                type="button"
                                className="enr-btn-del"
                                onClick={() => removeUpload(u.id)}
                              >
                                刪除
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginBottom: 8 }}>
                  上傳收據後 AI 自動辨識並填入，可直接編輯修正
                </div>
                <div className="enr-sum-row">
                  <div className="enr-si">
                    <span className="enr-si-l">已勾選</span>
                    <span className="enr-si-v enr-si-v-ok">{stats.sel} 張</span>
                  </div>
                  <div className="enr-si">
                    <span className="enr-si-l">存入草稿</span>
                    <span className="enr-si-v enr-si-v-warn">{stats.draft} 張</span>
                  </div>
                  <div className="enr-si" style={{ marginLeft: "auto" }}>
                    <span className="enr-si-l">已勾選合計</span>
                    <span className="enr-si-v">NT$ {stats.sum.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={`enr-sec ${!unlockSections ? "enr-locked" : ""}`} id="enr-sec-bank">
              <div className="enr-sec-head">
                <div className="enr-sh-left">
                  <span className="enr-sh-title">收款帳戶</span>
                  {bankConfirmed ? (
                    <span className="enr-sh-ok">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                        <path
                          d="M2 5l2 2 4-4"
                          stroke="#27500A"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>{" "}
                      已確認
                    </span>
                  ) : (
                    <span className="enr-sh-tag">系統預填，可手動修改</span>
                  )}
                </div>
                <div>
                  {bankConfirmed && !bankEditing ? (
                    <button type="button" className="enr-btn-edit-sm" onClick={editBank}>
                      修改
                    </button>
                  ) : null}
                  {!bankConfirmed && !bankEditing ? (
                    <button type="button" className="enr-btn-confirm" onClick={confirmBank}>
                      確認帳戶資料
                    </button>
                  ) : null}
                  {bankEditing ? (
                    <>
                      <button type="button" className="enr-btn-confirm" onClick={confirmBank}>
                        確認修改
                      </button>
                      <button type="button" className="enr-btn-edit-sm" onClick={cancelEditBank}>
                        取消
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
              <div className="enr-sec-body">
                <div className="enr-fg3">
                  <div className="enr-field">
                    <label>
                      銀行名稱 <span className="enr-req">*</span>
                    </label>
                    <select
                      className="enr-sel"
                      value={bankCode}
                      onChange={(e) => setBankCode(e.target.value)}
                      disabled={bankConfirmed && !bankEditing}
                    >
                      <option value="">— 請選擇銀行 —</option>
                      {BANK_OPTIONS.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.code} {b.name}
                        </option>
                      ))}
                    </select>
                    <div className="enr-inp-hint">
                      代碼：{bankCode ? `${bankCode} ${BANK_OPTIONS.find((b) => b.code === bankCode)?.name ?? ""}` : "—"}
                    </div>
                  </div>
                  <div className="enr-field">
                    <label>
                      分行 <span className="enr-req">*</span>
                    </label>
                    <input
                      className="enr-inp"
                      value={bankBranch}
                      onChange={(e) => setBankBranch(e.target.value)}
                      list="enr-branch-list"
                      readOnly={bankConfirmed && !bankEditing}
                    />
                    <datalist id="enr-branch-list">
                      {BRANCH_SUGGESTIONS.map((b) => (
                        <option key={b} value={b} />
                      ))}
                    </datalist>
                  </div>
                  <div className="enr-field">
                    <label>
                      帳號 <span className="enr-req">*</span>
                    </label>
                    <input
                      className="enr-inp"
                      value={bankConfirmed && !bankEditing ? maskAccount(bankAccount) : bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      readOnly={bankConfirmed && !bankEditing}
                    />
                  </div>
                  <div className="enr-field">
                    <label>
                      戶名 <span className="enr-req">*</span>
                    </label>
                    <input
                      className="enr-inp"
                      value={bankHolder}
                      onChange={(e) => setBankHolder(e.target.value)}
                      readOnly={bankConfirmed && !bankEditing}
                    />
                  </div>
                </div>
                <div className="enr-bank-notice">
                  {bankEditing
                    ? "修改後請點「確認修改」儲存"
                    : bankConfirmed
                      ? "帳戶資料已確認，如需修改請點右上角「修改」"
                      : "預設從個人資料帶入，可於此直接修改，不影響個人資料頁的設定"}
                </div>
              </div>
            </div>

            <div className={`enr-sec ${!submitUnlocked ? "enr-locked" : ""}`} id="enr-sec-submit">
              <div className="enr-sec-head">
                <div className="enr-sh-left">
                  <span className="enr-sh-title">確認送出</span>
                  <span className="enr-sh-gray">送出後進入審核流程，如需修改須請審核者退件</span>
                </div>
              </div>
              <div className="enr-sec-body">
                <div className="enr-submit-card">
                  <div className="enr-submit-title">本次送出摘要</div>
                  <div className="enr-sdr">
                    <span className="enr-sd-l">申請人</span>
                    <span className="enr-sd-v">{applicant}</span>
                  </div>
                  <div className="enr-sdr">
                    <span className="enr-sd-l">所屬專案</span>
                    <span className="enr-sd-v">{project}</span>
                  </div>
                  <div className="enr-sdr">
                    <span className="enr-sd-l">送出張數（送出後產生正式流水號）</span>
                    <span className="enr-sd-v enr-sd-v-ok">{stats.sel} 張</span>
                  </div>
                  <div className="enr-sdr">
                    <span className="enr-sd-l">送出合計金額</span>
                    <span className="enr-sd-v">NT$ {stats.sum.toLocaleString()}</span>
                  </div>
                  <div className="enr-submit-note">
                    · 送出後系統自動產生正式流水號，申請進入製片審核流程
                    <br />
                    · 送出後申請人不可自行修改，如有錯誤需由審核者退件後才能重新編輯
                    <br />· 「全部存為草稿」將把所有收據存入草稿並切換至草稿頁面
                  </div>
                </div>
                <div className="enr-submit-acts">
                  <span
                    className={`enr-submit-blocked ${stats.showBlockedHint ? "enr-submit-blocked--show" : ""}`}
                  >
                    ⚠ 有勾選項目尚未填寫完整
                  </span>
                  <button type="button" className="enr-btn enr-btn-g" onClick={saveAllDraft}>
                    全部存為草稿
                  </button>
                  <button
                    type="button"
                    className="enr-btn enr-btn-p"
                    disabled={!stats.canSubmit}
                    onClick={() => void handleSubmit()}
                  >
                    確認送出申請 ↗
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="enr-draft-wrap">
          <div className="enr-draft-topbar">
            <Link to="/expenses" className="enr-draft-back">
              報帳系統
            </Link>
            <span className="enr-draft-title">牧馬專案 A</span>
            <button type="button" className="enr-btn enr-btn-p" onClick={() => setView("form")}>
              ＋ 新增報帳申請
            </button>
          </div>
          <div className="enr-draft-inner">
            <div className="enr-tab-row">
              <button type="button" className="enr-tab">
                全部申請 <span className="enr-tab-n">(12)</span>
              </button>
              <button type="button" className="enr-tab">
                我的申請 <span className="enr-tab-n">(4)</span>
              </button>
              <button type="button" className="enr-tab">
                待我審核 <span className="enr-tab-n enr-tab-n-warn">(3)</span>
              </button>
              <button type="button" className="enr-tab enr-tab-active">
                草稿 <span className="enr-tab-n enr-tab-n-draft">(12)</span>
              </button>
            </div>
            <div className="enr-draft-body">
              <div className="enr-dt-header">
                <div>
                  <div className="enr-dt-title">草稿收據清單</div>
                  <div className="enr-dt-sub">
                    補填完成後勾選並點「送出選取」，或點各列「編輯」進入完整表單
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" className="enr-btn-sm">
                    刪除選取
                  </button>
                  <button type="button" className="enr-btn-sm enr-btn-sm-p">
                    送出選取 ↗
                  </button>
                </div>
              </div>
              <div className="enr-list-wrap">
                <table className="enr-lt">
                  <thead>
                    <tr>
                      <th style={{ width: 28 }}>
                        <input type="checkbox" style={{ width: 11, height: 11 }} aria-label="全選" />
                      </th>
                      <th style={{ width: 70 }}>草稿編號</th>
                      <th style={{ width: 78 }}>建立日期</th>
                      <th style={{ width: 88 }}>發票號碼</th>
                      <th style={{ width: 68 }}>分類</th>
                      <th style={{ width: 68 }}>金額</th>
                      <th style={{ width: 88 }}>摘要</th>
                      <th style={{ width: 70 }}>狀態</th>
                      <th style={{ width: 48 }} />
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <input type="checkbox" style={{ width: 11, height: 11 }} />
                      </td>
                      <td>
                        <span className="enr-sn-am">MMA#00001</span>
                      </td>
                      <td style={{ color: "var(--color-text-tertiary)" }}>2026/04/25</td>
                      <td>AB-12345678</td>
                      <td>交通費</td>
                      <td style={{ textAlign: "right", fontWeight: 500 }}>NT$ 3,500</td>
                      <td>勘景交通補貼</td>
                      <td>
                        <span className="enr-bd-ok">可送出</span>
                      </td>
                      <td>
                        <button type="button" className="enr-btn-sm" onClick={() => setView("form")}>
                          編輯
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <input type="checkbox" style={{ width: 11, height: 11 }} />
                      </td>
                      <td>
                        <span className="enr-sn-am">MMA#00002</span>
                      </td>
                      <td style={{ color: "var(--color-text-tertiary)" }}>2026/04/25</td>
                      <td>BC-23456789</td>
                      <td>餐費</td>
                      <td style={{ textAlign: "right", fontWeight: 500 }}>NT$ 1,200</td>
                      <td style={{ color: "#A32D2D" }}>未填寫</td>
                      <td>
                        <span className="enr-bd-err">摘要缺漏</span>
                      </td>
                      <td>
                        <button type="button" className="enr-btn-sm" onClick={() => setView("form")}>
                          編輯
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <input type="checkbox" style={{ width: 11, height: 11 }} />
                      </td>
                      <td>
                        <span className="enr-sn-am">MMA#00003</span>
                      </td>
                      <td style={{ color: "var(--color-text-tertiary)" }}>2026/04/25</td>
                      <td>CD-34567890</td>
                      <td>道具費</td>
                      <td style={{ textAlign: "right", fontWeight: 500 }}>NT$ 8,800</td>
                      <td>場景道具租借</td>
                      <td>
                        <span className="enr-bd-warn">日期待確認</span>
                      </td>
                      <td>
                        <button type="button" className="enr-btn-sm" onClick={() => setView("form")}>
                          編輯
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <input type="checkbox" style={{ width: 11, height: 11 }} />
                      </td>
                      <td>
                        <span className="enr-sn-am">MMA#00004</span>
                      </td>
                      <td style={{ color: "var(--color-text-tertiary)" }}>2026/04/25</td>
                      <td style={{ color: "#A32D2D" }}>辨識失敗</td>
                      <td style={{ color: "#A32D2D" }}>—</td>
                      <td style={{ color: "#A32D2D", textAlign: "right" }}>—</td>
                      <td style={{ color: "#A32D2D" }}>—</td>
                      <td>
                        <span className="enr-bd-err">需補填</span>
                      </td>
                      <td>
                        <button type="button" className="enr-btn-sm" onClick={() => setView("form")}>
                          編輯
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <input type="checkbox" style={{ width: 11, height: 11 }} />
                      </td>
                      <td>
                        <span className="enr-sn-am">MMA#00005</span>
                      </td>
                      <td style={{ color: "var(--color-text-tertiary)" }}>2026/04/20</td>
                      <td>EF-99887766</td>
                      <td>後製費</td>
                      <td style={{ textAlign: "right", fontWeight: 500 }}>NT$ 5,400</td>
                      <td>剪接外包費</td>
                      <td>
                        <span className="enr-bd-ok">可送出</span>
                      </td>
                      <td>
                        <button type="button" className="enr-btn-sm" onClick={() => setView("form")}>
                          編輯
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
