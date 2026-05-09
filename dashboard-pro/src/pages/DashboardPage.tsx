import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type ModuleCard = {
  id: string;
  title: string;
  desc: string;
  badge: string;
  tone: "green" | "purple" | "amber" | "blue" | "gray";
  icon: "calendar" | "user" | "card" | "folder" | "clock" | "table" | "members";
};

export function DashboardPage() {
  const navigate = useNavigate();
  const storageKey = "dashboard-home-layout-v1";
  const initialModules = useMemo<ModuleCard[]>(
    () => [
      { id: "schedule", title: "日程表", desc: "拍攝進度與里程碑", badge: "Shooting 04/25", tone: "green", icon: "calendar" },
      { id: "labor", title: "勞報單", desc: "勞務申報與稅務計算", badge: "6 份勞報單", tone: "purple", icon: "user" },
      { id: "expense", title: "報帳系統", desc: "費用申報與審核流程", badge: "3 筆待審核", tone: "amber", icon: "card" },
      { id: "document", title: "文件夾", desc: "合約、通告單、文件", badge: "12 份文件", tone: "blue", icon: "folder" },
      { id: "history", title: "修改歷程", desc: "所有操作記錄追蹤", badge: "今日 5 筆更新", tone: "gray", icon: "clock" },
      { id: "overview", title: "專案總覽", desc: "預算、設定、負責人", badge: "管理人 / 製片", tone: "purple", icon: "table" },
      { id: "members", title: "成員清單", desc: "專案成員與角色管理", badge: "管理人 / 製片", tone: "gray", icon: "members" }
    ],
    []
  );
  const [editing, setEditing] = useState(false);
  const [slots, setSlots] = useState<Array<ModuleCard | null>>(() => {
    const fallback = [...initialModules.slice(0, 5), null, ...initialModules.slice(5), null];
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return fallback;
    try {
      const order = JSON.parse(raw) as Array<string | null>;
      const idMap = new Map(initialModules.map((m) => [m.id, m]));
      const restored = order.map((id) => (id ? idMap.get(id) ?? null : null));
      return restored.length === 9 ? restored : fallback;
    } catch {
      return fallback;
    }
  });
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  useEffect(() => {
    const ids = slots.map((s) => s?.id ?? null);
    window.localStorage.setItem(storageKey, JSON.stringify(ids));
  }, [slots]);

  function onDrop(targetIdx: number) {
    if (draggingIdx === null || draggingIdx === targetIdx) return;
    const next = [...slots];
    const source = next[draggingIdx];
    const target = next[targetIdx];
    next[targetIdx] = source;
    next[draggingIdx] = target;
    setSlots(next);
    setDraggingIdx(null);
    setOverIdx(null);
  }

  function renderCardIcon(icon: ModuleCard["icon"]) {
    if (icon === "calendar") {
      return (
        <svg viewBox="0 0 14 14" fill="none" width="13" height="13">
          <rect x="1" y="2" width="12" height="11" rx="1.5" stroke="#3B6D11" strokeWidth="1.2" />
          <path d="M1 5h12M4 1v2M10 1v2" stroke="#3B6D11" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    }
    if (icon === "user") {
      return (
        <svg viewBox="0 0 14 14" fill="none" width="13" height="13">
          <path d="M7 1a3 3 0 100 6 3 3 0 000-6z" stroke="#3C3489" strokeWidth="1.2" />
          <path d="M1 13c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#3C3489" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    }
    if (icon === "card") {
      return (
        <svg viewBox="0 0 14 14" fill="none" width="13" height="13">
          <rect x="1" y="3" width="12" height="9" rx="1.5" stroke="#854F0B" strokeWidth="1.2" />
          <path d="M1 6h12" stroke="#854F0B" strokeWidth="1.2" />
          <circle cx="4" cy="9" r="0.8" fill="#854F0B" />
        </svg>
      );
    }
    if (icon === "folder") {
      return (
        <svg viewBox="0 0 14 14" fill="none" width="13" height="13">
          <path d="M1 3.5C1 2.67 1.67 2 2.5 2H6l1.5 2H12a1.5 1.5 0 011.5 1.5V11A1.5 1.5 0 0112 12.5H2.5A1.5 1.5 0 011 11V3.5z" stroke="#185FA5" strokeWidth="1.2" />
        </svg>
      );
    }
    if (icon === "clock") {
      return (
        <svg viewBox="0 0 14 14" fill="none" width="13" height="13">
          <circle cx="7" cy="7" r="5.5" stroke="#5F5E5A" strokeWidth="1.2" />
          <path d="M7 4v3.5l2 1.5" stroke="#5F5E5A" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    }
    if (icon === "table") {
      return (
        <svg viewBox="0 0 14 14" fill="none" width="13" height="13">
          <rect x="1" y="1" width="12" height="12" rx="2" stroke="#3C3489" strokeWidth="1.2" />
          <path d="M4 5h6M4 7.5h4M4 10h5" stroke="#3C3489" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 14 14" fill="none" width="13" height="13">
        <circle cx="5" cy="4" r="2.5" stroke="#5F5E5A" strokeWidth="1.2" />
        <path d="M1 12c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="#5F5E5A" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="10.5" cy="4.5" r="2" stroke="#5F5E5A" strokeWidth="1.2" />
        <path d="M12 10c1 .4 2 1.3 2 3" stroke="#5F5E5A" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }

  function goByCardId(id: string) {
    const map: Record<string, string> = {
      schedule: "/schedule",
      labor: "/labor",
      expense: "/expenses",
      document: "/document",
      history: "/history",
      overview: "/projects/1/overview",
      members: "/members"
    };
    const nextPath = map[id];
    if (nextPath) navigate(nextPath);
  }

  return (
    <section className="home-wrap">
      <div className="home-greeting">早安，Gillian</div>
      <div className="home-sub">牧馬專案 A · 2026/04/25 · 3 筆報帳待審核</div>

      <div className="quick-row">
        <article className="quick-card">
          <div className="quick-title">待我處理的報帳</div>
          <div className="quick-item">
            <span className="q-mono">#001</span>
            <span className="q-name">Eric Wang · 交通費用</span>
            <span className="badge badge-amber">審核中</span>
          </div>
          <div className="quick-item">
            <span className="q-mono">#003</span>
            <span className="q-name">Patrick Lin · 道具費用</span>
            <span className="badge badge-amber">審核中</span>
          </div>
          <div className="quick-item">
            <span className="q-mono">#006</span>
            <span className="q-name">Jason Huang · 人員費用</span>
            <span className="badge badge-amber">審核中</span>
          </div>
        </article>

        <article className="quick-card">
          <div className="quick-title">近期日程</div>
          <div className="quick-item">
            <span className="q-mono">04/25</span>
            <span className="q-name">Shooting Day 1</span>
            <span className="badge badge-green">今天</span>
          </div>
          <div className="quick-item">
            <span className="q-mono">04/27</span>
            <span className="q-name">A copy 剪接</span>
            <span className="badge badge-gray">2 天後</span>
          </div>
          <div className="quick-item">
            <span className="q-mono">04/30</span>
            <span className="q-name">客戶回覆截止</span>
            <span className="badge badge-red">5 天後</span>
          </div>
        </article>
      </div>

      <div className="grid-section">
        <div className="grid-label-row">
          <span className="grid-label">所有功能</span>
          <div style={{ display: "flex", gap: 6 }}>
            <button className={editing ? "edit-btn active" : "edit-btn"} onClick={() => setEditing((v) => !v)}>
              編輯排列
            </button>
            {editing ? (
              <button className="confirm-btn" onClick={() => setEditing(false)}>
                確認
              </button>
            ) : null}
          </div>
        </div>

        <div className={editing ? "module-grid editing" : "module-grid"}>
          {slots.map((slot, idx) => {
            if (slot) {
              return (
                <article
                  key={slot.id}
                  className={overIdx === idx ? "mc drag-over" : "mc"}
                  draggable={editing}
                  onClick={() => {
                    if (!editing) goByCardId(slot.id);
                  }}
                  onDragStart={() => setDraggingIdx(idx)}
                  onDragEnd={() => {
                    setDraggingIdx(null);
                    setOverIdx(null);
                  }}
                  onDragOver={(e) => {
                    if (!editing) return;
                    e.preventDefault();
                    setOverIdx(idx);
                  }}
                  onDrop={() => onDrop(idx)}
                >
                  <div className={`mc-icon tone-${slot.tone}`}>
                    {renderCardIcon(slot.icon)}
                  </div>
                  <div className="mc-title">{slot.title}</div>
                  <div className="mc-desc">{slot.desc}</div>
                  <span className={`mc-badge badge-${slot.tone === "amber" ? "red" : slot.tone}`}>
                    {slot.badge}
                  </span>
                </article>
              );
            }
            return (
              <div
                key={`empty-${idx}`}
                className={overIdx === idx ? "mc-empty drag-over" : "mc-empty"}
                onDragOver={(e) => {
                  if (!editing) return;
                  e.preventDefault();
                  setOverIdx(idx);
                }}
                onDrop={() => onDrop(idx)}
              >
                可拖曳至此
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
