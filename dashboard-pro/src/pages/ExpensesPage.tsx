import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { deleteRequest, listRequests, updateStatus } from "../mockApi";
import type { ExpenseRequest, Role, RequestStatus } from "../types";

const statusText: Record<RequestStatus, string> = {
  draft: "草稿",
  producer_review: "製片審核中",
  treasury_review: "出納審核中",
  awaiting_physical_receipts: "待收實體單據",
  payment_pending: "待匯款",
  rejected: "已退件",
  cancelled: "已取消",
  closed: "已結案"
};

const statusBadge: Record<RequestStatus, string> = {
  draft: "badge badge-gray",
  producer_review: "badge badge-amber",
  treasury_review: "badge badge-blue",
  awaiting_physical_receipts: "badge badge-purple",
  payment_pending: "badge badge-blue",
  rejected: "badge badge-red",
  cancelled: "badge badge-gray",
  closed: "badge badge-green"
};

type TabKey = "all" | "mine" | "todo" | "draft";

export function ExpensesPage({ role }: { role: Role }) {
  const [rows, setRows] = useState<ExpenseRequest[]>([]);
  const [keyword, setKeyword] = useState("");
  const [tab, setTab] = useState<TabKey>("all");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const currentUserName = "Gillian Lin";

  async function reload() {
    setRows(await listRequests());
  }

  useEffect(() => {
    void reload();
  }, []);

  const canApproveProducer = role === "producer" || role === "admin";
  const canApproveTreasury = role === "treasury" || role === "admin";
  const canManageAsOwner = role === "admin";

  const keywordFiltered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) return rows;
    return rows.filter(
      (r) =>
        r.requestNo.toLowerCase().includes(k) ||
        r.applicant.toLowerCase().includes(k) ||
        r.project.toLowerCase().includes(k)
    );
  }, [keyword, rows]);

  const tabFiltered = useMemo(() => {
    if (tab === "draft") return keywordFiltered.filter((r) => r.status === "draft");
    if (tab === "mine") return keywordFiltered.filter((r) => r.applicant === currentUserName);
    if (tab === "todo") {
      if (role === "producer") return keywordFiltered.filter((r) => r.status === "producer_review");
      if (role === "treasury")
        return keywordFiltered.filter(
          (r) =>
            r.status === "treasury_review" ||
            r.status === "awaiting_physical_receipts" ||
            r.status === "payment_pending"
        );
      if (role === "admin")
        return keywordFiltered.filter(
          (r) =>
            r.status === "producer_review" ||
            r.status === "treasury_review" ||
            r.status === "awaiting_physical_receipts" ||
            r.status === "payment_pending"
        );
      return [];
    }
    return keywordFiltered;
  }, [currentUserName, keywordFiltered, role, tab]);

  const tabCounts = useMemo(() => {
    const all = rows.length;
    const draft = rows.filter((r) => r.status === "draft").length;
    const mine = rows.filter((r) => r.applicant === currentUserName).length;
    const todo =
      role === "producer"
        ? rows.filter((r) => r.status === "producer_review").length
        : role === "treasury"
          ? rows.filter(
              (r) =>
                r.status === "treasury_review" ||
                r.status === "awaiting_physical_receipts" ||
                r.status === "payment_pending"
            ).length
          : role === "admin"
            ? rows.filter(
                (r) =>
                  r.status === "producer_review" ||
                  r.status === "treasury_review" ||
                  r.status === "awaiting_physical_receipts" ||
                  r.status === "payment_pending"
              ).length
            : 0;
    return { all, mine, todo, draft };
  }, [currentUserName, role, rows]);

  async function doUpdate(id: string, next: RequestStatus) {
    await updateStatus(id, next);
    await reload();
  }

  const selectedIds = useMemo(() => Object.keys(selected).filter((k) => selected[k]), [selected]);

  return (
    <section className="exp-page">
      <div className="flow-card">
        <div className="flow-card-title">📋 報帳審核流程說明</div>
        <div className="flow-rows">
          <div className="flow-row">
            <span className="fl-label blue">墊付款結餘</span>
            <span className="fl-node fn-start">報帳申請</span>
            <span className="fl-arrow">›</span>
            <span className="fl-node fn-plain">審核-製片</span>
            <span className="fl-arrow">›</span>
            <span className="fl-node fn-key-blue">結餘退回</span>
            <span className="fl-arrow">›</span>
            <span className="fl-node fn-plain">審核-出納</span>
            <span className="fl-arrow">›</span>
            <span className="fl-node fn-end">已結案</span>
          </div>
          <div className="flow-row">
            <span className="fl-label green">墊付款報銷</span>
            <span className="fl-node fn-start">報帳申請</span>
            <span className="fl-arrow">›</span>
            <span className="fl-node fn-plain">審核-製片</span>
            <span className="fl-arrow">›</span>
            <span className="fl-node fn-key-green">墊付款報銷</span>
            <span className="fl-arrow">›</span>
            <span className="fl-node fn-plain">審核-出納</span>
            <span className="fl-arrow">›</span>
            <span className="fl-node fn-plain">待收實體單據</span>
            <span className="fl-arrow">›</span>
            <span className="fl-node fn-end">已結案</span>
          </div>
          <div className="flow-row">
            <span className="fl-label amber">墊付款超支</span>
            <span className="fl-node fn-start">報帳申請</span>
            <span className="fl-arrow">›</span>
            <span className="fl-node fn-plain">審核-製片</span>
            <span className="fl-arrow">›</span>
            <span className="fl-node fn-key-amber">墊付款超支</span>
            <span className="fl-arrow">›</span>
            <span className="fl-node fn-plain">審核-出納</span>
            <span className="fl-arrow">›</span>
            <span className="fl-node fn-plain">待收實體單據</span>
            <span className="fl-arrow">›</span>
            <span className="fl-node fn-plain">待匯款</span>
            <span className="fl-arrow">›</span>
            <span className="fl-node fn-end">已結案</span>
          </div>
          <div className="flow-row">
            <span className="fl-label purple">未付款</span>
            <span className="fl-node fn-start">報帳申請</span>
            <span className="fl-arrow">›</span>
            <span className="fl-node fn-plain">審核-製片</span>
            <span className="fl-arrow">›</span>
            <span className="fl-node fn-key-purple">未付款</span>
            <span className="fl-arrow">›</span>
            <span className="fl-node fn-plain">審核-出納</span>
            <span className="fl-arrow">›</span>
            <span className="fl-node fn-plain">待收實體單據</span>
            <span className="fl-arrow">›</span>
            <span className="fl-node fn-plain">待匯款</span>
            <span className="fl-arrow">›</span>
            <span className="fl-node fn-end">已結案</span>
          </div>
        </div>
      </div>

      <div className="exp-head">
        <div>
          <div className="exp-title">報帳系統總表</div>
          <div className="exp-sub">全部申請 / 我的申請 / 待我審核 / 草稿</div>
        </div>
      </div>

      <div className="exp-tabs">
        <button className={tab === "all" ? "exp-tab active" : "exp-tab"} onClick={() => setTab("all")}>
          全部申請 <span className="exp-count">{tabCounts.all}</span>
        </button>
        <button className={tab === "mine" ? "exp-tab active" : "exp-tab"} onClick={() => setTab("mine")}>
          我的申請 <span className="exp-count">{tabCounts.mine}</span>
        </button>
        <button className={tab === "todo" ? "exp-tab active" : "exp-tab"} onClick={() => setTab("todo")}>
          待我審核 <span className="exp-count exp-count-red">{tabCounts.todo}</span>
        </button>
        <button className={tab === "draft" ? "exp-tab active" : "exp-tab"} onClick={() => setTab("draft")}>
          草稿 <span className="exp-count exp-count-amber">{tabCounts.draft}</span>
        </button>
      </div>

      <div className="table-toolbar">
        <div className="search-box">
          🔍
          <input
            placeholder="搜尋請款單編號、專案、請款人…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <button className="filter-btn" onClick={() => alert("🔽 篩選功能開發中")}>
          ⚙ 篩選
        </button>
        <button className="filter-btn" onClick={() => alert(`📥 匯出中…（已選 ${selectedIds.length} 筆）`)}>
          📥 匯出 Excel
        </button>
      </div>

      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  className="cb"
                  checked={tabFiltered.length > 0 && tabFiltered.every((r) => selected[r.id])}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSelected((s) => {
                      const next = { ...s };
                      tabFiltered.forEach((r) => {
                        next[r.id] = checked;
                      });
                      return next;
                    });
                  }}
                />
              </th>
              <th>請款單編號</th>
              <th>專案名稱</th>
              <th>請款人</th>
              <th>分類</th>
              <th>金額</th>
              <th>狀態</th>
              <th>更新時間</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {tabFiltered.map((r) => (
              <tr key={r.id}>
                <td>
                  <input
                    type="checkbox"
                    className="cb"
                    checked={!!selected[r.id]}
                    onChange={(e) => setSelected((s) => ({ ...s, [r.id]: e.target.checked }))}
                  />
                </td>
                <td className="serial-code">
                  <Link to={`/expenses/${r.id}`}>{r.requestNo}</Link>
                </td>
                <td>{r.project}</td>
                <td>{r.applicant}</td>
                <td>
                  <span className="tag">{r.category}</span>
                </td>
                <td className="amount">NT$ {r.amount.toLocaleString()}</td>
                <td>
                  <span className={statusBadge[r.status]}>● {statusText[r.status]}</span>
                </td>
                <td style={{ color: "var(--color-text-tertiary)", fontSize: 12 }}>{r.updatedAt}</td>
                <td>
                  <div className="exp-actions">
                    <button className="action-btn ab-view" onClick={() => alert("查看（Demo）")}>
                      查看
                    </button>
                    <button className="action-btn ab-edit" onClick={() => alert("編輯（Demo）")}>
                      編輯
                    </button>

                  {r.status === "draft" && r.applicant === currentUserName ? (
                    <>
                      <button className="po-btn" onClick={() => void doUpdate(r.id, "producer_review")}>
                        送出
                      </button>
                      <button
                        className="po-btn po-btn-ghost"
                        onClick={async () => {
                          await deleteRequest(r.id);
                          await reload();
                        }}
                      >
                        刪除
                      </button>
                    </>
                  ) : null}

                  {r.status === "producer_review" && canApproveProducer ? (
                    <>
                      <button className="po-btn" onClick={() => void doUpdate(r.id, "treasury_review")}>
                        製片通過
                      </button>
                      <button className="po-btn po-btn-ghost" onClick={() => void doUpdate(r.id, "rejected")}>
                        退件
                      </button>
                    </>
                  ) : null}

                  {r.status === "treasury_review" && canApproveTreasury ? (
                    <>
                      <button
                        className="po-btn"
                        onClick={() => void doUpdate(r.id, "awaiting_physical_receipts")}
                      >
                        出納確認
                      </button>
                      <button className="po-btn po-btn-ghost" onClick={() => void doUpdate(r.id, "producer_review")}>
                        類型錯誤退回製片
                      </button>
                    </>
                  ) : null}

                  {r.status === "awaiting_physical_receipts" && canApproveTreasury ? (
                    <button className="po-btn" onClick={() => void doUpdate(r.id, "payment_pending")}>
                      已收實體單據
                    </button>
                  ) : null}

                  {r.status === "payment_pending" && canApproveTreasury ? (
                    <button className="po-btn" onClick={() => void doUpdate(r.id, "closed")}>
                      標記已匯款 / 結案
                    </button>
                  ) : null}

                  {r.applicant === currentUserName &&
                  r.status !== "closed" &&
                  r.status !== "cancelled" ? (
                    <button className="po-btn po-btn-ghost" onClick={() => void doUpdate(r.id, "cancelled")}>
                      取消
                    </button>
                  ) : null}

                  {canManageAsOwner ? <span style={{ color: "#888" }}>—</span> : null}
                  {!canManageAsOwner &&
                  !canApproveProducer &&
                  !canApproveTreasury &&
                  !(r.status === "draft" && r.applicant === currentUserName) ? (
                    <span style={{ color: "#888" }}>—</span>
                  ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="tbl-foot">
          <span>共 {tabFiltered.length} 筆</span>
          <div className="space" />
          <button className="pg-btn cur">1</button>
          <button className="pg-btn" disabled>
            2
          </button>
          <button className="pg-btn" disabled>
            ›
          </button>
        </div>
      </div>
    </section>
  );
}
