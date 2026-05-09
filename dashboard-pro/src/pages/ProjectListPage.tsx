import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type ListMode = "create" | "apply" | "invited" | "joined";

function readProjectList(): string[] {
  const fallback = ["牧馬專案 A", "牧馬專案 B", "牧馬專案 C", "夏日廣告 B", "年終特輯 C"];
  try {
    const raw = window.localStorage.getItem("project-list-v1");
    if (!raw) return fallback;
    const list = JSON.parse(raw) as unknown;
    if (!Array.isArray(list)) return fallback;
    const names = list.map((x) => String(x)).filter(Boolean);
    return names.length ? names : fallback;
  } catch {
    return fallback;
  }
}

export function ProjectListPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<ListMode>("joined");
  const [projects, setProjects] = useState<string[]>(() => readProjectList());

  useEffect(() => {
    // sync if user creates a project in another flow
    function onStorage(e: StorageEvent) {
      if (e.key === "project-list-v1") setProjects(readProjectList());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const cards = useMemo(() => {
    if (mode !== "joined") return [];
    return projects.map((name) => ({
      name,
      code: (() => {
        try {
          const raw = window.localStorage.getItem(`project-overview-info-v1:${name}`);
          if (!raw) return "PRJ";
          const info = JSON.parse(raw) as { code?: string };
          return (info.code ?? "PRJ").toUpperCase();
        } catch {
          return "PRJ";
        }
      })()
    }));
  }, [mode, projects]);

  function activateProject(name: string) {
    try {
      window.localStorage.setItem("active-project-name", name);
      window.dispatchEvent(new CustomEvent("active-project-name-changed", { detail: name }));
    } catch {
      // ignore
    }
    nav("/projects/1/overview");
  }

  const options: { id: ListMode; title: string; desc: string; dot: string }[] = [
    { id: "create", title: "新增", desc: "建立全新專案，設定管理人、成員、日程、文件等初始資訊", dot: "dot-green" },
    { id: "apply", title: "申請加入", desc: "搜尋現有專案並送出加入申請，等待管理人審核通過", dot: "dot-blue" },
    { id: "invited", title: "已邀請待確認", desc: "顯示尚未回覆的邀請通知，可選擇接受或拒絕加入", dot: "dot-orange" },
    { id: "joined", title: "已加入", desc: "列出所有已確認加入的專案，可直接點擊進入專案頁面", dot: "dot-green2" }
  ];

  return (
    <section className="pl-page">
      <div className="pl-wrap">
        <aside className="pl-left">
          <div className="pl-left-head">
            <div className="pl-left-title">專案清單</div>
          </div>
          <div className="pl-left-menu">
            {options.map((o) => (
              <button
                key={o.id}
                className={mode === o.id ? "pl-left-item pl-left-item-sel" : "pl-left-item"}
                onClick={() => setMode(o.id)}
              >
                <span className="pl-left-icon">+</span>
                <span>{o.title}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="pl-main">
          <div className="pl-main-head">
            <div className="pl-main-title">點擊「專案清單」，後展開四個子選項</div>
          </div>

          <div className="pl-options">
            {options.map((o) => (
              <button
                key={o.id}
                className={mode === o.id ? "pl-opt pl-opt-sel" : "pl-opt"}
                onClick={() => setMode(o.id)}
              >
                <span className={`pl-dot ${o.dot}`} />
                <div className="pl-opt-body">
                  <div className="pl-opt-title">{o.title}</div>
                  <div className="pl-opt-desc">{o.desc}</div>
                </div>
              </button>
            ))}
          </div>

          {mode === "create" ? (
            <div className="pl-panel">
              <div className="pl-panel-title">建立新專案</div>
              <div className="pl-panel-actions">
                <Link className="po-btn po-btn-primary" to="/projects/new">＋ 新增專案</Link>
              </div>
            </div>
          ) : null}

          {mode === "joined" ? (
            <div className="pl-panel">
              <div className="pl-panel-title">已加入的專案</div>
              <div className="pl-cards">
                {cards.map((c) => (
                  <button key={c.name} className="pl-card" onClick={() => activateProject(c.name)}>
                    <div className="pl-card-code">{c.code}</div>
                    <div className="pl-card-name">{c.name}</div>
                    <div className="pl-card-sub">點擊切換並進入專案總覽</div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {mode === "apply" ? (
            <div className="pl-panel">
              <div className="pl-panel-title">申請加入（示意）</div>
              <div className="pl-panel-muted">此區塊先做 UI 佔位；若你希望我接上 mock API/搜尋流程，再把規格補齊。</div>
            </div>
          ) : null}

          {mode === "invited" ? (
            <div className="pl-panel">
              <div className="pl-panel-title">已邀請待確認（示意）</div>
              <div className="pl-panel-muted">此區塊先做 UI 佔位；之後可接通知中心或 mock 資料。</div>
            </div>
          ) : null}
        </main>
      </div>
    </section>
  );
}

