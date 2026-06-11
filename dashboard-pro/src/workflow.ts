import type { RequestStatus, Role } from "./types";

export interface StatusAction {
  label: string;
  status: RequestStatus;
}

export function getPrimaryStatusAction(role: Role, status: RequestStatus): StatusAction | null {
  if ((role === "producer" || role === "admin") && status === "producer_review") {
    return { label: "Approve", status: "treasury_review" };
  }

  if ((role === "treasury" || role === "admin") && status === "treasury_review") {
    return { label: "Request Receipt", status: "waiting_receipt" };
  }

  if ((role === "treasury" || role === "admin") && status === "waiting_receipt") {
    return { label: "Ready Payment", status: "waiting_payment" };
  }

  if ((role === "treasury" || role === "admin") && status === "waiting_payment") {
    return { label: "Mark Paid", status: "done" };
  }

  return null;
}

export function canReject(role: Role, status: RequestStatus): boolean {
  if (status === "producer_review") {
    return role === "producer" || role === "admin";
  }

  if (status === "treasury_review" || status === "waiting_receipt" || status === "waiting_payment") {
    return role === "treasury" || role === "admin";
  }

  return false;
}

export function canTransition(role: Role, from: RequestStatus, to: RequestStatus): boolean {
  if (to === "rejected") {
    return canReject(role, from);
  }

  return getPrimaryStatusAction(role, from)?.status === to;
}
