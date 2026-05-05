import { useEffect, useMemo, useState } from "react";

type CompanyLookup = {
  name: string;
  owner: string;
  address: string;
};

type CompanyForm = {
  taxId: string;
  phone: string;
  email: string;
  supportingDoc: File | null;
};

type ReviewStatus = "未審核" | "已審核";

function isValidTaiwanTaxId(input: string): boolean {
  // 簡化版台灣統編 checksum 驗證（前端示意）
  if (!/^\d{8}$/.test(input)) return false;
  const digits = input.split("").map((x) => Number(x));
  const weights = [1, 2, 1, 2, 1, 2, 4, 1];
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    const product = digits[i] * weights[i];
    sum += Math.floor(product / 10) + (product % 10);
  }
  return sum % 10 === 0 || (digits[6] === 7 && (sum + 1) % 10 === 0);
}

async function mockLookupCompanyByTaxId(taxId: string): Promise<{ exists: boolean; company: CompanyLookup }> {
  await new Promise((r) => setTimeout(r, 350));
  if (taxId === "12345678") {
    return {
      exists: true,
      company: {
        name: "牧馬影視製作",
        owner: "Patrick Lin",
        address: "台北市信義區松高路 1 號"
      }
    };
  }
  if (taxId === "24536806") {
    return {
      exists: false,
      company: {
        name: "木馬創意工作室",
        owner: "Jenny Chen",
        address: "台北市大安區復興南路 99 號"
      }
    };
  }
  return {
    exists: false,
    company: {
      name: "（公開資料查得）示意公司",
      owner: "（公開資料查得）示意負責人",
      address: "（公開資料查得）示意地址"
    }
  };
}

export function CompanyCreatePage() {
  const [taxError, setTaxError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookup, setLookup] = useState<CompanyLookup | null>(null);
  const [exists, setExists] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>("未審核");
  const [submitOk, setSubmitOk] = useState(false);

  const [form, setForm] = useState<CompanyForm>({
    taxId: "",
    phone: "",
    email: "",
    supportingDoc: null
  });

  const canSubmit = useMemo(() => {
    if (!form.taxId || taxError) return false;
    if (!lookup) return false;
    if (exists) return false;
    return true;
  }, [exists, form.taxId, lookup, taxError]);

  useEffect(() => {
    setSubmitOk(false);
    setReviewStatus("未審核");
    setLookup(null);
    setExists(false);
  }, [form.taxId]);

  async function runLookupIfValid(taxId: string) {
    setLookupLoading(true);
    try {
      const res = await mockLookupCompanyByTaxId(taxId);
      setLookup(res.company);
      setExists(res.exists);
    } finally {
      setLookupLoading(false);
    }
  }

  return (
    <section className="po-page">
      <div className="po-topbar">
        <span className="po-breadcrumb">公司工作區</span>
        <span className="po-sep">/</span>
        <span className="po-title">建立公司</span>
      </div>

      <div className="po-content">
        <article className="po-sec">
          <div className="po-sec-head">
            <span className="po-sec-title">建立公司申請表單</span>
            <span className="po-sec-sub">統編驗證 → 公開資料帶入 → 補聯絡資訊 → 送出（未審核）</span>
          </div>
          <div className="po-sec-body">
            <div className="po-step-block">
              <div className="po-if">
                <label>統一編號（8 碼）</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    className="bi"
                    placeholder="例如：24536806"
                    value={form.taxId}
                    onChange={(e) => {
                      const value = e.target.value.trim();
                      setForm((f) => ({ ...f, taxId: value }));
                      if (!value) {
                        setTaxError("");
                      } else if (!/^\d{8}$/.test(value)) {
                        setTaxError("統編需為 8 碼數字");
                      } else if (!isValidTaiwanTaxId(value)) {
                        setTaxError("統編格式不符合 checksum 規則（示意）");
                      } else {
                        setTaxError("");
                      }
                    }}
                  />
                  <button
                    className="po-btn po-btn-ghost"
                    disabled={!form.taxId || !!taxError || lookupLoading}
                    onClick={() => void runLookupIfValid(form.taxId)}
                  >
                    {lookupLoading ? "查詢中…" : "查詢公開資料"}
                  </button>
                </div>
                {taxError ? <div className="po-error">{taxError}</div> : null}
                {!taxError && form.taxId ? <div className="po-hint">✓ 統編格式通過基本驗證。</div> : null}
              </div>

              {lookup ? (
                <div className="po-sec" style={{ borderRadius: 10 }}>
                  <div className="po-sec-head">
                    <span className="po-sec-title">公開資料帶入（不可修改）</span>
                    <span className="po-sec-sub">由後端依公開資料來源查詢後回填</span>
                  </div>
                  <div className="po-sec-body">
                    {exists ? (
                      <div className="po-error" style={{ marginBottom: 8 }}>
                        此統編公司已建立。請聯繫負責人（{lookup.owner}）以取得存取權限。
                      </div>
                    ) : null}
                    <div className="po-info-grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
                      <div className="po-if">
                        <label>公司名稱</label>
                        <div>{lookup.name}</div>
                      </div>
                      <div className="po-if">
                        <label>負責人</label>
                        <div>{lookup.owner}</div>
                      </div>
                      <div className="po-if">
                        <label>公司地址</label>
                        <div>{lookup.address}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="po-sec" style={{ borderRadius: 10 }}>
                <div className="po-sec-head">
                  <span className="po-sec-title">聯絡資訊（可編輯）</span>
                  <span className="po-sec-sub">電話 / 信箱</span>
                </div>
                <div className="po-sec-body">
                  <div className="po-info-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                    <div className="po-if">
                      <label>電話</label>
                      <input
                        className="bi"
                        placeholder="02-1234-5678"
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      />
                    </div>
                    <div className="po-if">
                      <label>信箱</label>
                      <input
                        className="bi"
                        placeholder="contact@example.com"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="po-sec" style={{ borderRadius: 10 }}>
                <div className="po-sec-head">
                  <span className="po-sec-title">公司證明文件（可後補）</span>
                  <span className="po-sec-sub">可先送出申請，後續再補件</span>
                </div>
                <div className="po-sec-body">
                  <input
                    type="file"
                    onChange={(e) => setForm((f) => ({ ...f, supportingDoc: e.target.files?.[0] ?? null }))}
                  />
                  <div className="po-hint">{form.supportingDoc ? `已選取：${form.supportingDoc.name}` : "尚未上傳（允許）。"}</div>
                </div>
              </div>

              <div className="po-sec" style={{ borderRadius: 10 }}>
                <div className="po-sec-head">
                  <span className="po-sec-title">申請狀態</span>
                  <span className="po-sec-sub">審核完成前為未審核狀態</span>
                </div>
                <div className="po-sec-body">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className={`badge ${reviewStatus === "未審核" ? "badge-amber" : "badge-green"}`}>{reviewStatus}</span>
                    {submitOk ? <span className="po-hint">已送出申請，等待審核。</span> : <span className="po-hint">尚未送出。</span>}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button
                  className="po-btn po-btn-ghost"
                  onClick={() => {
                    setForm({ taxId: "", phone: "", email: "", supportingDoc: null });
                    setTaxError("");
                    setLookup(null);
                    setExists(false);
                    setReviewStatus("未審核");
                    setSubmitOk(false);
                  }}
                >
                  清除
                </button>
                <button
                  className="po-btn"
                  disabled={!canSubmit}
                  onClick={() => {
                    setSubmitOk(true);
                    setReviewStatus("未審核");
                  }}
                >
                  送出建立申請
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

