import { afterEach, describe, expect, it, vi } from "vitest";
import { createRequest, listRequests, updateStatus } from "./mockApi";
import type { ExpenseRequest } from "./types";

const buildRequest = (
  requestNo: string,
  overrides: Partial<Omit<ExpenseRequest, "id" | "updatedAt">> = {}
): Omit<ExpenseRequest, "id" | "updatedAt"> => ({
  requestNo,
  project: "Project A",
  applicant: "Demo User",
  category: "Travel",
  amount: 100,
  summary: "Test request",
  status: "producer_review",
  ...overrides
});

describe("mockApi", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects direct-to-done writes that skip required approvals", async () => {
    const row = await createRequest(buildRequest("MUY-2605-901"));

    await expect(updateStatus(row.id, "done", "producer")).rejects.toThrow(
      "Cannot transition request"
    );

    const rows = await listRequests();
    expect(rows.find((request) => request.id === row.id)?.status).toBe("producer_review");
  });

  it("persists the valid approval sequence for responsible roles", async () => {
    const row = await createRequest(buildRequest("MUY-2605-902"));

    const producerApproved = await updateStatus(row.id, "treasury_review", "producer");
    const receiptRequested = await updateStatus(row.id, "waiting_receipt", "treasury");
    const paymentReady = await updateStatus(row.id, "waiting_payment", "treasury");
    const paid = await updateStatus(row.id, "done", "treasury");

    expect(producerApproved.status).toBe("treasury_review");
    expect(receiptRequested.status).toBe("waiting_receipt");
    expect(paymentReady.status).toBe("waiting_payment");
    expect(paid.status).toBe("done");
  });

  it("creates unique ids when requests are submitted in the same millisecond", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);

    const [first, second] = await Promise.all([
      createRequest(buildRequest("MUY-2605-903")),
      createRequest(buildRequest("MUY-2605-904"))
    ]);

    expect(new Set([first.id, second.id]).size).toBe(2);

    await updateStatus(first.id, "treasury_review", "producer");
    const rows = await listRequests();

    expect(rows.find((request) => request.id === first.id)?.status).toBe("treasury_review");
    expect(rows.find((request) => request.id === second.id)?.status).toBe("producer_review");
  });
});
