import { describe, expect, it, vi } from "vitest";

async function loadMockApi() {
  vi.resetModules();
  return import("./mockApi");
}

describe("mock expense API status updates", () => {
  it("rejects direct jumps from draft to done and leaves the row unchanged", async () => {
    const { listRequests, updateStatus } = await loadMockApi();

    await expect(updateStatus("3", "done", "producer")).rejects.toThrow(
      "Cannot move request 3 from draft to done as producer"
    );

    const rows = await listRequests();
    expect(rows.find((row) => row.id === "3")?.status).toBe("draft");
  });

  it("allows the valid treasury payment completion transition", async () => {
    const { listRequests, updateStatus } = await loadMockApi();

    await updateStatus("2", "done", "treasury");

    const rows = await listRequests();
    expect(rows.find((row) => row.id === "2")?.status).toBe("done");
  });

  it("generates unique ids for rapid request creation", async () => {
    const { createRequest } = await loadMockApi();
    const input = {
      requestNo: "MUY-TEST-001",
      project: "Project A",
      applicant: "Demo User",
      category: "Travel",
      amount: 100,
      summary: "Test expense",
      status: "producer_review" as const
    };

    const first = await createRequest(input);
    const second = await createRequest({ ...input, requestNo: "MUY-TEST-002" });

    expect(second.id).not.toBe(first.id);
  });
});
