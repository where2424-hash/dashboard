import { describe, expect, it } from "vitest";
import { canReject, canTransition, getPrimaryStatusAction } from "../src/workflow";

describe("expense workflow transitions", () => {
  it("prevents broad done toggles that skip review or payment states", () => {
    expect(canTransition("producer", "waiting_payment", "done")).toBe(false);
    expect(canTransition("treasury", "draft", "done")).toBe(false);
    expect(canTransition("admin", "rejected", "done")).toBe(false);
    expect(canTransition("admin", "done", "producer_review")).toBe(false);
  });

  it("allows only the role-appropriate forward action for active review states", () => {
    expect(getPrimaryStatusAction("producer", "producer_review")).toEqual({
      label: "Approve",
      status: "treasury_review"
    });
    expect(getPrimaryStatusAction("treasury", "treasury_review")).toEqual({
      label: "Approve",
      status: "waiting_payment"
    });
    expect(getPrimaryStatusAction("treasury", "waiting_payment")).toEqual({
      label: "Mark Paid",
      status: "done"
    });
    expect(getPrimaryStatusAction("member", "producer_review")).toBeNull();
  });

  it("rejects only active review states handled by the current role", () => {
    expect(canReject("producer", "producer_review")).toBe(true);
    expect(canReject("treasury", "treasury_review")).toBe(true);
    expect(canReject("admin", "producer_review")).toBe(true);
    expect(canReject("admin", "treasury_review")).toBe(true);

    expect(canReject("producer", "treasury_review")).toBe(false);
    expect(canReject("treasury", "producer_review")).toBe(false);
    expect(canReject("admin", "done")).toBe(false);
    expect(canReject("admin", "rejected")).toBe(false);
  });
});
