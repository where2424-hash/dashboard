/**
 * 報帳總表「審核流程說明」— 分支與節點對齊 PRD v4 §4.1，
 * 狀態用語對齊 §4.2（製片審核中、出納審核中、待收實體單據、待匯款、已結案）。
 * 視覺參考 progress_v13.html 四類；結餘流程為 §4.1 流程 2（較短）。
 */
import type { ReactNode } from "react";

const ARROW = <span className="exp-ov-fl-arrow">›</span>;

function Node({
  children,
  variant = "plain"
}: {
  children: ReactNode;
  variant?: "start" | "end" | "plain" | "key-green" | "key-amber" | "key-blue" | "key-purple";
}) {
  const cls =
    variant === "start"
      ? "exp-ov-fn exp-ov-fn-start"
      : variant === "end"
        ? "exp-ov-fn exp-ov-fn-end"
        : variant === "plain"
          ? "exp-ov-fn exp-ov-fn-plain"
          : `exp-ov-fn exp-ov-fn-key exp-ov-fn-${variant}`;
  return <span className={cls}>{children}</span>;
}

function Track({
  label,
  labelTone,
  children
}: {
  label: string;
  labelTone: "blue" | "green" | "amber" | "purple";
  children: ReactNode;
}) {
  return (
    <div className="exp-ov-flow-row">
      <span className={`exp-ov-fl-label exp-ov-fl-label--${labelTone}`}>{label}</span>
      <div className="exp-ov-flow-track">{children}</div>
    </div>
  );
}

/** §4.1 流程 1：墊付款報銷／墊付款超支／未付款（節點相同） */
function FlowStandardTrack({ label, labelTone }: { label: string; labelTone: "green" | "amber" | "purple" }) {
  return (
    <Track label={label} labelTone={labelTone}>
      <Node variant="start">報帳申請</Node>
      {ARROW}
      <Node variant="plain">製片審核中</Node>
      {ARROW}
      <Node variant="plain">出納審核中</Node>
      {ARROW}
      <Node variant="plain">待收實體單據</Node>
      {ARROW}
      <Node variant="plain">待匯款</Node>
      {ARROW}
      <Node variant="end">已結案</Node>
    </Track>
  );
}

/** §4.1 流程 2：墊付款結餘 */
function FlowSurplusTrack() {
  return (
    <Track label="墊付款結餘" labelTone="blue">
      <Node variant="start">報帳申請</Node>
      {ARROW}
      <Node variant="plain">製片審核中</Node>
      {ARROW}
      <Node variant="key-purple">結餘退回</Node>
      {ARROW}
      <Node variant="plain">出納確認</Node>
      {ARROW}
      <Node variant="end">已結案</Node>
    </Track>
  );
}

export function ExpenseOverviewFlow() {
  return (
    <div className="exp-ov-flow-card">
      <div className="exp-ov-flow-title">報帳審核流程說明</div>
      <p className="exp-ov-flow-prd-note">
        PRD v4：申請類型由製片審核時選定；下列四類對應 §4.1，狀態名稱與系統列表／明細一致。
      </p>
      <div className="exp-ov-flow-rows">
        <FlowStandardTrack label="墊付款報銷" labelTone="green" />
        <FlowStandardTrack label="墊付款超支" labelTone="amber" />
        <FlowSurplusTrack />
        <FlowStandardTrack label="未付款" labelTone="purple" />
      </div>
    </div>
  );
}
