import { useState } from "react";
import { Sidebar, ViewKey } from "./components/Sidebar";
import { Header } from "./components/Header";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { Dashboard } from "./views/Dashboard";
import { Clients } from "./views/Clients";
import { Contracts } from "./views/Contracts";
import { Inspectors } from "./views/Inspectors";
import { Inspections } from "./views/Inspections";
import { Billing } from "./views/Billing";
import { Reports } from "./views/Reports";

const meta: Record<ViewKey, { title: string; subtitle: string }> = {
  dashboard: { title: "Operations Dashboard", subtitle: "Live overview of inspections, revenue, and inspector workload" },
  clients: { title: "Client Registry", subtitle: "Legal entities and individuals under management" },
  contracts: { title: "Contracts & Tariffs", subtitle: "Master service agreements and work orders" },
  inspectors: { title: "Inspector Roster", subtitle: "Certified engineers, specialties, and availability" },
  inspections: { title: "Inspection Workflow", subtitle: "5-step pipeline from request to completion" },
  billing: { title: "Billing & Invoices", subtitle: "Financial records tied to completed inspections" },
  reports: { title: "Reports & Analytics", subtitle: "Performance, quality, and financial intelligence" },
};

function AppContent() {
  const [view, setView] = useState<ViewKey>("dashboard");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const { isDark } = useTheme();
  const m = meta[view] ?? meta.dashboard;

  return (
    <div className={`flex min-h-screen font-sans antialiased transition-colors duration-300 ${
      isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    }`}>
      <Sidebar
        active={view}
        onSelect={setView}
        isExpanded={sidebarExpanded}
      />

      <main className="flex flex-1 flex-col overflow-hidden">
        <Header
          title={m.title}
          subtitle={m.subtitle}
          isSidebarExpanded={sidebarExpanded}
          onToggleSidebar={() => setSidebarExpanded(!sidebarExpanded)}
        />
        <div className="flex-1 overflow-auto p-6 lg:p-8">
          {view === "dashboard" && <Dashboard />}
          {view === "clients" && <Clients />}
          {view === "contracts" && <Contracts />}
          {view === "inspectors" && <Inspectors />}
          {view === "inspections" && <Inspections />}
          {view === "billing" && <Billing />}
          {view === "reports" && <Reports />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}