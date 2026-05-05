import { NavLink, Route, Routes } from "react-router-dom";
import { useMemo, useState } from "react";
import { DashboardPage } from "./pages/DashboardPage";
import { ExpensesPage } from "./pages/ExpensesPage";
import { NewRequestPage } from "./pages/NewRequestPage";
import { RequestDetailPage } from "./pages/RequestDetailPage";
import { ProjectOverviewPage } from "./pages/ProjectOverviewPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import type { Role } from "./types";

const roleLabel: Record<Role, string> = {
  admin: "Admin",
  producer: "Producer",
  treasury: "Treasury",
  member: "Member"
};

export function App() {
  const [role, setRole] = useState<Role>("producer");
  const nav = useMemo(
    () => [
      { to: "/", label: "Dashboard" },
      { to: "/expenses", label: "Expenses" },
      { to: "/expenses/new", label: "New Request" },
      { to: "/projects/1/overview", label: "Project Overview" },
      { to: "/notifications", label: "Notifications" }
    ],
    []
  );

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>Dashboard Pro</h1>
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? "nav active" : "nav")}
          >
            {item.label}
          </NavLink>
        ))}
      </aside>
      <main className="main">
        <header className="topbar">
          <strong>Role Simulation</strong>
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {Object.entries(roleLabel).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </header>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/expenses" element={<ExpensesPage role={role} />} />
          <Route path="/expenses/new" element={<NewRequestPage />} />
          <Route path="/expenses/:id" element={<RequestDetailPage role={role} />} />
          <Route path="/projects/:id/overview" element={<ProjectOverviewPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Routes>
      </main>
    </div>
  );
}
