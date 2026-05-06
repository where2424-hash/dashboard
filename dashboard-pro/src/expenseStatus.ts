import type { ApplicationType, RequestStatus } from "./types";

/** PRD v4 UI 狀態名（§4.2，與列表／明細／API 一致） */
export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  draft: "草稿",
  producer_review: "製片審核中",
  treasury_review: "出納審核中",
  awaiting_physical_receipts: "待收實體單據",
  payment_pending: "待匯款",
  rejected: "已退件",
  cancelled: "已取消",
  closed: "已結案"
};

export function requestStatusBadgeClass(status: RequestStatus): string {
  switch (status) {
    case "draft":
    case "cancelled":
      return "rd-badge rd-badge--neutral";
    case "producer_review":
      return "rd-badge rd-badge--orange";
    case "treasury_review":
    case "payment_pending":
      return "rd-badge rd-badge--blue";
    case "awaiting_physical_receipts":
      return "rd-badge rd-badge--purple";
    case "rejected":
      return "rd-badge rd-badge--red";
    case "closed":
      return "rd-badge rd-badge--green";
  }
}

/** 報帳總表列表徽章（對齊 PRD v4 狀態色系） */
export function expenseListBadgeClass(status: RequestStatus): string {
  switch (status) {
    case "draft":
      return "exp-ov-badge exp-ov-badge--muted";
    case "producer_review":
      return "exp-ov-badge exp-ov-badge--review";
    case "treasury_review":
      return "exp-ov-badge exp-ov-badge--review";
    case "payment_pending":
      return "exp-ov-badge exp-ov-badge--pending";
    case "awaiting_physical_receipts":
      return "exp-ov-badge exp-ov-badge--waiting";
    case "rejected":
      return "exp-ov-badge exp-ov-badge--rejected";
    case "cancelled":
      return "exp-ov-badge exp-ov-badge--muted";
    case "closed":
      return "exp-ov-badge exp-ov-badge--done";
  }
}

/**
 * PRD §4.1 申請類型（製片審核時選定；對應 progress_v13 四類按鈕）
 * API ApplicationType 映射為對外中文名。
 */
export const APPLICATION_TYPE_LABEL: Record<ApplicationType, string> = {
  reimbursement: "墊付款報銷",
  overage: "墊付款超支",
  surplus: "墊付款結餘",
  unpaid: "未付款"
};
