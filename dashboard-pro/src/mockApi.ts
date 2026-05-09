import type { ApplicationType, ExpenseRequest, RequestStatus } from "./types";

/** PRD v4：草稿亦使用正式流水號格式（示意 MMA#） */
function calcTaxAmount(totalAmount: number): number {
  return Math.floor(totalAmount * 0.05);
}

function withV5Amounts(input: Omit<ExpenseRequest, "taxAmount" | "salesAmount">): ExpenseRequest {
  const taxAmount = input.receiptType === "receipt" ? 0 : calcTaxAmount(input.totalAmount);
  return {
    ...input,
    taxAmount,
    salesAmount: input.totalAmount - taxAmount
  };
}

function toYyMm(isoDate: Date): string {
  const yy = String(isoDate.getFullYear()).slice(-2);
  const mm = String(isoDate.getMonth() + 1).padStart(2, "0");
  return `${yy}${mm}`;
}

function projectCodeFromProjectSettings(projectName: string): string | null {
  // 來源：ProjectOverviewPage 專案總覽（localStorage）
  try {
    const raw = window.localStorage.getItem("project-overview-info-v1");
    if (!raw) return null;
    const info = JSON.parse(raw) as { name?: string; code?: string };
    if (!info?.name || !info?.code) return null;
    if (info.name.trim() !== (projectName ?? "").trim()) return null;
    const code = info.code.trim().toUpperCase();
    if (!/^[A-Z0-9]{2,6}$/.test(code)) return null;
    return code.slice(0, 3);
  } catch {
    return null;
  }
}

function projectCodeFromName(project: string): string {
  // 優先：Project 設定（可由使用者在專案總覽編輯）
  const fromSettings = projectCodeFromProjectSettings(project);
  if (fromSettings) return fromSettings;

  // fallback：mock 專案對照
  const trimmed = (project ?? "").trim();
  const map: Record<string, string> = {
    "牧馬專案 A": "MMA",
    "牧馬專案 B": "MMB",
    "牧馬專案 C": "MMC",
    "夏日廣告 B": "SAB",
    "年終特輯 C": "YEC"
  };
  if (map[trimmed]) return map[trimmed];

  // fallback：從名稱抽取英數 token
  const m = trimmed.match(/[A-Za-z0-9]+/g);
  const token = m?.[0] ?? "PRJ";
  return token.slice(0, 3).toUpperCase().padEnd(3, "X");
}

const expenseSeqByProject: Record<string, number> = {};
let paymentReqSeqByYyMm: Record<string, number> = {};

function nextExpenseNo(projectName: string): string {
  const code = projectCodeFromName(projectName);
  const cur = expenseSeqByProject[code] ?? 0;
  const next = cur + 1;
  expenseSeqByProject[code] = next;
  return `${code}#${String(next).padStart(5, "0")}`;
}

function nextPaymentRequestNo(now = new Date()): string {
  // PRD v5：{團隊簡碼}-{YYMM}-{序號三碼}
  const teamCode = "MUY";
  const yymm = toYyMm(now);
  const cur = paymentReqSeqByYyMm[yymm] ?? 0;
  const next = cur + 1;
  paymentReqSeqByYyMm = { ...paymentReqSeqByYyMm, [yymm]: next };
  return `${teamCode}-${yymm}-${String(next).padStart(3, "0")}`;
}

let requests: ExpenseRequest[] = [
  withV5Amounts({
    id: "1",
    expenseNo: "MMA#00021",
    paymentRequestNo: "MUY-2604-001",
    project: "牧馬專案 A",
    applicant: "Eric Wang",
    category: "交通費",
    receiptType: "invoice",
    totalAmount: 3500,
    summary: "勘景交通補貼",
    status: "producer_review",
    updatedAt: "2026-05-05 09:30",
    invoiceNo: "AB-12345678",
    expenseDate: "2026-04-17",
    applicationType: "reimbursement",
    bankMasked: "玉山 0012****5678"
  }),
  withV5Amounts({
    id: "2",
    expenseNo: "MMA#00022",
    paymentRequestNo: "MUY-2604-001",
    project: "牧馬專案 A",
    applicant: "Amy Chen",
    category: "餐飲費",
    receiptType: "receipt",
    totalAmount: 1200,
    summary: "工作餐敘",
    status: "draft",
    updatedAt: "2026-05-04 15:20",
    invoiceNo: "BC-23456789",
    expenseDate: "2026-04-18",
    applicationType: "reimbursement",
    bankMasked: "台新 0034****9012"
  }),
  withV5Amounts({
    id: "3",
    expenseNo: "MMB#00018",
    paymentRequestNo: "MUY-2604-002",
    project: "牧馬專案 B",
    applicant: "Patrick Lin",
    category: "道具費",
    receiptType: "invoice",
    totalAmount: 8800,
    summary: "場景道具租借",
    status: "awaiting_physical_receipts",
    updatedAt: "2026-05-03 17:10",
    invoiceNo: "CD-34567890",
    expenseDate: "2026-04-19",
    applicationType: "unpaid",
    bankMasked: "國泰 0022****3456"
  }),
  withV5Amounts({
    id: "4",
    expenseNo: "MMB#00015",
    paymentRequestNo: "MUY-2604-002",
    project: "牧馬專案 B",
    applicant: "Kevin Liu",
    category: "交通費",
    receiptType: "receipt",
    totalAmount: 2600,
    summary: "外景交通",
    status: "closed",
    updatedAt: "2026-04-28 11:00",
    invoiceNo: "DE-45678901",
    expenseDate: "2026-04-20",
    applicationType: "reimbursement",
    bankMasked: "中信 0045****6789"
  }),
  withV5Amounts({
    id: "5",
    expenseNo: "MMC#00012",
    paymentRequestNo: "MUY-2604-003",
    project: "牧馬專案 C",
    applicant: "Stella Wu",
    category: "後製費",
    receiptType: "invoice",
    totalAmount: 5400,
    summary: "剪接外包費",
    status: "payment_pending",
    updatedAt: "2026-05-01 14:20",
    invoiceNo: "EF-56789012",
    expenseDate: "2026-04-21",
    applicationType: "overage",
    bankMasked: "玉山 0056****7890"
  }),
  withV5Amounts({
    id: "6",
    expenseNo: "SAB#00009",
    paymentRequestNo: "MUY-2604-004",
    project: "夏日廣告 B",
    applicant: "Sandy Ho",
    category: "器材費",
    receiptType: "receipt",
    totalAmount: 6200,
    summary: "租借攝影燈",
    status: "producer_review",
    updatedAt: "2026-05-02 10:15",
    invoiceNo: "GH-55667788",
    expenseDate: "2026-04-15",
    applicationType: "reimbursement",
    bankMasked: "中信 0067****8901"
  }),
  withV5Amounts({
    id: "7",
    expenseNo: "YEC#00007",
    paymentRequestNo: "MUY-2603-001",
    project: "年終特輯 C",
    applicant: "Eric Wang",
    category: "材料費",
    receiptType: "invoice",
    totalAmount: 1980,
    summary: "道具製作材料",
    status: "closed",
    updatedAt: "2026-04-10 16:40",
    invoiceNo: "IJ-99001122",
    expenseDate: "2026-03-28",
    applicationType: "surplus",
    bankMasked: "玉山 0012****5678"
  }),
  withV5Amounts({
    id: "8",
    expenseNo: "YEC#00005",
    paymentRequestNo: "MUY-2603-001",
    project: "年終特輯 C",
    applicant: "Molly Wu",
    category: "交通費",
    receiptType: "receipt",
    totalAmount: 4560,
    summary: "來回高雄拍攝",
    status: "awaiting_physical_receipts",
    updatedAt: "2026-04-08 09:00",
    invoiceNo: "KL-33445566",
    expenseDate: "2026-03-22",
    applicationType: "unpaid",
    bankMasked: "富邦 0078****9012"
  }),
  withV5Amounts({
    id: "9",
    expenseNo: "MMA#00004",
    paymentRequestNo: "MUY-2605-001",
    project: "牧馬專案 A",
    applicant: "Lisa Wu",
    category: "場地費",
    receiptType: "invoice",
    totalAmount: 15000,
    summary: "結餘補款—外景器材",
    status: "treasury_review",
    updatedAt: "2026-05-06 10:00",
    invoiceNo: "ZZ-001122",
    expenseDate: "2026-05-02",
    applicationType: "overage",
    bankMasked: "玉山 0012****5678"
  }),
  /** 製片審核 mock：尚未選定申請類型（對齊 cashier_detail / INV 編號示意） */
  withV5Amounts({
    id: "10",
    expenseNo: "MMA#00001",
    paymentRequestNo: "MUY-2604-005",
    project: "牧馬專案 A",
    applicant: "Eric Wang",
    category: "交通費",
    receiptType: "invoice",
    totalAmount: 3500,
    summary: "04/25 拍攝日勘景交通費用補貼",
    status: "producer_review",
    updatedAt: "2026-04-17 14:32",
    invoiceNo: "AB-12345678",
    expenseDate: "2026-04-17",
    bankMasked: "玉山 0012****5678"
  })
];

const wait = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));

export async function listRequests() {
  await wait();
  return requests;
}

export async function listRequestsByPaymentRequestNo(paymentRequestNo: string) {
  await wait();
  return requests.filter((r) => r.paymentRequestNo === paymentRequestNo);
}

export async function getRequestById(id: string): Promise<ExpenseRequest | undefined> {
  await wait();
  return requests.find((r) => r.id === id);
}

export async function createRequest(
  input: Omit<ExpenseRequest, "id" | "updatedAt" | "taxAmount" | "salesAmount" | "expenseNo" | "paymentRequestNo"> & {
    expenseNo?: string;
    paymentRequestNo?: string;
  }
) {
  await wait();
  const now = new Date();
  const row = withV5Amounts({
    ...input,
    expenseNo: input.expenseNo ?? nextExpenseNo(input.project),
    paymentRequestNo: input.paymentRequestNo ?? nextPaymentRequestNo(now),
    id: String(Date.now()),
    updatedAt: now.toISOString().slice(0, 16).replace("T", " ")
  });
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

/** 草稿刪除（PRD v4：刪除後附件同步刪除；此處僅移除 mock 資料） */
export async function deleteDraft(id: string) {
  await wait();
  requests = requests.filter((r) => !(r.id === id && r.status === "draft"));
}

/** 製片核准：選定申請類型並進入出納審核中（PRD v4） */
export async function producerApprove(id: string, applicationType: ApplicationType) {
  await wait();
  const ts = new Date().toISOString().slice(0, 16).replace("T", " ");
  requests = requests.map((r) =>
    r.id === id
      ? { ...r, applicationType, status: "treasury_review" as RequestStatus, updatedAt: ts }
      : r
  );
}

/** 製片退件 */
export async function producerReject(id: string) {
  await wait();
  const ts = new Date().toISOString().slice(0, 16).replace("T", " ");
  requests = requests.map((r) =>
    r.id === id ? { ...r, status: "rejected" as RequestStatus, updatedAt: ts } : r
  );
}

/** 出納步驟①：明細/單據確認 → 待收實體單據 */
export async function cashierConfirmDetails(id: string, notifyCount: number) {
  await wait();
  const ts = new Date().toISOString().slice(0, 16).replace("T", " ");
  requests = requests.map((r) =>
    r.id === id
      ? {
          ...r,
          status: "awaiting_physical_receipts" as RequestStatus,
          cashierNotifyCount: notifyCount,
          updatedAt: ts
        }
      : r
  );
}

/** 出納步驟②：單據核對完成 → 待匯款（並帶入預計出帳日） */
export async function cashierVerifyAndSchedulePayout(id: string, verifiedAt: string, payoutDate: string) {
  await wait();
  const ts = new Date().toISOString().slice(0, 16).replace("T", " ");
  requests = requests.map((r) =>
    r.id === id
      ? {
          ...r,
          status: "payment_pending" as RequestStatus,
          cashierVerifiedAt: verifiedAt,
          payoutDate,
          updatedAt: ts
        }
      : r
  );
}
