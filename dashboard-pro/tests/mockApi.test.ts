import { describe, expect, it, vi } from "vitest";
import { createRequest } from "../src/mockApi";

const baseRequest = {
  requestNo: "MUY-TEST-001",
  project: "Project A",
  applicant: "Demo User",
  category: "Travel",
  amount: 100,
  summary: "Test expense",
  status: "producer_review" as const
};

describe("mock API request creation", () => {
  it("generates unique ids when requests are created in the same millisecond", async () => {
    const now = Date.now();
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(now);

    try {
      const first = await createRequest(baseRequest);
      const second = await createRequest({ ...baseRequest, requestNo: "MUY-TEST-002" });

      expect(second.id).not.toBe(first.id);
    } finally {
      nowSpy.mockRestore();
    }
  });
});
