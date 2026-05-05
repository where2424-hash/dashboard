export type Role = "admin" | "producer" | "treasury" | "member";

export type RequestStatus =
  | "draft"
  | "producer_review"
  | "treasury_review"
  | "waiting_receipt"
  | "waiting_payment"
  | "rejected"
  | "done";

export interface User {
  id: string;
  name: string;
  role: Role;
}

export interface ExpenseRequest {
  id: string;
  requestNo: string;
  project: string;
  applicant: string;
  category: string;
  amount: number;
  summary: string;
  status: RequestStatus;
  updatedAt: string;
}
