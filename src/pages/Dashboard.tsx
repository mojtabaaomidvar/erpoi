// src/pages/Dashboard.tsx
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import { useAuth } from "@features/auth/hooks/useAuth";
import { ContractSummaryWidget } from "@widgets/contract-summary";
import { RevenueChartWidget } from "@widgets/revenue-chart";
import { InspectorKpiWidget } from "@widgets/inspector-kpi";
import { ProjectOverviewWidget } from "@widgets/project-overview";

export function Dashboard() {
  const { user } = useAuth();
  const { canAccess, canAccessAny } = usePermissionMapping();

  // ✅ Permission checks
  const canViewClients = canAccessAny([
    "client:read",
    "client:view_all",
    "client:view_own",
  ]);
  const canViewContracts = canAccessAny([
    "contract:read",
    "contract:view_all",
    "contract:view_own",
  ]);
  const canViewInspections = canAccessAny([
    "inspection:read",
    "inspection:view_all",
    "inspection:view_own",
  ]);
  const canViewInvoices = canAccessAny([
    "invoice:read",
    "invoice:view_all",
    "invoice:view_own",
  ]);
  const canViewInspectors = canAccessAny([
    "inspector:read",
    "inspector:view_all",
  ]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Section */}
      <div className="rounded-xl bg-[var(--color-accent)] p-6 text-[var(--color-text-on-accent,#fff)] shadow-md">
        <h1 className="text-2xl font-bold">Welcome back, {user?.fullName}!</h1>
        <p className="mt-1 opacity-90">Here's your operational overview</p>
      </div>

      {/* High-Level KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {canViewClients && (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm">
            <div className="text-sm text-[var(--color-text-muted)]">
              My Clients
            </div>
            <div className="mt-1 text-3xl font-bold text-[var(--color-text-primary)]">
              —
            </div>
          </div>
        )}
        {canViewContracts && (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm">
            <div className="text-sm text-[var(--color-text-muted)]">
              My Contracts
            </div>
            <div className="mt-1 text-3xl font-bold text-[var(--color-text-primary)]">
              —
            </div>
          </div>
        )}
        {canViewInspections && (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm">
            <div className="text-sm text-[var(--color-text-muted)]">
              My Inspections
            </div>
            <div className="mt-1 text-3xl font-bold text-[var(--color-text-primary)]">
              —
            </div>
          </div>
        )}
        {canViewInvoices && (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm">
            <div className="text-sm text-[var(--color-text-muted)]">
              My Invoices
            </div>
            <div className="mt-1 text-3xl font-bold text-[var(--color-text-primary)]">
              —
            </div>
          </div>
        )}
      </div>

      {/* Operational Widgets Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {canViewContracts && <ContractSummaryWidget />}
        {canViewInspectors && <InspectorKpiWidget />}
        {canViewInspections && <ProjectOverviewWidget />}
      </div>

      {/* Secondary / Chart Section */}
      {canViewContracts && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-1">
          <RevenueChartWidget />
        </div>
      )}

      {/* Quick Actions */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-[var(--color-text-primary)]">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {canAccess("client:create") && (
            <button className="rounded-lg bg-[var(--color-muted)] p-4 text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)] hover:text-white">
              + New Client
            </button>
          )}
          {canAccess("contract:create") && (
            <button className="rounded-lg bg-[var(--color-muted)] p-4 text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)] hover:text-white">
              + New Contract
            </button>
          )}
          {canAccess("inspection:create") && (
            <button className="rounded-lg bg-[var(--color-muted)] p-4 text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)] hover:text-white">
              + New Inspection
            </button>
          )}
          {canAccess("invoice:create") && (
            <button className="rounded-lg bg-[var(--color-muted)] p-4 text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)] hover:text-white">
              + New Invoice
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
