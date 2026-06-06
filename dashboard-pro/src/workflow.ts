import type { RequestStatus, Role } from "./types";

export interface StatusAction {
  label: string;
  status: RequestStatus;
}

const advanceRules: Partial<
  Record<RequestStatus, { action: StatusAction; roles: Role[] }>
> = {
  producer_review: {
    action: { label: "Approve", status: "treasury_review" },
    roles: ["producer", "admin"]
  },
  treasury_review: {
    action: { label: "Confirm Details", status: "waiting_receipt" },
    roles: ["treasury", "admin"]
  },
  waiting_receipt: {
    action: { label: "Confirm Receipt", status: "waiting_payment" },
    roles: ["treasury", "admin"]
  },
  waiting_payment: {
    action: { label: "Mark Paid", status: "done" },
    roles: ["treasury", "admin"]
  }
};

export function getPrimaryStatusAction(role: Role, status: RequestStatus): StatusAction | null {
  const rule = advanceRules[status];

  if (!rule || !rule.roles.includes(role)) {
    return null;
  }

  return rule.action;
}

export function canRejectStatus(role: Role, status: RequestStatus) {
  if (status === "producer_review") {
    return role === "producer" || role === "admin";
  }

  if (status === "treasury_review") {
    return role === "treasury" || role === "admin";
  }

  return false;
}

export function canChangeStatus(role: Role, from: RequestStatus, to: RequestStatus) {
  if (from === to) {
    return true;
  }

  if (to === "rejected") {
    return canRejectStatus(role, from);
  }

  return getPrimaryStatusAction(role, from)?.status === to;
}
