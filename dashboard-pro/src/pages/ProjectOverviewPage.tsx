import { useEffect, useMemo, useState } from "react";

type Role = "applicant" | "manager" | "finance";
type IncomeStatus = "receivable" | "received";

type ProjectInfo = {
  name: string;
  client: string;
  company: string;
  code: string;
  start: string;
  end: string;
  owner: string;
  status: "進行中" | "暫停" | "已結案";
};

type IncomeRow = {
  name: string;
  status: IncomeStatus;
  receivable: number;
  received: number;
  planDate: string;
  realDate: string;
  note: string;
};

type ExpenseRow = {
  category: string;
  bAdv: number;
  uAdv: number;
  bCash: number;
  uCash: number;
};

type Member = { name: string; email: string };

const formatCurrency = (v: number) => `NT$ ${v.toLocaleString()}`;
const STORAGE_KEYS = {
  info: "project-overview-info-v1",
  incomes: "project-overview-incomes-v1",
  expenses: "project-overview-expenses-v1",
  perms: "project-overview-perms-v1"
};

const defaultInfo: ProjectInfo = {
  name: "牧馬專案 A",
  client: "中華電信",
  company: "牧馬影視製作",
  code: "MMA",
  start: "2026/03/01",
  end: "2026/06/30",
  owner: "Patrick Lin",
  status: "進行中"
};

const defaultIncomeRows: IncomeRow[] = [
  {
    name: "合約費用（第一期）",
    status: "received",
    receivable: 500000,
    received: 500000,
    planDate: "2026-04-01",
    realDate: "2026-04-03",
    note: "已入帳"
  },
  {
    name: "合約費用（第二期）",
    status: "receivable",
    receivable: 250000,
    received: 0,
    planDate: "2026-06-01",
    realDate: "",
    note: ""
  },
  {
    name: "製作補助",
    status: "receivable",
    receivable: 50000,
    received: 0,
    planDate: "2026-07-01",
    realDate: "",
    note: "文化部補助"
  }
];

const defaultExpenseRows: ExpenseRow[] = [
  { category: "人員費用", bAdv: 150000, uAdv: 98000, bCash: 50000, uCash: 12000 },
  { category: "器材費用", bAdv: 80000, uAdv: 60000, bCash: 20000, uCash: 12000 },
  { category: "交通費用", bAdv: 30000, uAdv: 18500, bCash: 20000, uCash: 10000 },
  { category: "餐飲費用", bAdv: 15000, uAdv: 10000, bCash: 15000, uCash: 8000 }
];

const defaultPerm = {
  managers: [{ name: "Jenny Chen", email: "jenny@muyma.com" }],
  producers: [{ name: "Patrick Lin", email: "patrick@muyma.com" }],
  treasuries: [{ name: "Stella Wu", email: "stella@muyma.com" }],
  finance: [{ name: "Kevin Liu", email: "kevin@muyma.com" }],
  team: [
    { name: "Eric Wang", email: "eric@muyma.com" },
    { name: "Amy Chen", email: "amy@muyma.com" },
    { name: "Jason Huang", email: "jason@muyma.com" }
  ]
};

export function ProjectOverviewPage() {
  function loadStored<T>(key: string, fallback: T): T {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  const [role, setRole] = useState<Role>("manager");
  const isManager = role === "manager";
  const isFinance = role === "manager" || role === "finance";

  const [info, setInfo] = useState<ProjectInfo>(() => loadStored(STORAGE_KEYS.info, defaultInfo));
  const [infoDraft, setInfoDraft] = useState<ProjectInfo>(info);
  const [editingInfo, setEditingInfo] = useState(false);

  const [incomeRows, setIncomeRows] = useState<IncomeRow[]>(() => loadStored(STORAGE_KEYS.incomes, defaultIncomeRows));
  const [incomeDraft, setIncomeDraft] = useState<IncomeRow[]>(incomeRows);
  const [incomeHistory, setIncomeHistory] = useState<IncomeRow[][]>([]);
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeError, setIncomeError] = useState("");

  const [expenseRows, setExpenseRows] = useState<ExpenseRow[]>(() => loadStored(STORAGE_KEYS.expenses, defaultExpenseRows));
  const [expenseDraft, setExpenseDraft] = useState<ExpenseRow[]>(expenseRows);
  const [expenseHistory, setExpenseHistory] = useState<ExpenseRow[][]>([]);
  const [editingExpense, setEditingExpense] = useState(false);

  const candidateMembers: Member[] = [
    { name: "Chloe Lin", email: "chloe@muyma.com" },
    { name: "David Wu", email: "david@muyma.com" },
    { name: "Fiona Chang", email: "fiona@muyma.com" }
  ];

  const [permEditing, setPermEditing] = useState(false);
  const [perm, setPerm] = useState(() => loadStored(STORAGE_KEYS.perms, defaultPerm));
  const [permDraft, setPermDraft] = useState(perm);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.info, JSON.stringify(info));
  }, [info]);
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.incomes, JSON.stringify(incomeRows));
  }, [incomeRows]);
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(expenseRows));
  }, [expenseRows]);
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.perms, JSON.stringify(perm));
  }, [perm]);

  const summary = useMemo(() => {
    const receivable = incomeRows.reduce((s, x) => s + x.receivable, 0);
    const received = incomeRows.reduce((s, x) => s + x.received, 0);
    const budget = expenseRows.reduce((s, x) => s + x.bAdv + x.bCash, 0);
    const used = expenseRows.reduce((s, x) => s + x.uAdv + x.uCash, 0);
    return {
      receivable,
      received,
      unreceived: receivable - received,
      budget,
      used,
      actual: received - used,
      estimated: receivable - budget
    };
  }, [incomeRows, expenseRows]);

  function beginIncomeEdit() {
    setIncomeHistory([]);
    setIncomeDraft(incomeRows);
    setEditingIncome(true);
    setIncomeError("");
  }

  function saveIncome() {
    const bad = incomeDraft.some((x) => x.status === "received" && !x.realDate);
    if (bad) {
      setIncomeError("狀態為「已收」的項目必須填入實際入帳日");
      return;
    }
    setIncomeRows(incomeDraft);
    setEditingIncome(false);
    setIncomeError("");
  }

  function beginExpenseEdit() {
    setExpenseHistory([]);
    setExpenseDraft(expenseRows);
    setEditingExpense(true);
  }

  return (
    <section className="po-page">
      <div className="po-topbar">
        <span className="po-breadcrumb">報帳系統</span>
        <span className="po-sep">/</span>
        <span className="po-title">牧馬專案 A</span>
      </div>

      <div className="po-rolebar">
        <span>Mockup 角色切換：</span>
        <button className={role === "applicant" ? "po-role-btn po-role-btn-sel" : "po-role-btn"} onClick={() => setRole("applicant")}>申請人</button>
        <button className={role === "manager" ? "po-role-btn po-role-btn-sel" : "po-role-btn"} onClick={() => setRole("manager")}>管理人 / 製片</button>
        <button className={role === "finance" ? "po-role-btn po-role-btn-sel" : "po-role-btn"} onClick={() => setRole("finance")}>收支審核人員</button>
      </div>

      <div className="po-content">
        <article className="po-sec">
          <div className="po-sec-head">
            <span className="po-sec-title">專案基本資訊</span>
            <span className="badge badge-green">進行中</span>
            {isManager ? (
              <button
                className="po-btn po-btn-ghost"
                onClick={() => {
                  if (editingInfo) {
                    setEditingInfo(false);
                    setInfoDraft(info);
                  } else {
                    setEditingInfo(true);
                    setInfoDraft(info);
                  }
                }}
              >
                {editingInfo ? "取消" : "編輯"}
              </button>
            ) : null}
          </div>
          <div className="po-sec-body">
            <div className="po-info-grid">
              {editingInfo ? (
                <>
                  <div className="po-if"><label>專案名稱</label><input className="bi" value={infoDraft.name} onChange={(e) => setInfoDraft({ ...infoDraft, name: e.target.value })} /></div>
                  <div className="po-if"><label>客戶</label><input className="bi" value={infoDraft.client} onChange={(e) => setInfoDraft({ ...infoDraft, client: e.target.value })} /></div>
                  <div className="po-if"><label>所屬公司</label><input className="bi" value={infoDraft.company} onChange={(e) => setInfoDraft({ ...infoDraft, company: e.target.value })} /></div>
                  <div className="po-if"><label>專案簡碼</label><input className="bi" value={infoDraft.code} onChange={(e) => setInfoDraft({ ...infoDraft, code: e.target.value })} /></div>
                  <div className="po-if"><label>開始日期</label><input className="bi" value={infoDraft.start} onChange={(e) => setInfoDraft({ ...infoDraft, start: e.target.value })} /></div>
                  <div className="po-if"><label>預計結束</label><input className="bi" value={infoDraft.end} onChange={(e) => setInfoDraft({ ...infoDraft, end: e.target.value })} /></div>
                  <div className="po-if"><label>負責人</label><input className="bi" value={infoDraft.owner} onChange={(e) => setInfoDraft({ ...infoDraft, owner: e.target.value })} /></div>
                  <div className="po-if"><label>狀態</label>
                    <select className="bi" value={infoDraft.status} onChange={(e) => setInfoDraft({ ...infoDraft, status: e.target.value as ProjectInfo["status"] })}>
                      <option>進行中</option><option>暫停</option><option>已結案</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="po-if"><label>專案名稱</label><div>{info.name}</div></div>
                  <div className="po-if"><label>客戶</label><div>{info.client}</div></div>
                  <div className="po-if"><label>所屬公司</label><div>{info.company}</div></div>
                  <div className="po-if"><label>專案簡碼</label><div className="po-mono">{info.code}</div></div>
                  <div className="po-if"><label>開始日期</label><div>{info.start}</div></div>
                  <div className="po-if"><label>預計結束</label><div>{info.end}</div></div>
                  <div className="po-if"><label>負責人</label><div>{info.owner}</div></div>
                  <div className="po-if"><label>狀態</label><div>{info.status}</div></div>
                </>
              )}
            </div>
            {editingInfo ? (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10, gap: 8 }}>
                <button className="po-btn po-btn-ghost" onClick={() => { setEditingInfo(false); setInfoDraft(info); }}>取消</button>
                <button className="po-btn" onClick={() => { setInfo(infoDraft); setEditingInfo(false); }}>儲存</button>
              </div>
            ) : null}
          </div>
        </article>

        <article className="po-sec">
          <div className="po-sec-head">
            <span className="po-sec-title">費用總覽</span>
            <span className="po-sec-sub">
              收支審核：<b>Kevin Liu</b>
            </span>
          </div>
          <div className="po-sec-body">
            <div className="po-fin-grid">
              <div className="po-fin-card po-fin-income">
                <div className="po-fin-label">預估收入</div>
                <div className="po-fin-main">{formatCurrency(summary.receivable)}</div>
                <div className="po-fin-sub">已收 {formatCurrency(summary.received)}</div>
                <div className="po-fin-sub">未收 {formatCurrency(summary.unreceived)}</div>
              </div>
              <div className="po-fin-card po-fin-expense">
                <div className="po-fin-label">預計支出</div>
                <div className="po-fin-main">{formatCurrency(summary.budget)}</div>
                <div className="po-fin-sub">實際已用 {formatCurrency(summary.used)}</div>
              </div>
              <div className="po-fin-card po-fin-margin">
                <div className="po-fin-label">目前盈餘</div>
                <div className="po-fin-main">{formatCurrency(summary.actual)}</div>
                <div className="po-fin-sub">預估 {formatCurrency(summary.estimated)}</div>
              </div>
            </div>

            <div className="po-table-block">
              <div className="po-row-head">
                <span>收入明細</span>
                {isFinance ? !editingIncome ? (
                  <button className="po-btn po-btn-ghost" onClick={beginIncomeEdit}>編輯</button>
                ) : (
                  <>
                    <button className="po-btn po-btn-ghost" disabled={!incomeHistory.length} onClick={() => {
                      const next = [...incomeHistory];
                      const prev = next.pop();
                      if (!prev) return;
                      setIncomeDraft(prev);
                      setIncomeHistory(next);
                    }}>還原</button>
                    <button className="po-btn po-btn-ghost" onClick={() => {
                      setIncomeHistory((h) => [...h, structuredClone(incomeDraft)]);
                      setIncomeDraft([...incomeDraft, { name: "", status: "receivable", receivable: 0, received: 0, planDate: "", realDate: "", note: "" }]);
                    }}>＋ 新增</button>
                    <button className="po-btn" onClick={saveIncome}>儲存</button>
                    <button className="po-btn po-btn-ghost" onClick={() => { setEditingIncome(false); setIncomeDraft(incomeRows); setIncomeError(""); }}>取消</button>
                  </>
                ) : null}
              </div>
              {incomeError ? <div style={{ color: "#791F1F", fontSize: 11, marginBottom: 6 }}>{incomeError}</div> : null}
              <table className="po-table">
                <thead>
                  <tr>
                    <th>項目名稱</th><th>狀態</th><th>應收金額</th><th>已收金額</th><th>預計入帳日</th><th>實際入帳日</th><th>備註</th>
                    {editingIncome ? <th /> : null}
                  </tr>
                </thead>
                <tbody>
                  {(editingIncome ? incomeDraft : incomeRows).map((r, i) => (
                    <tr key={`${r.name}-${i}`}>
                      <td>{editingIncome ? <input className="bi" value={r.name} onChange={(e) => {
                        setIncomeHistory((h) => [...h, structuredClone(incomeDraft)]);
                        setIncomeDraft(incomeDraft.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)));
                      }} /> : r.name}</td>
                      <td>{editingIncome ? (
                        <select className="bi" value={r.status} onChange={(e) => {
                          const nextStatus = e.target.value as IncomeStatus;
                          setIncomeHistory((h) => [...h, structuredClone(incomeDraft)]);
                          setIncomeDraft(incomeDraft.map((x, idx) => idx === i ? { ...x, status: nextStatus, received: nextStatus === "received" ? x.receivable : 0 } : x));
                        }}>
                          <option value="receivable">應收</option>
                          <option value="received">已收</option>
                        </select>
                      ) : <span className={`badge ${r.status === "received" ? "badge-green" : "badge-blue"}`}>{r.status === "received" ? "已收" : "應收"}</span>}</td>
                      <td>{editingIncome ? <input className="bi" type="number" value={r.receivable} onChange={(e) => {
                        const value = Number(e.target.value);
                        setIncomeHistory((h) => [...h, structuredClone(incomeDraft)]);
                        setIncomeDraft(incomeDraft.map((x, idx) => idx === i ? { ...x, receivable: value, received: x.status === "received" ? value : x.received } : x));
                      }} /> : formatCurrency(r.receivable)}</td>
                      <td>{editingIncome ? <input className="bi" type="number" value={r.received} onChange={(e) => {
                        const value = Number(e.target.value);
                        setIncomeHistory((h) => [...h, structuredClone(incomeDraft)]);
                        setIncomeDraft(incomeDraft.map((x, idx) => (idx === i ? { ...x, received: value } : x)));
                      }} /> : (r.received ? formatCurrency(r.received) : "—")}</td>
                      <td>{editingIncome ? <input className="bi" type="date" value={r.planDate} onChange={(e) => {
                        setIncomeHistory((h) => [...h, structuredClone(incomeDraft)]);
                        setIncomeDraft(incomeDraft.map((x, idx) => (idx === i ? { ...x, planDate: e.target.value } : x)));
                      }} /> : (r.planDate || "—")}</td>
                      <td>{editingIncome ? <input className="bi" type="date" value={r.realDate} onChange={(e) => {
                        setIncomeHistory((h) => [...h, structuredClone(incomeDraft)]);
                        setIncomeDraft(incomeDraft.map((x, idx) => (idx === i ? { ...x, realDate: e.target.value } : x)));
                      }} /> : (r.realDate || "—")}</td>
                      <td>{editingIncome ? <input className="bi" value={r.note} onChange={(e) => {
                        setIncomeHistory((h) => [...h, structuredClone(incomeDraft)]);
                        setIncomeDraft(incomeDraft.map((x, idx) => (idx === i ? { ...x, note: e.target.value } : x)));
                      }} /> : (r.note || "—")}</td>
                      {editingIncome ? <td><button className="po-btn po-btn-ghost" onClick={() => {
                        setIncomeHistory((h) => [...h, structuredClone(incomeDraft)]);
                        setIncomeDraft(incomeDraft.filter((_, idx) => idx !== i));
                      }}>刪除</button></td> : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="po-table-block">
              <div className="po-row-head">
                <span>支出明細（依費用分類）</span>
                {isFinance ? !editingExpense ? (
                  <button className="po-btn po-btn-ghost" onClick={beginExpenseEdit}>編輯</button>
                ) : (
                  <>
                    <button className="po-btn po-btn-ghost" disabled={!expenseHistory.length} onClick={() => {
                      const next = [...expenseHistory];
                      const prev = next.pop();
                      if (!prev) return;
                      setExpenseDraft(prev);
                      setExpenseHistory(next);
                    }}>還原</button>
                    <button className="po-btn" onClick={() => { setExpenseRows(expenseDraft); setEditingExpense(false); }}>儲存</button>
                    <button className="po-btn po-btn-ghost" onClick={() => { setEditingExpense(false); setExpenseDraft(expenseRows); }}>取消</button>
                  </>
                ) : null}
              </div>
              <table className="po-table">
                <thead>
                  <tr>
                    <th>費用分類</th><th>類型</th><th>預算</th><th>已用</th><th>剩餘</th><th>使用率</th>
                  </tr>
                </thead>
                <tbody>
                  {(editingExpense ? expenseDraft : expenseRows).map((r, i) => {
                    const pAdv = r.bAdv ? Math.round((r.uAdv / r.bAdv) * 100) : 0;
                    const pCash = r.bCash ? Math.round((r.uCash / r.bCash) * 100) : 0;
                    return (
                      <tr key={r.category}>
                        <td>{r.category}</td>
                        <td>墊付金 / 現金</td>
                        <td>
                          {editingExpense ? (
                            <div style={{ display: "flex", gap: 6 }}>
                              <input className="bi" type="number" value={r.bAdv} onChange={(e) => {
                                const value = Number(e.target.value);
                                setExpenseHistory((h) => [...h, structuredClone(expenseDraft)]);
                                setExpenseDraft(expenseDraft.map((x, idx) => (idx === i ? { ...x, bAdv: value } : x)));
                              }} />
                              <input className="bi" type="number" value={r.bCash} onChange={(e) => {
                                const value = Number(e.target.value);
                                setExpenseHistory((h) => [...h, structuredClone(expenseDraft)]);
                                setExpenseDraft(expenseDraft.map((x, idx) => (idx === i ? { ...x, bCash: value } : x)));
                              }} />
                            </div>
                          ) : `${formatCurrency(r.bAdv)} / ${formatCurrency(r.bCash)}`}
                        </td>
                        <td>{formatCurrency(r.uAdv + r.uCash)}</td>
                        <td>{formatCurrency(r.bAdv + r.bCash - r.uAdv - r.uCash)}</td>
                        <td>{Math.round((pAdv + pCash) / 2)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </article>

        <article className="po-sec">
          <div className="po-sec-head">
            <span className="po-sec-title">權限設定</span>
            <span className="po-sec-sub">各角色可設定多位</span>
            {isManager ? (
              <button className="po-btn po-btn-ghost" onClick={() => {
                if (permEditing) {
                  setPermEditing(false);
                  setPermDraft(perm);
                } else {
                  setPermEditing(true);
                  setPermDraft(perm);
                }
              }}>
                {permEditing ? "取消" : "編輯"}
              </button>
            ) : null}
          </div>
          <div className="po-sec-body">
            <div className="po-perm-grid">
              {[
                ["管理人", "managers"],
                ["製片審核", "producers"],
                ["出納審核", "treasuries"]
              ].map(([title, key]) => (
                <div className="po-perm-card" key={key}>
                  <div className="po-perm-head">{title}</div>
                  <div className="po-perm-body">
                    {(permEditing ? permDraft : perm)[key as keyof typeof perm].map((m) => (
                      <div key={`${m.name}-${m.email}`} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span>{m.name}</span>
                        {permEditing ? (
                          <button className="po-btn po-btn-ghost" onClick={() => {
                            setPermDraft((p) => ({
                              ...p,
                              [key]: p[key as keyof typeof p].filter((x) => x.email !== m.email)
                            }));
                          }}>移除</button>
                        ) : null}
                      </div>
                    ))}
                    {permEditing ? (
                      <select className="bi" onChange={(e) => {
                        const found = candidateMembers.find((x) => x.email === e.target.value);
                        if (!found) return;
                        setPermDraft((p) => ({
                          ...p,
                          [key]: [...p[key as keyof typeof p], found]
                        }));
                        e.currentTarget.value = "";
                      }}>
                        <option value="">＋ 新增成員</option>
                        {candidateMembers.map((m) => <option key={m.email} value={m.email}>{m.name}</option>)}
                      </select>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            <div className="po-perm-grid po-perm-grid-bottom">
              {[
                ["專案收支審核", "finance"],
                ["團隊成員維護", "team"]
              ].map(([title, key]) => (
                <div className="po-perm-card" key={key}>
                  <div className="po-perm-head">{title}</div>
                  <div className="po-perm-body">
                    {(permEditing ? permDraft : perm)[key as keyof typeof perm].map((m) => (
                      <div key={`${m.name}-${m.email}`} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span>{m.name}</span>
                        {permEditing ? (
                          <button className="po-btn po-btn-ghost" onClick={() => {
                            setPermDraft((p) => ({
                              ...p,
                              [key]: p[key as keyof typeof p].filter((x) => x.email !== m.email)
                            }));
                          }}>移除</button>
                        ) : null}
                      </div>
                    ))}
                    {permEditing ? (
                      <select className="bi" onChange={(e) => {
                        const found = candidateMembers.find((x) => x.email === e.target.value);
                        if (!found) return;
                        setPermDraft((p) => ({
                          ...p,
                          [key]: [...p[key as keyof typeof p], found]
                        }));
                        e.currentTarget.value = "";
                      }}>
                        <option value="">＋ 新增成員</option>
                        {candidateMembers.map((m) => <option key={m.email} value={m.email}>{m.name}</option>)}
                      </select>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            {permEditing ? (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10, gap: 8 }}>
                <button className="po-btn po-btn-ghost" onClick={() => { setPermEditing(false); setPermDraft(perm); }}>取消</button>
                <button className="po-btn" onClick={() => { setPerm(permDraft); setPermEditing(false); }}>儲存</button>
              </div>
            ) : null}
          </div>
        </article>
      </div>
    </section>
  );
}
