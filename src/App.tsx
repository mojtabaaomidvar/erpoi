// src/App.tsx
import { useState, useEffect, useCallback } from "react";
import { ThemeProvider, useTheme } from "@app/providers/ThemeProvider";
import { Header } from "@widgets/layout/Header";
import { Sidebar, type ViewKey } from "@widgets/layout/Sidebar";
import { Dashboard } from "@pages/Dashboard";
import { Clients } from "@pages/Clients";
import { Contracts } from "@pages/Contracts";
import { Inspectors } from "@pages/Inspectors";
import { Inspections } from "@pages/Inspections";
import { Billing } from "@pages/Billing";
import { Reports } from "@pages/Reports";
import { Settings } from "@pages/Settings";
import { useAuth } from "@features/auth/hooks/useAuth";
// 🔧 FIX: جایگزینی PermissionManager با UserManagement
import { UserManagement } from "@shared/authorization/ui/UserManagement";
import { LoginPage } from "@features/auth/ui/LoginPage";
import { ConfirmDialogProvider } from "@shared/ui/ConfirmDialog";

// 🔧 FIX: تغییر 'permission-manager' به 'user-management'
const meta: Record<ViewKey, { title: string; subtitle: string }> = {
  dashboard: { title: "Operations Dashboard", subtitle: "Live overview of inspections, revenue, and inspector workload" },
  clients: { title: "Client Registry", subtitle: "Legal entities and individuals under management" },
  contracts: { title: "Contracts & Tariffs", subtitle: "Master service agreements and work orders" },
  inspectors: { title: "Inspector Roster", subtitle: "Certified engineers, specialties, and availability" },
  inspections: { title: "Inspection Workflow", subtitle: "5-step pipeline from request to completion" },
  billing: { title: "Billing & Invoices", subtitle: "Financial records tied to completed inspections" },
  reports: { title: "Reports & Analytics", subtitle: "Performance, quality, and financial intelligence" },
  audit: { title: "Audit Log", subtitle: "System activity tracking and compliance records" },
  settings: { title: "Settings", subtitle: "Application preferences and configuration" },
  'user-management': { title: "User Management", subtitle: "Manage users, roles, and permissions" },
};

function AppContent() {
  const { isDark, toggleTheme } = useTheme();
  const { isAuthenticated, logout } = useAuth();
  const [view, setView] = useState<ViewKey>("dashboard");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const handleLogout = useCallback(async () => {
    await logout();
    setView("dashboard");
  }, [logout]);

  useEffect(() => {
    const savedView = localStorage.getItem("ics_current_view");
    const savedSidebar = localStorage.getItem("ics_sidebar_expanded");
    if (savedView && meta[savedView as ViewKey]) setView(savedView as ViewKey);
    if (savedSidebar) setSidebarExpanded(savedSidebar === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("ics_current_view", view);
  }, [view]);

  useEffect(() => {
    localStorage.setItem("ics_sidebar_expanded", String(sidebarExpanded));
  }, [sidebarExpanded]);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const m = meta[view];
  const expiringCount = 0;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    }`}>
      <Header
        title={m.title}
        subtitle={m.subtitle}
        isSidebarExpanded={sidebarExpanded}
        onToggleSidebar={() => setSidebarExpanded(!sidebarExpanded)}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />
      
      <Sidebar
        active={view}
        onSelect={setView}
        isExpanded={sidebarExpanded}
        expiringContractsCount={expiringCount}
        onLogout={handleLogout}
      />

      <main
        className="transition-all duration-300"
        style={{
          marginLeft: sidebarExpanded ? "16rem" : "5rem",
          paddingTop: "4rem",
        }}
      >
        <div className="p-6 lg:p-8">
          {view === "dashboard" && <Dashboard />}
          {view === "clients" && <Clients />}
          {view === "contracts" && <Contracts />}
          {view === "inspectors" && <Inspectors />}
          {view === "inspections" && <Inspections />}
          {view === "billing" && <Billing />}
          {view === "reports" && <Reports />}
          {view === "settings" && <Settings />}
          {/* 🔧 FIX: جایگزینی PermissionManager با UserManagement */}
          {view === "user-management" && <UserManagement />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ConfirmDialogProvider>
        <AppContent />
      </ConfirmDialogProvider>
    </ThemeProvider>
  );
}