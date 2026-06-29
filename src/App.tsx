import { useState, useMemo, useEffect } from"react";
import { Sidebar, ViewKey } from"@widgets/layout/Sidebar";
import { Header } from"@widgets/layout/Header";
import { Dashboard } from"@pages/Dashboard";
import { Clients } from"@pages/Clients";
import { Contracts } from"@pages/Contracts";
import { Billing } from"@pages/Billing";
import { Reports } from"@pages/Reports";
import { Inspections } from"@pages/Inspections";
import { Inspectors } from"@pages/Inspectors";
import { ThemeProvider, useTheme } from"@app/providers/ThemeProvider";
import { usePersistedState } from"@shared/hooks/usePersistedState";
import { calculateDaysLeft, getDaysUntilStart } from"@shared/lib/formatters";
import { useAuditLogger } from'@features/audit-log';
import { AuditLog } from'@pages/AuditLog';



const meta: Record<ViewKey, { title: string; subtitle: string }> = {
  dashboard: { title:"Operations Dashboard", subtitle:"Live overview of inspections, revenue, and inspector workload"},
  clients: { title:"Client Registry", subtitle:"Legal entities and individuals under management"},
  contracts: { title:"Contracts & Tariffs", subtitle:"Master service agreements and work orders"},
  inspectors: { title:"Inspector Roster", subtitle:"Certified engineers, specialties, and availability"},
  inspections: { title:"Inspection Workflow", subtitle:"5-step pipeline from request to completion"},
  billing: { title:"Billing & Invoices", subtitle:"Financial records tied to completed inspections"},
  reports: { title:"Reports & Analytics", subtitle:"Performance, quality, and financial intelligence"},
  audit: { title:"Audit Log", subtitle:"System activity tracking and compliance records"},
};

function AppContent() {
  useAuditLogger();
  
  
  const [view, setView] = useState<ViewKey>("dashboard");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const { isDark } = useTheme();
  
  // 🔑 لود قراردادها برای محاسبه expiring count
  const [contracts] = usePersistedState<any[]>("ics_contracts", []);

  // 🔑 محاسبه تعداد قراردادهای در آستانه پایان
  const expiringCount = useMemo(() => {
    return contracts.filter((c: any) => {
      if (c.status !=="ACTIVE") return false;
      const daysLeft = calculateDaysLeft(c.end_date);
      const daysUntilStart = getDaysUntilStart(c.start_date);
      return daysUntilStart <= 0 && daysLeft > 0 && daysLeft <= 132;
    }).length;
  }, [contracts]);

  const m = meta[view] ?? meta.dashboard;

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors ${
      isDark ?"bg-slate-950 text-slate-100":"bg-slate-50 text-slate-900"}`}>
      <Header
        title={m.title}
        subtitle={m.subtitle}
        isSidebarExpanded={sidebarExpanded}
        onToggleSidebar={() => setSidebarExpanded(!sidebarExpanded)}
      />

      <Sidebar
        active={view}
        onSelect={setView}
        isExpanded={sidebarExpanded}
        expiringContractsCount={expiringCount}
      />

      <main
        className="transition-all duration-300"style={{
          marginLeft: sidebarExpanded ?"16rem":"5rem",
          paddingTop:"4rem",
        }}
      >
        <div className="p-6 lg:p-8">
          {view ==="dashboard"&& <Dashboard />}
          {view ==="clients"&& <Clients />}
          {view ==="contracts"&& <Contracts />}
          {view ==="inspectors"&& <Inspectors />}
          {view ==="inspections"&& <Inspections />}
          {view ==="billing"&& <Billing />}
          {view ==="reports"&& <Reports />}
		  {view ==="audit"&& <AuditLog />}
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