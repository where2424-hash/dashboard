import type { RequestStatus, Role } from "./types";

const statusTransitions: Record<RequestStatus, RequestStatus[]> = {
  draft: ["producer_review"],
  producer_review: ["treasury_review", "rejected"],
  treasury_review: ["waiting_receipt", "rejected"],
  waiting_receipt: ["waiting_payment", "rejected"],
  waiting_payment: ["done", "rejected"],
  rejected: [],
  done: []
};

export function canTransitionStatus(from: RequestStatus, to: RequestStatus): boolean {
  return statusTransitions[from].includes(to);
}

export function canRejectStatus(status: RequestStatus): boolean {
  return canTransitionStatus(status, "rejected");
}

type StatusAction = {
  label: string;
  nextStatus: RequestStatus;
};

export function getStatusActionForRole(status: RequestStatus, role: Role): StatusAction | null {
  if ((role === "producer" || role === "admin") && status === "producer_review") {
    return { label: "Approve", nextStatus: "treasury_review" };
  }

  if (role !== "treasury" && role !== "admin") {
    return null;
  }

  if (status === "treasury_review") {
    return { label: "Request Receipt", nextStatus: "waiting_receipt" };
  }

  if (status === "waiting_receipt") {
    return { label: "Ready Payment", nextStatus: "waiting_payment" };
  }

  if (status === "waiting_payment") {
    return { label: "Mark Done", nextStatus: "done" };
  }

  return null;
}
