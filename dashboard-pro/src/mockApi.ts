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
    status: "payment_pending",
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
  },
  {
    id: "4",
    requestNo: "MUY-2605-004",
    project: "Project A",
    applicant: "Gillian Lin",
    category: "Equipment",
    amount: 16800,
    summary: "Camera batteries",
    status: "treasury_review",
    updatedAt: "2026-05-05 13:05"
  }
];

const wait = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));

export async function listRequests() {
  await wait();
  return requests;
}

export async function createRequest(input: Omit<ExpenseRequest, "id" | "updatedAt">) {
  await wait();
  const row: ExpenseRequest = {
    ...input,
    id: String(Date.now()),
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

export async function deleteRequest(id: string) {
  await wait();
  requests = requests.filter((r) => r.id !== id);
}
