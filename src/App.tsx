// src/App.tsx

import { useState, useEffect, useCallback } from "react";
import { ThemeProvider, useTheme } from "@app/providers/ThemeProvider";
import { Header } from "@widgets/layout/Header";
import { Sidebar, type ViewKey } from "@widgets/layout/Sidebar";
import { Dashboard } from "@pages/Dashboard";
import { Clients } from "@pages/Clients";
import { Contracts } from "@pages/Contracts";
import { Projects } from "@pages/Projects";
import { Inspectors } from "@pages/Inspectors";
import { Inspections } from "@pages/Inspections";
import { TPI } from "@pages/TPI";
import { Billing } from "@pages/Billing";
import { Reports } from "@pages/Reports";
import { Settings } from "@pages/Settings";
import { useAuth } from "@features/auth/hooks/useAuth";
import { UserManagement } from "@/features/user-management/UserManagement";
import { LoginPage } from "@features/auth/ui/LoginPage";
import { ConfirmDialogProvider } from "@shared/ui/ConfirmDialog";
import { ToastProvider } from "@shared/ui/ToastContainer";
import { amendmentAppService } from "./features/contract-management/application";

// ✅ ۱. ایمپورت کامپوننت جدید
import { ApprovalDashboard } from "@/features/master-data/ui/ApprovalDashboard";
import { useAuditLogger } from "@/features/audit-log/hooks/useAuditLogger";

const meta: Record<ViewKey, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Operations Dashboard",
    subtitle: "Live overview of inspections, revenue, and inspector workload",
  },
  clients: {
    title: "Client Managements",
    subtitle: "Legal entities and individuals under management",
  },
  contracts: {
    title: "Agreement(s) Management",
    subtitle: "Master service agreements and work orders",
  },
  project: {
    title: "Projects",
    subtitle: "Project Managment",
  },
  inspectors: {
    title: "Inspector Roster",
    subtitle: "Certified engineers, specialties, and availability",
  },
  inspections: {
    title: "Inspection Workflow",
    subtitle: "5-step pipeline from request to completion",
  },
  tpi: {
    title: "Third Party Inspection",
    subtitle: "Spot and Resident inspection management for quality control",
  },
  approvals: {
    title: "Approvals",
    subtitle: "Review master data and controlled entity deletion requests",
  },
  billing: {
    title: "Billing & Invoices",
    subtitle: "Financial records tied to completed inspections",
  },
  reports: {
    title: "Reports & Analytics",
    subtitle: "Performance, quality, and financial intelligence",
  },
  audit: {
    title: "Audit Log",
    subtitle: "System activity tracking and compliance records",
  },
  settings: {
    title: "Settings",
    subtitle: "Application preferences and configuration",
  },
  "user-management": {
    title: "User Management",
    subtitle: "Manage users, roles, and permissions",
  },
};

function AppContent() {
  useAuditLogger();
  const { isDark, themePreferences } = useTheme();
  const { isAuthenticated, logout } = useAuth();
  const [view, setView] = useState<ViewKey>("dashboard");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const expiringCount = 0;

  const handleLogout = useCallback(async () => {
    await logout();
    setView("dashboard");
  }, [logout]);

  useEffect(() => {
    const savedView = localStorage.getItem("ics_current_view");
    const savedSidebar = localStorage.getItem("ics_sidebar_expanded");
    if (savedView === "resident") {
      setView("tpi");
    } else if (savedView && meta[savedView as ViewKey]) {
      setView(savedView as ViewKey);
    }
    if (savedSidebar) setSidebarExpanded(savedSidebar === "true");
    amendmentAppService.syncPendingAmendments();
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

  return (
    <div className="h-screen overflow-hidden transition-colors duration-300 bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <Header
        activeView={view}
        onToggleSidebar={() => setSidebarExpanded(!sidebarExpanded)}
        isSidebarExpanded={sidebarExpanded}
        onNavigateSettings={() => setView("settings")}
        onLogout={handleLogout}
      />

      <Sidebar
        active={view}
        onSelect={setView}
        isExpanded={sidebarExpanded}
        expiringContractsCount={expiringCount}
      />

      <main
        className="transition-all duration-300 h-[calc(100vh-var(--header-height))] overflow-hidden flex flex-col"
        style={{
          marginTop: "var(--header-height)",
          marginLeft: sidebarExpanded
            ? themePreferences?.sidebarStyle === "floating"
              ? "calc(5.5rem + 0.75rem)"
              : "calc(17rem + 0.75rem)"
            : "calc(5.5rem + 0.75rem)",
          paddingTop: "0.75em",
          paddingRight: "0.75rem",
          paddingBottom: "0.75rem",
        }}
      >
        <div
          className="flex-1 p-4 lg:p-6 rounded-2xl transition-colors duration-300 overflow-y-auto scrollbar-thin"
          style={{
            backgroundColor: `color-mix(in srgb, var(--color-surface) 60%, transparent)`,
            boxShadow: isDark
              ? "inset 0 1px 0 rgba(255,255,255,0.03), 0 4px 24px rgba(0,0,0,0.2)"
              : "inset 0 1px 0 rgba(255,255,255,0.6), 0 4px 24px rgba(0,0,0,0.04)",
            border:
              "1px solid color-mix(in srgb, var(--color-border) 30%, transparent)",
          }}
        >
          {view === "dashboard" && <Dashboard />}
          {view === "clients" && <Clients />}
          {view === "contracts" && <Contracts />}
          {view === "project" && <Projects />}
          {view === "inspectors" && <Inspectors />}
          {view === "inspections" && <Inspections />}
          {view === "tpi" && <TPI />}
          {view === "approvals" && <ApprovalDashboard />}
          {view === "billing" && <Billing />}
          {view === "reports" && <Reports />}
          {view === "settings" && <Settings />}
          {view === "user-management" && <UserManagement />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmDialogProvider>
          <AppContent />
        </ConfirmDialogProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
