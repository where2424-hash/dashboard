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
    return { label: "Approve", status: "waiting_payment" };
  }

  if ((role === "treasury" || role === "admin") && status === "waiting_payment") {
    return { label: "Mark Paid", status: "done" };
  }

  return null;
}

export function canReject(role: Role, status: RequestStatus) {
  if (status !== "producer_review" && status !== "treasury_review") {
    return false;
  }

  if (role === "admin") {
    return true;
  }

  return (
    (role === "producer" && status === "producer_review") ||
    (role === "treasury" && status === "treasury_review")
  );
}

export function canTransition(role: Role, from: RequestStatus, to: RequestStatus) {
  if (to === "rejected") {
    return canReject(role, from);
  }

  return getPrimaryStatusAction(role, from)?.status === to;
}
