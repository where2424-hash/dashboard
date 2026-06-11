import { describe, expect, it } from "vitest";
import { canReject, canTransition, getPrimaryStatusAction } from "./workflow";

describe("expense request workflow", () => {
  it("allows only the owner role for each forward status transition", () => {
    expect(canTransition("producer", "producer_review", "treasury_review")).toBe(true);
    expect(canTransition("treasury", "producer_review", "treasury_review")).toBe(false);

    expect(canTransition("treasury", "treasury_review", "waiting_receipt")).toBe(true);
    expect(canTransition("producer", "treasury_review", "waiting_receipt")).toBe(false);

    expect(canTransition("treasury", "waiting_receipt", "waiting_payment")).toBe(true);
    expect(canTransition("treasury", "waiting_payment", "done")).toBe(true);
  });

  it("does not expose actions for terminal or draft states", () => {
    expect(getPrimaryStatusAction("admin", "done")).toBeNull();
    expect(getPrimaryStatusAction("admin", "rejected")).toBeNull();
    expect(getPrimaryStatusAction("admin", "draft")).toBeNull();
  });

  it("rejects only active workflow states for the responsible role", () => {
    expect(canReject("producer", "producer_review")).toBe(true);
    expect(canReject("treasury", "producer_review")).toBe(false);
    expect(canReject("treasury", "waiting_payment")).toBe(true);
    expect(canReject("admin", "done")).toBe(false);
  });
});
