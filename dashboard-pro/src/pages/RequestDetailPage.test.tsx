// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { act, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { listRequests, updateStatus } from "../mockApi";
import type { ExpenseRequest } from "../types";
import { RequestDetailPage } from "./RequestDetailPage";

vi.mock("../mockApi", () => ({
  listRequests: vi.fn(),
  updateStatus: vi.fn()
}));

const requests: ExpenseRequest[] = [
  {
    id: "1",
    requestNo: "MUY-2605-001",
    project: "Project A",
    applicant: "Eric Wang",
    category: "Travel",
    amount: 3500,
    summary: "Location scouting transport",
    status: "producer_review",
    updatedAt: "2026-05-05 09:30"
  },
  {
    id: "2",
    requestNo: "MUY-2605-002",
    project: "Project B",
    applicant: "Amy Chen",
    category: "Props",
    amount: 8800,
    summary: "Stage props rental",
    status: "waiting_payment",
    updatedAt: "2026-05-04 15:20"
  }
];

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve };
}

describe("RequestDetailPage", () => {
  it("ignores stale request loads after navigating to a different request", async () => {
    const firstLoad = createDeferred<ExpenseRequest[]>();
    const secondLoad = createDeferred<ExpenseRequest[]>();
    const navigateRef: { current?: (to: string) => void } = {};

    vi.mocked(listRequests)
      .mockReturnValueOnce(firstLoad.promise)
      .mockReturnValueOnce(secondLoad.promise);
    vi.mocked(updateStatus).mockResolvedValue(undefined);

    function Harness() {
      const navigate = useNavigate();

      useEffect(() => {
        navigateRef.current = navigate;
      }, [navigate]);

      return (
        <Routes>
          <Route path="/expenses/:id" element={<RequestDetailPage role="producer" />} />
        </Routes>
      );
    }

    render(
      <MemoryRouter initialEntries={["/expenses/1"]}>
        <Harness />
      </MemoryRouter>
    );

    expect(screen.getByText("Loading request...")).toBeInTheDocument();

    await act(async () => {
      navigateRef.current?.("/expenses/2");
    });

    await act(async () => {
      firstLoad.resolve(requests);
    });

    expect(screen.getByText("Loading request...")).toBeInTheDocument();
    expect(screen.queryByText("MUY-2605-001")).not.toBeInTheDocument();

    await act(async () => {
      secondLoad.resolve(requests);
    });

    expect(await screen.findByText("MUY-2605-002")).toBeInTheDocument();
    expect(screen.queryByText("MUY-2605-001")).not.toBeInTheDocument();
  });
});
