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

  it("keeps same-millisecond request submissions independently addressable", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);

    const [first, second] = await Promise.all([
      createRequest(buildRequest("MUY-2605-901")),
      createRequest(buildRequest("MUY-2605-902"))
    ]);

    expect(first.id).not.toBe(second.id);

    await updateStatus(first.id, "done");
    const rows = await listRequests();

    expect(rows.find((row) => row.id === first.id)?.status).toBe("done");
    expect(rows.find((row) => row.id === second.id)?.status).toBe("producer_review");
  });
});
