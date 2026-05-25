import type { RequestStatus, Role } from "./types";

type TransitionRule = {
  next: RequestStatus;
  roles: Role[];
};

const advanceRules: Partial<Record<RequestStatus, TransitionRule>> = {
  producer_review: { next: "treasury_review", roles: ["producer", "admin"] },
  treasury_review: { next: "waiting_payment", roles: ["treasury", "admin"] },
  waiting_payment: { next: "waiting_receipt", roles: ["treasury", "admin"] },
  waiting_receipt: { next: "done", roles: ["producer", "admin"] }
};

const reviewRoles: Role[] = ["producer", "treasury", "admin"];
const rejectableStatuses: RequestStatus[] = [
  "producer_review",
  "treasury_review",
  "waiting_payment",
  "waiting_receipt"
];

export function getNextStatus(status: RequestStatus, role: Role) {
  const rule = advanceRules[status];

  if (!rule || !rule.roles.includes(role)) {
    return null;
  }

  return rule.next;
}

export function canRejectStatus(status: RequestStatus, role: Role) {
  return reviewRoles.includes(role) && rejectableStatuses.includes(status);
}

export function canChangeStatus(current: RequestStatus, next: RequestStatus, role: Role) {
  if (current === next) {
    return true;
  }

  if (next === "rejected") {
    return canRejectStatus(current, role);
  }

  return getNextStatus(current, role) === next;
}
