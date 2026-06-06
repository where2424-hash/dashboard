import { describe, expect, it } from "vitest";
import { canChangeStatus, canRejectStatus, getPrimaryStatusAction } from "./workflow";

describe("expense workflow rules", () => {
  it("only exposes the next valid action for the acting role", () => {
    expect(getPrimaryStatusAction("producer", "producer_review")).toEqual({
      label: "Approve",
      status: "treasury_review"
    });
    expect(getPrimaryStatusAction("producer", "treasury_review")).toBeNull();
    expect(getPrimaryStatusAction("treasury", "waiting_payment")).toEqual({
      label: "Mark Paid",
      status: "done"
    });
    expect(getPrimaryStatusAction("admin", "draft")).toBeNull();
    expect(getPrimaryStatusAction("admin", "done")).toBeNull();
  });

  it("blocks status skips that would corrupt the approval chain", () => {
    expect(canChangeStatus("producer", "draft", "done")).toBe(false);
    expect(canChangeStatus("admin", "rejected", "done")).toBe(false);
    expect(canChangeStatus("producer", "treasury_review", "done")).toBe(false);
    expect(canChangeStatus("treasury", "waiting_payment", "done")).toBe(true);
  });

  it("limits rejection to the active review owner", () => {
    expect(canRejectStatus("producer", "producer_review")).toBe(true);
    expect(canRejectStatus("treasury", "producer_review")).toBe(false);
    expect(canRejectStatus("treasury", "treasury_review")).toBe(true);
    expect(canRejectStatus("admin", "waiting_payment")).toBe(false);
  });
});
