import type { ApplicationType, ExpenseRequest, RequestStatus } from "./types";

/** PRD v4：草稿亦使用正式流水號格式（示意 MMA#） */
let requests: ExpenseRequest[] = [
  {
    id: "1",
    requestNo: "MMA#00021",
    project: "牧馬專案 A",
    applicant: "Eric Wang",
    category: "交通費",
    amount: 3500,
    summary: "勘景交通補貼",
    status: "producer_review",
    updatedAt: "2026-05-05 09:30",
    invoiceNo: "AB-12345678",
    expenseDate: "2026-04-17",
    applicationType: "reimbursement",
    bankMasked: "玉山 0012****5678"
  },
  {
    id: "2",
    requestNo: "MMA#00022",
    project: "牧馬專案 A",
    applicant: "Amy Chen",
    category: "餐飲費",
    amount: 1200,
    summary: "工作餐敘",
    status: "draft",
    updatedAt: "2026-05-04 15:20",
    invoiceNo: "BC-23456789",
    expenseDate: "2026-04-18",
    applicationType: "reimbursement",
    bankMasked: "台新 0034****9012"
  },
  {
    id: "3",
    requestNo: "MMA#00018",
    project: "牧馬專案 B",
    applicant: "Patrick Lin",
    category: "道具費",
    amount: 8800,
    summary: "場景道具租借",
    status: "awaiting_physical_receipts",
    updatedAt: "2026-05-03 17:10",
    invoiceNo: "CD-34567890",
    expenseDate: "2026-04-19",
    applicationType: "unpaid",
    bankMasked: "國泰 0022****3456"
  },
  {
    id: "4",
    requestNo: "MMA#00015",
    project: "牧馬專案 B",
    applicant: "Kevin Liu",
    category: "交通費",
    amount: 2600,
    summary: "外景交通",
    status: "closed",
    updatedAt: "2026-04-28 11:00",
    invoiceNo: "DE-45678901",
    expenseDate: "2026-04-20",
    applicationType: "reimbursement",
    bankMasked: "中信 0045****6789"
  },
  {
    id: "5",
    requestNo: "MMA#00012",
    project: "牧馬專案 C",
    applicant: "Stella Wu",
    category: "後製費",
    amount: 5400,
    summary: "剪接外包費",
    status: "payment_pending",
    updatedAt: "2026-05-01 14:20",
    invoiceNo: "EF-56789012",
    expenseDate: "2026-04-21",
    applicationType: "overage",
    bankMasked: "玉山 0056****7890"
  },
  {
    id: "6",
    requestNo: "MMA#00009",
    project: "夏日廣告 B",
    applicant: "Sandy Ho",
    category: "器材費",
    amount: 6200,
    summary: "租借攝影燈",
    status: "producer_review",
    updatedAt: "2026-05-02 10:15",
    invoiceNo: "GH-55667788",
    expenseDate: "2026-04-15",
    applicationType: "reimbursement",
    bankMasked: "中信 0067****8901"
  },
  {
    id: "7",
    requestNo: "MMA#00007",
    project: "年終特輯 C",
    applicant: "Eric Wang",
    category: "材料費",
    amount: 1980,
    summary: "道具製作材料",
    status: "closed",
    updatedAt: "2026-04-10 16:40",
    invoiceNo: "IJ-99001122",
    expenseDate: "2026-03-28",
    applicationType: "surplus",
    bankMasked: "玉山 0012****5678"
  },
  {
    id: "8",
    requestNo: "MMA#00005",
    project: "年終特輯 C",
    applicant: "Molly Wu",
    category: "交通費",
    amount: 4560,
    summary: "來回高雄拍攝",
    status: "awaiting_physical_receipts",
    updatedAt: "2026-04-08 09:00",
    invoiceNo: "KL-33445566",
    expenseDate: "2026-03-22",
    applicationType: "unpaid",
    bankMasked: "富邦 0078****9012"
  },
  {
    id: "9",
    requestNo: "MMA#00004",
    project: "牧馬專案 A",
    applicant: "Lisa Wu",
    category: "場地費",
    amount: 15000,
    summary: "結餘補款—外景器材",
    status: "treasury_review",
    updatedAt: "2026-05-06 10:00",
    invoiceNo: "ZZ-001122",
    expenseDate: "2026-05-02",
    applicationType: "overage",
    bankMasked: "玉山 0012****5678"
  },
  /** 製片審核 mock：尚未選定申請類型（對齊 cashier_detail / INV 編號示意） */
  {
    id: "10",
    requestNo: "INV-2604-001",
    project: "牧馬專案 A",
    applicant: "Eric Wang",
    category: "交通費",
    amount: 3500,
    summary: "04/25 拍攝日勘景交通費用補貼",
    status: "producer_review",
    updatedAt: "2026-04-17 14:32",
    invoiceNo: "AB-12345678",
    expenseDate: "2026-04-17",
    bankMasked: "玉山 0012****5678"
  }
];

const wait = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));

export async function listRequests() {
  await wait();
  return requests;
}

export async function getRequestById(id: string): Promise<ExpenseRequest | undefined> {
  await wait();
  return requests.find((r) => r.id === id);
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
