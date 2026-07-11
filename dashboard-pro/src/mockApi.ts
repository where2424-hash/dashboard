import type { ExpenseRequest, RequestStatus } from "./types";

const STORAGE_KEY = "dashboard-pro.expense-requests";

const requestStatuses: RequestStatus[] = [
  "draft",
  "producer_review",
  "treasury_review",
  "waiting_receipt",
  "waiting_payment",
  "rejected",
  "done"
];

const seedRequests: ExpenseRequest[] = [
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

function cloneRequests(rows: ExpenseRequest[]) {
  return rows.map((row) => ({ ...row }));
}

function isRequestStatus(value: unknown): value is RequestStatus {
  return typeof value === "string" && requestStatuses.includes(value as RequestStatus);
}

function isExpenseRequest(value: unknown): value is ExpenseRequest {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;

  return (
    typeof row.id === "string" &&
    typeof row.requestNo === "string" &&
    typeof row.project === "string" &&
    typeof row.applicant === "string" &&
    typeof row.category === "string" &&
    typeof row.amount === "number" &&
    Number.isFinite(row.amount) &&
    typeof row.summary === "string" &&
    isRequestStatus(row.status) &&
    typeof row.updatedAt === "string"
  );
}

function readStoredRequests() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(isExpenseRequest)) return null;

    return cloneRequests(parsed);
  } catch {
    return null;
  }
}

function loadRequests() {
  return readStoredRequests() ?? cloneRequests(seedRequests);
}

function persistRequests() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  } catch {
    // Keep the in-memory session usable if storage is unavailable or full.
  }
}

let requests: ExpenseRequest[] = loadRequests();

const wait = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));

export async function listRequests() {
  await wait();
  requests = loadRequests();
  return cloneRequests(requests);
}

export async function createRequest(input: Omit<ExpenseRequest, "id" | "updatedAt">) {
  await wait();
  const row: ExpenseRequest = {
    ...input,
    id: String(Date.now()),
    updatedAt: new Date().toISOString().slice(0, 16).replace("T", " ")
  };
  requests = [row, ...loadRequests()];
  persistRequests();
  return { ...row };
}

export async function updateStatus(id: string, status: RequestStatus) {
  await wait();
  let didUpdate = false;
  requests = loadRequests().map((r) => {
    if (r.id !== id) return r;

    didUpdate = true;
    return { ...r, status, updatedAt: new Date().toISOString().slice(0, 16).replace("T", " ") };
  });

  if (didUpdate) persistRequests();
}
