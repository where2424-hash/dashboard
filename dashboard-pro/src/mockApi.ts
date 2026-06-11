import type { ExpenseRequest, RequestStatus, Role } from "./types";
import { canTransition } from "./workflow";

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

const wait = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));

let lastGeneratedId = Date.now();

function createRequestId() {
  lastGeneratedId = Math.max(Date.now(), lastGeneratedId + 1);
  return String(lastGeneratedId);
}

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

export async function updateStatus(id: string, status: RequestStatus, role: Role) {
  await wait();
  const current = requests.find((r) => r.id === id);

  if (!current) {
    throw new Error(`Request ${id} was not found`);
  }

  if (!canTransition(role, current.status, status)) {
    throw new Error(`Cannot transition request ${id} from ${current.status} to ${status}`);
  }

  const updated: ExpenseRequest = {
    ...current,
    status,
    updatedAt: new Date().toISOString().slice(0, 16).replace("T", " ")
  };
  requests = requests.map((r) => (r.id === id ? updated : r));
  return updated;
}
