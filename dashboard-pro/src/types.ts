export type Role = "admin" | "producer" | "treasury" | "member";

export type RequestStatus =
  | "draft"
  | "producer_review"
  | "treasury_review"
  | "awaiting_physical_receipts"
  | "payment_pending"
  | "rejected"
  | "cancelled"
  | "closed";

/** 製片審核時選定；結餘流程專用分支 */
export type ApplicationType = "reimbursement" | "overage" | "surplus" | "unpaid";

export interface User {
  id: string;
  name: string;
  role: Role;
}

export interface ExpenseRequest {
  id: string;
  /** 單筆費用流水號：{專案簡碼}#00001 */
  expenseNo: string;
  /** 請款單編號：{團隊簡碼}-{YYMM}-{序號}（例：MUY-2604-001） */
  paymentRequestNo: string;
  project: string;
  applicant: string;
  category: string;
  /** PRD v5：含稅總金額（原 amount/金額改名） */
  totalAmount: number;
  /** PRD v5：invoice=發票 / receipt=收據 */
  receiptType: "invoice" | "receipt";
  /** PRD v5：系統計算（totalAmount × 0.05，無條件捨去至整數） */
  taxAmount: number;
  /** PRD v5：系統計算（totalAmount - taxAmount） */
  salesAmount: number;
  summary: string;
  status: RequestStatus;
  updatedAt: string;
  invoiceNo?: string;
  expenseDate?: string;
  /** 製片選定後才有；mock 可預填 */
  applicationType?: ApplicationType;
  /** PRD v4：列表顯示遮罩後帳戶，例如 `玉山 1234****7890` */
  bankMasked?: string;
  /** 出納核對完成日期（示意；PRD v4 出納步驟②） */
  cashierVerifiedAt?: string;
  /** 預計出帳日（示意；狀態待匯款時顯示） */
  payoutDate?: string;
  /** 出納步驟①寄發通知次數（示意） */
  cashierNotifyCount?: number;
}
