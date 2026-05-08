import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type Props = {
  onCreated?: (projectName: string) => void;
};

type ProjectType = "廣告" | "電影" | "活動" | "其他";
type Modules = { members: boolean; schedule: boolean; document: boolean; expenses: boolean };

function deriveProjectCode(name: string): string {
  const trimmed = (name ?? "").trim();
  const m = trimmed.match(/[A-Za-z0-9]+/g);
  const token = (m?.[0] ?? "PRJ").toUpperCase();
  return token.slice(0, 3).padEnd(3, "X");
}

export function ProjectCreatePage({ onCreated }: Props) {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [team, setTeam] = useState("牧馬影視製作");
  const [client, setClient] = useState("");
  const [owner, setOwner] = useState("Patrick Lin");
  const [projectType, setProjectType] = useState<ProjectType>("廣告");
  const [shootDate, setShootDate] = useState("");
  const [shootDays, setShootDays] = useState("2");
  const [modules, setModules] = useState<Modules>({
    members: true,
    schedule: true,
    document: true,
    expenses: true
  });
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);

  const canSubmit = useMemo(() => name.trim().length >= 2 && team.trim().length >= 2, [name, team]);

  function submit() {
    const projectName = name.trim();
    if (projectName.length < 2) {
      setErr("專案名稱至少 2 個字");
      return;
    }
    if (team.trim().length < 2) {
      setErr("公司/團隊名稱至少 2 個字");
      return;
    }
    const projectCode = (code.trim() || deriveProjectCode(projectName)).toUpperCase();
    if (!/^[A-Z0-9]{2,6}$/.test(projectCode)) {
      setErr("專案簡碼需為 2~6 碼英數");
      return;
    }
    const shootDaysNum = shootDays.trim() ? Number(shootDays.trim()) : undefined;
    if (shootDaysNum !== undefined && (!Number.isFinite(shootDaysNum) || shootDaysNum <= 0)) {
      setErr("拍攝區間需為正整數（天）");
      return;
    }

    setErr("");
    setOk(true);

    // 1) update project list
    try {
      const raw = window.localStorage.getItem("project-list-v1");
      const list = raw ? (JSON.parse(raw) as unknown) : [];
      const names = Array.isArray(list) ? list.map((x) => String(x)) : [];
      const next = names.includes(projectName) ? names : [projectName, ...names];
      window.localStorage.setItem("project-list-v1", JSON.stringify(next));
    } catch {
      // ignore
    }

    // 2) seed project overview info for this project
    try {
      window.localStorage.setItem(
        `project-overview-info-v1:${projectName}`,
        JSON.stringify({
          name: projectName,
          client: client.trim() || "—",
          company: team.trim() || "—",
          code: projectCode,
          projectType,
          shootDate: shootDate.trim() || undefined,
          shootDays: shootDaysNum,
          modules,
          start: "2026/05/01",
          end: "2026/12/31",
          owner: owner.trim() || "—",
          status: "進行中"
        })
      );
    } catch {
      // ignore
    }

    // 3) set active project
    try {
      window.localStorage.setItem("active-project-name", projectName);
      window.dispatchEvent(new CustomEvent("active-project-name-changed", { detail: projectName }));
    } catch {
      // ignore
    }

    onCreated?.(projectName);
    nav("/projects/1/overview");
  }

  return (
    <section className="po-page">
      <div className="po-content">
        <article className="po-sec">
          <div className="po-sec-head">
            <span className="po-sec-title">建立專案</span>
            <span className="po-sec-sub">建立後會出現在左上角專案下拉選單</span>
          </div>
          <div className="po-sec-body">
            <div className="po-info-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
              <div className="po-if">
                <label>專案代碼</label>
                <input
                  className="bi"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={name.trim() ? `系統自動生成：${deriveProjectCode(name)}` : "系統自動生成"}
                />
              </div>
              <div className="po-if">
                <label>專案名稱 *</label>
                <input className="bi" value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：牧馬專案 A" />
              </div>

              <div className="po-if">
                <label>公司名稱 *</label>
                <input className="bi" value={team} onChange={(e) => setTeam(e.target.value)} placeholder="後續顯示於旁邊導覽及發票抬頭" />
              </div>
              <div className="po-if">
                <label>專案類型</label>
                <select className="bi" value={projectType} onChange={(e) => setProjectType(e.target.value as ProjectType)}>
                  <option value="廣告">廣告</option>
                  <option value="電影">電影</option>
                  <option value="活動">活動</option>
                  <option value="其他">其他</option>
                </select>
              </div>

              <div className="po-if">
                <label>專案管理人</label>
                <input className="bi" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="選擇或輸入管理人（示意）" />
              </div>
              <div className="po-if">
                <label>預計拍攝日期</label>
                <input className="bi" value={shootDate} onChange={(e) => setShootDate(e.target.value)} placeholder="2026 / MM / DD" />
              </div>

              <div className="po-if">
                <label>客戶名稱（選填）</label>
                <input className="bi" value={client} onChange={(e) => setClient(e.target.value)} placeholder="e.g. 某某品牌" />
              </div>
              <div className="po-if">
                <label>拍攝區間</label>
                <input className="bi" value={shootDays} onChange={(e) => setShootDays(e.target.value)} placeholder="2 天" />
              </div>
            </div>

            <div className="po-sec" style={{ borderRadius: 10, marginTop: 12 }}>
              <div className="po-sec-head">
                <span className="po-sec-title">啟用功能模組</span>
                <span className="po-sec-sub">可先全選，後續再到專案總覽調整</span>
              </div>
              <div className="po-sec-body">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 }}>
                  <label className="po-chip">
                    <input
                      type="checkbox"
                      checked={modules.members}
                      onChange={(e) => setModules((m) => ({ ...m, members: e.target.checked }))}
                    />
                    <span>成員清單</span>
                  </label>
                  <label className="po-chip">
                    <input
                      type="checkbox"
                      checked={modules.schedule}
                      onChange={(e) => setModules((m) => ({ ...m, schedule: e.target.checked }))}
                    />
                    <span>Schedule</span>
                  </label>
                  <label className="po-chip">
                    <input
                      type="checkbox"
                      checked={modules.document}
                      onChange={(e) => setModules((m) => ({ ...m, document: e.target.checked }))}
                    />
                    <span>Document</span>
                  </label>
                  <label className="po-chip">
                    <input
                      type="checkbox"
                      checked={modules.expenses}
                      onChange={(e) => setModules((m) => ({ ...m, expenses: e.target.checked }))}
                    />
                    <span>報帳系統</span>
                  </label>
                </div>
              </div>
            </div>

            {err ? <div className="po-error">{err}</div> : null}
            {ok ? <div className="po-hint">✓ 已建立專案並切換。</div> : null}

            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button className="po-btn po-btn-primary" disabled={!canSubmit} onClick={submit}>
                建立並切換
              </button>
              <Link className="po-btn po-btn-ghost" to="/projects/1/overview">
                取消
              </Link>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

