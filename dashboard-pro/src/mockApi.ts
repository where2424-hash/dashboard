import type { ExpenseRequest, RequestStatus } from "./types";

let requests: ExpenseRequest[] = [
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
  },
  {
    id: "3",
    requestNo: "MUY-2605-003",
    project: "Project A",
    applicant: "Patrick Lin",
    category: "Meals",
    amount: 1200,
    summary: "Crew lunch",
    status: "draft",
    updatedAt: "2026-05-03 17:10"
  }
];

let lastGeneratedRequestId = Date.now();

function createRequestId() {
  const now = Date.now();
  lastGeneratedRequestId = Math.max(now, lastGeneratedRequestId + 1);
  return String(lastGeneratedRequestId);
}

const wait = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));

export async function listRequests() {
  await wait();
  return requests;
}

export async function createRequest(input: Omit<ExpenseRequest, "id" | "updatedAt">) {
  await wait();
  const row: ExpenseRequest = {
    ...input,
    id: createRequestId(),
    updatedAt: new Date().toISOString().slice(0, 16).replace("T", " ")
  };
  requests = [row, ...requests];
  return row;
}

export async function updateStatus(id: string, status: RequestStatus) {
  await wait();
  requests = requests.map((r) =>
    r.id === id
      ? { ...r, status, updatedAt: new Date().toISOString().slice(0, 16).replace("T", " ") }
      : r
  );
}
