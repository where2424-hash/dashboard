import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type ProjectCard = {
  id: string;
  code: string;
  name: string;
  owner: string;
  status: "進行中" | "暫停" | "已結案";
  expensePending: number;
  updatedAt: string;
};

const STORAGE_KEY = "company-overview-projects-v1";

const defaultProjects: ProjectCard[] = [
  {
    id: "p1",
    code: "MMA",
    name: "牧馬專案 A",
    owner: "Patrick Lin",
    status: "進行中",
    expensePending: 3,
    updatedAt: "2026/05/05"
  },
  {
    id: "p2",
    code: "MMB",
    name: "牧馬專案 B",
    owner: "Jenny Chen",
    status: "暫停",
    expensePending: 0,
    updatedAt: "2026/05/03"
  },
  {
    id: "p3",
    code: "MMC",
    name: "牧馬專案 C",
    owner: "Stella Wu",
    status: "已結案",
    expensePending: 0,
    updatedAt: "2026/04/28"
  }
];

function loadStoredProjects(): ProjectCard[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProjects;
    const parsed = JSON.parse(raw) as ProjectCard[];
    return Array.isArray(parsed) && parsed.length ? parsed : defaultProjects;
  } catch {
    return defaultProjects;
  }
}

function statusBadge(status: ProjectCard["status"]) {
  if (status === "進行中") return "badge badge-green";
  if (status === "暫停") return "badge badge-amber";
  return "badge badge-gray";
}

export function CompanyOverviewPage() {
  const nav = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [projects, setProjects] = useState<ProjectCard[]>(() => loadStoredProjects());

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(k) ||
        p.code.toLowerCase().includes(k) ||
        p.owner.toLowerCase().includes(k)
    );
  }, [keyword, projects]);

  return (
    <section className="po-page">
      <div className="po-topbar">
        <span className="po-breadcrumb">公司工作區</span>
        <span className="po-sep">/</span>
        <span className="po-title">公司專案總覽</span>
      </div>

      <div className="po-content">
        <article className="po-sec">
          <div className="po-sec-head">
            <span className="po-sec-title">公司所有專案</span>
            <span className="po-sec-sub">預設顯示該公司底下全部專案小卡</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                className="bi"
                placeholder="搜尋：專案 / 簡碼 / 管理人"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                style={{ width: 220 }}
              />
              <button
                className="po-btn po-btn-ghost"
                onClick={() =>
                  setProjects((p) => [
                    ...p,
                    {
                      id: `p${p.length + 1}`,
                      code: `NEW${p.length + 1}`,
                      name: "新專案（Demo）",
                      owner: "Company Owner",
                      status: "進行中",
                      expensePending: 0,
                      updatedAt: "2026/05/06"
                    }
                  ])
                }
              >
                ＋ 建立新專案（Demo）
              </button>
            </div>
          </div>
          <div className="po-sec-body">
            <div className="co-grid">
              {filtered.map((p) => (
                <article
                  key={p.id}
                  className="co-card"
                  onClick={() => {
                    nav(`/projects/${p.id}/overview`);
                  }}
                >
                  <div className="co-head">
                    <div className="co-title">
                      <span className="co-code">{p.code}</span>
                      <span>{p.name}</span>
                    </div>
                    <span className={statusBadge(p.status)}>{p.status}</span>
                  </div>
                  <div className="co-meta">
                    <div className="co-row">
                      <span className="co-k">專案管理人</span>
                      <span className="co-v">{p.owner}</span>
                    </div>
                    <div className="co-row">
                      <span className="co-k">待審報帳</span>
                      <span className="co-v">
                        {p.expensePending ? (
                          <span className="co-pill co-pill-red">{p.expensePending} 筆</span>
                        ) : (
                          <span className="co-pill">0 筆</span>
                        )}
                      </span>
                    </div>
                    <div className="co-row">
                      <span className="co-k">更新時間</span>
                      <span className="co-v">{p.updatedAt}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {!filtered.length ? (
              <div style={{ fontSize: 11, color: "#888", textAlign: "center", padding: 20 }}>
                沒有符合的專案
              </div>
            ) : null}
          </div>
        </article>
      </div>
    </section>
  );
}

