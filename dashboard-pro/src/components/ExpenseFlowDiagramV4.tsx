import type { ReactNode } from "react";
import type { ApplicationType, RequestStatus } from "../types";

/**
 * 明細頁流程圖 — 對齊 PRD v4 §4.1～§4.2 與 progress_v13 四類：
 * - 墊付款報銷／墊付款超支／未付款：同一主線（§4.1 流程 1）
 * - 墊付款結餘：§4.1 流程 2（結餘退回 → 出納確認 → 已結案）
 */

const ARROW = <span className="exp-flow-arrow">→</span>;

type Step = { label: string; status?: RequestStatus; sub?: string };

function Node({
  label,
  sub,
  active
}: {
  label: string;
  sub?: string;
  active?: boolean;
}) {
  return (
    <div className={`exp-flow-node${active ? " exp-flow-node--active" : ""}`}>
      <span className="exp-flow-node__text">{label}</span>
      {sub ? <span className="exp-flow-node__sub">{sub}</span> : null}
    </div>
  );
}

function Row({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="exp-flow-row">
      <div className="exp-flow-row__title">{title}</div>
      <div className="exp-flow-row__track">{children}</div>
    </div>
  );
}

function stepActive(step: Step, current: RequestStatus | undefined): boolean {
  return step.status !== undefined && current === step.status;
}

/** §4.1 流程 1 + §4.2 狀態碼（草稿 → … → 已結案） */
const FLOW_STANDARD: Step[] = [
  { label: "草稿", status: "draft" },
  { label: "製片審核中", status: "producer_review" },
  { label: "出納審核中", status: "treasury_review" },
  { label: "待收實體單據", status: "awaiting_physical_receipts" },
  { label: "待匯款", status: "payment_pending" },
  { label: "已結案", status: "closed" }
];

/** §4.1 流程 2：結餘退回為申請人動作節點（無獨立 API 狀態碼）；出納確認對應出納審核中／確認段 */
const FLOW_SURPLUS: Step[] = [
  { label: "草稿", status: "draft" },
  { label: "製片審核中", status: "producer_review" },
  { label: "結餘退回", sub: "申請人匯款＋上傳截圖" },
  { label: "出納確認", status: "treasury_review" },
  { label: "已結案", status: "closed" }
];

function StandardChain({
  currentStatus,
  highlightBase
}: {
  currentStatus?: RequestStatus;
  highlightBase: boolean;
}) {
  return (
    <div className="exp-flow-chain exp-flow-chain--wrap">
      {FLOW_STANDARD.map((s, i) => (
        <span key={s.label} className="exp-flow-chain__wrap">
          {i > 0 ? ARROW : null}
          <Node
            label={s.label}
            sub={s.sub}
            active={highlightBase && stepActive(s, currentStatus)}
          />
        </span>
      ))}
    </div>
  );
}

function SurplusChain({
  currentStatus,
  highlightBase
}: {
  currentStatus?: RequestStatus;
  highlightBase: boolean;
}) {
  return (
    <div className="exp-flow-chain exp-flow-chain--wrap">
      {FLOW_SURPLUS.map((s, i) => (
        <span key={s.label + i} className="exp-flow-chain__wrap">
          {i > 0 ? ARROW : null}
          <Node
            label={s.label}
            sub={s.sub}
            active={
              highlightBase &&
              (s.status !== undefined ? stepActive(s, currentStatus) : false)
            }
          />
        </span>
      ))}
    </div>
  );
}

const TYPE_ROW_TITLE: Record<ApplicationType, string> = {
  reimbursement: "墊付款報銷",
  overage: "墊付款超支",
  surplus: "墊付款結餘",
  unpaid: "未付款"
};

export function ExpenseFlowDiagramV4({
  applicationType = "reimbursement",
  currentStatus
}: {
  applicationType?: ApplicationType;
  currentStatus?: RequestStatus;
}) {
  const isRejected = currentStatus === "rejected";
  const isCancelled = currentStatus === "cancelled";
  const isSurplus = applicationType === "surplus";

  const highlightBase =
    currentStatus &&
    !isRejected &&
    !isCancelled &&
    [
      "draft",
      "producer_review",
      "treasury_review",
      "awaiting_physical_receipts",
      "payment_pending",
      "closed"
    ].includes(currentStatus);

  const rowTitle = TYPE_ROW_TITLE[applicationType ?? "reimbursement"];

  return (
    <div className="exp-flow">
      <p className="exp-flow__intro">
        PRD v4 §4.1：本單申請類型為「{rowTitle}」。
        {isSurplus
          ? " 適用流程 2：結餘退回 → 出納確認 → 已結案。"
          : " 適用流程 1：與墊付款報銷、墊付款超支、未付款共用同一主線（草稿→製片審核中→出納審核中→待收實體單據→待匯款→已結案）。"}
        狀態名稱見 §4.2。
      </p>

      <div className="exp-flow-legend">
        <span>
          <i className="exp-dot exp-dot--gray" /> 草稿／已取消
        </span>
        <span>
          <i className="exp-dot exp-dot--orange" /> 製片審核中
        </span>
        <span>
          <i className="exp-dot exp-dot--blue" /> 出納審核中／待匯款
        </span>
        <span>
          <i className="exp-dot exp-dot--purple" /> 待收實體單據
        </span>
        <span>
          <i className="exp-dot exp-dot--green" /> 已結案
        </span>
        <span>
          <i className="exp-dot exp-dot--red" /> 已退件
        </span>
      </div>

      <div className="exp-flow-note exp-flow-note--info">
        <strong>申請人送出後</strong>
        ：無法自行退回草稿；退件後可修改重送或取消（終態為已取消／已結案）。類型誤選時出納可退件回製片重新選定。
      </div>

      {isSurplus ? (
        <Row title={rowTitle}>
          <SurplusChain currentStatus={currentStatus} highlightBase={!!highlightBase} />
        </Row>
      ) : (
        <Row title={rowTitle}>
          <StandardChain currentStatus={currentStatus} highlightBase={!!highlightBase} />
        </Row>
      )}

      <div className="exp-flow-note exp-flow-note--muted">
        <strong>已退件／已取消</strong>
        ：已退件可修改重送回到製片審核中；已取消為終態。
        {isRejected ? <em> 目前：已退件</em> : null}
        {isCancelled ? <em> 目前：已取消</em> : null}
        {!isRejected && !isCancelled ? <> 請以列表徽章對照目前狀態。</> : null}
      </div>
    </div>
  );
}
