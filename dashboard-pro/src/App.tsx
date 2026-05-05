import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import { DashboardPage } from "./pages/DashboardPage";
import { ExpensesPage } from "./pages/ExpensesPage";
import { NewRequestPage } from "./pages/NewRequestPage";
import { RequestDetailPage } from "./pages/RequestDetailPage";
import { ProjectOverviewPage } from "./pages/ProjectOverviewPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import type { Role } from "./types";

const roleLabel: Record<Role, string> = {
  admin: "Admin",
  producer: "Producer",
  treasury: "Treasury",
  member: "Member"
};

export function App() {
  const [role, setRole] = useState<Role>("producer");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const projectNav = useMemo(
    () => [
      { to: "/", label: "首頁", icon: "home" },
      { to: "/projects/1/overview", label: "專案總覽", icon: "overview" },
      { to: "/schedule", label: "日程表", icon: "schedule" },
      { to: "/labor", label: "勞報單", icon: "labor" },
      { to: "/expenses", label: "報帳系統", icon: "expense", badge: "3" },
      { to: "/document", label: "文件夾", icon: "document" },
      { to: "/members", label: "成員清單", icon: "members" }
    ],
    []
  );
  const personalNav = useMemo(
    () => [
      { to: "/history", label: "修改歷程", icon: "history" },
      { to: "/profile", label: "個人資料", icon: "profile" },
      { to: "/notifications", label: "通知中心", icon: "notifications" }
    ],
    []
  );

  function navIcon(key: string) {
    if (key === "home") {
      return (
        <svg className="nav-svg" viewBox="0 0 14 14" fill="none">
          <path d="M2 6.5L7 2l5 4.5V12a1 1 0 01-1 1H3a1 1 0 01-1-1V6.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      );
    }
    if (key === "overview") {
      return (
        <svg className="nav-svg" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
          <path d="M4 5h6M4 7.5h4M4 10h5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      );
    }
    if (key === "schedule") {
      return (
        <svg className="nav-svg" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="2" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M1 5h12M4 1v2M10 1v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    }
    if (key === "labor" || key === "profile") {
      return (
        <svg className="nav-svg" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="4" r="3" stroke="currentColor" strokeWidth="1.2" />
          <path d="M1 13c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    }
    if (key === "expense") {
      return (
        <svg className="nav-svg" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="3" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M1 6h12" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="4" cy="9" r="0.8" fill="currentColor" />
        </svg>
      );
    }
    if (key === "document") {
      return (
        <svg className="nav-svg" viewBox="0 0 14 14" fill="none">
          <path d="M1 3.5C1 2.67 1.67 2 2.5 2H6l1.5 2H12a1.5 1.5 0 011.5 1.5V11A1.5 1.5 0 0112 12.5H2.5A1.5 1.5 0 011 11V3.5z" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      );
    }
    if (key === "members") {
      return (
        <svg className="nav-svg" viewBox="0 0 14 14" fill="none">
          <circle cx="5" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M1 12c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="10.5" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.2" />
          <path d="M12 10c1 .4 2 1.3 2 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    }
    if (key === "history") {
      return (
        <svg className="nav-svg" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M7 4v3.5l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    return (
      <svg className="nav-svg" viewBox="0 0 14 14" fill="none">
        <path d="M7.5 1.5a4.5 4.5 0 014.5 4.5c0 2.5.7 4 1.5 4.5H1.5C2.3 10 3 8.5 3 6a4.5 4.5 0 014.5-4.5z" stroke="currentColor" strokeWidth="1.2" />
        <path d="M6 10.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }

  return (
    <div className="app">
      <aside className={sidebarCollapsed ? "sidebar collapsed" : "sidebar"}>
        <div className="sidebar-logo">
          <div className="logo-dot">D</div>
          <span className="logo-text">Dashboard</span>
          <button className="collapse-btn" onClick={() => setSidebarCollapsed((s) => !s)}>
            ◀
          </button>
        </div>
        <div className="project-selector">
          <div className="project-pill">
            <div className="project-icon">牧</div>
            <span className="pill-name">牧馬專案 A</span>
          </div>
        </div>
        <div className="nav-section">
          {projectNav.map((item, idx) => (
            <div key={item.to}>
              {idx === 1 ? <div className="nav-label">專案模組</div> : null}
              <NavLink
                to={item.to}
                className={({ isActive }) => (isActive ? "nav active" : "nav")}
              >
                <span className="nav-icon">{navIcon(item.icon)}</span>
                <span className="nav-text">{item.label}</span>
                {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
              </NavLink>
            </div>
          ))}
          <div className="nav-label">個人</div>
          {personalNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "nav active" : "nav")}
            >
              <span className="nav-icon">{navIcon(item.icon)}</span>
              <span className="nav-text">{item.label}</span>
            </NavLink>
          ))}
        </div>
        <div className="sidebar-bottom">
          <div className="user-row">
            <div className="avatar">GL</div>
            <div className="user-info">
              <p>Gillian Lin</p>
              <span>製片 · 管理人</span>
            </div>
          </div>
        </div>
      </aside>
      <main className="main" onClick={() => setNotifOpen(false)}>
        <header className="topbar">
          <span className="topbar-title">
            {location.pathname === "/"
              ? "首頁"
              : location.pathname.startsWith("/projects")
                ? "專案總覽"
                : location.pathname.startsWith("/expenses/new")
                  ? "新增報帳申請"
                  : location.pathname.startsWith("/expenses/")
                    ? "申請明細"
                    : location.pathname.startsWith("/expenses")
                      ? "報帳系統"
                      : location.pathname.startsWith("/schedule")
                        ? "日程表"
                        : location.pathname.startsWith("/labor")
                          ? "勞報單"
                          : location.pathname.startsWith("/document")
                            ? "文件夾"
                            : location.pathname.startsWith("/members")
                              ? "成員清單"
                              : location.pathname.startsWith("/history")
                                ? "修改歷程"
                                : location.pathname.startsWith("/profile")
                                  ? "個人資料"
                                  : "通知中心"}
          </span>
          <div className="topbar-right">
            <select
              className="role-select"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              {Object.entries(roleLabel).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <div className="notif-wrap">
              <button className="bell-btn" onClick={(e) => {
                e.stopPropagation();
                setNotifOpen((v) => !v);
              }}>
                {navIcon("notifications")}
                <span className="bell-dot" />
              </button>
              {notifOpen ? (
                <div className="notif-panel">
                  <div className="notif-head">通知</div>
                  <div className="notif-item">Patrick Lin 退回了報帳申請 #003</div>
                  <div className="notif-item">報帳申請 #002 已確認收到實體單據</div>
                  <div className="notif-item">Amy Chen 上傳了新文件</div>
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <div className="content">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/projects/:id/overview" element={<ProjectOverviewPage />} />
            <Route path="/schedule" element={<PlaceholderPage title="日程表" />} />
            <Route path="/labor" element={<PlaceholderPage title="勞報單" />} />
            <Route path="/expenses" element={<ExpensesPage role={role} />} />
            <Route path="/expenses/new" element={<NewRequestPage />} />
            <Route path="/expenses/:id" element={<RequestDetailPage role={role} />} />
            <Route path="/document" element={<PlaceholderPage title="文件夾" />} />
            <Route path="/members" element={<PlaceholderPage title="成員清單" />} />
            <Route path="/history" element={<PlaceholderPage title="修改歷程" />} />
            <Route path="/profile" element={<PlaceholderPage title="個人資料" />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
