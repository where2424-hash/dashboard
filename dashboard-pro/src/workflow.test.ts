import { describe, expect, it } from "vitest";
import { createRequest, listRequests, updateStatus } from "./mockApi";
import { canChangeStatus, canRejectStatus, getNextStatus } from "./workflow";

describe("expense workflow", () => {
  it("only exposes role-appropriate forward transitions", () => {
    expect(getNextStatus("producer_review", "producer")).toBe("treasury_review");
    expect(getNextStatus("producer_review", "treasury")).toBeNull();
    expect(getNextStatus("waiting_payment", "treasury")).toBe("waiting_receipt");
    expect(getNextStatus("done", "admin")).toBeNull();
  });

  it("does not allow terminal or rejected requests to be rewritten through review actions", () => {
    expect(canRejectStatus("done", "admin")).toBe(false);
    expect(canChangeStatus("done", "producer_review", "admin")).toBe(false);
    expect(canChangeStatus("rejected", "done", "admin")).toBe(false);
  });

  it("rejects invalid status jumps at the API boundary", async () => {
    await expect(updateStatus("1", "done", "producer")).rejects.toThrow(
      "Cannot move request 1 from producer_review to done as producer"
    );

    const rows = await listRequests();
    expect(rows.find((row) => row.id === "1")?.status).toBe("producer_review");
  });

  it("advances valid review transitions", async () => {
    await updateStatus("1", "treasury_review", "producer");

    const rows = await listRequests();
    expect(rows.find((row) => row.id === "1")?.status).toBe("treasury_review");
  });

  it("assigns unique ids to rapid concurrent creates", async () => {
    const input = {
      requestNo: "MUY-2605-999",
      project: "Project C",
      applicant: "Demo User",
      category: "Travel",
      amount: 100,
      summary: "Concurrent submit check",
      status: "producer_review" as const
    };

    const [first, second] = await Promise.all([createRequest(input), createRequest(input)]);

    expect(first.id).not.toBe(second.id);
  });
});
