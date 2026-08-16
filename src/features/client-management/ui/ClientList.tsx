// src/features/client-management/ui/ClientList.tsx

import { Avatar, Badge, Button } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import { showToast } from "@shared/ui/ToastContainer";
import { FloatingSearch } from "@shared/ui/FloatingSearch";
import { ClientElements } from "@shared/authorization/ui/elements/ClientElements";
import type { Contract } from "@/features/contract-management/domain";
import type { Client } from "@/features/client-management/domain/models/Client";
import { TableSkeleton } from "@/shared/ui/skeletons";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Users, Search, Lock } from "lucide-react";

interface ClientListProps {
  sortedClients: Client[];
  contracts: Contract[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filter: "ALL" | "LEGAL" | "INDIVIDUAL";
  setFilter: (filter: "ALL" | "LEGAL" | "INDIVIDUAL") => void;
  clientCounts: { total: number; legal: number; individual: number };
  selectedClient: Client | null;
  setSelectedClient: (client: Client | null) => void;
  onAddClick: () => void;
  onExport: () => void;
  loading?: boolean;
}

export function ClientList({
  sortedClients,
  contracts,
  searchQuery,
  setSearchQuery,
  filter,
  setFilter,
  clientCounts,
  selectedClient,
  setSelectedClient,
  onAddClick,
  onExport,
  loading = false,
}: ClientListProps) {
  const { isDark } = useTheme();
  const { canAccessElement } = usePermissionMapping();

  const canViewItems = canAccessElement(
    ClientElements.ClientList.list_item_view.id,
  );
  const canclickItem = canAccessElement(
    ClientElements.ClientList.list_item_click.id,
  );
  const cansearch = canAccessElement(ClientElements.ClientList.search_box.id);
  const canfilterType = canAccessElement(
    ClientElements.ClientList.filter_type.id,
  );
  const canbadgeAgreements = canAccessElement(
    ClientElements.ClientList.total_agreement_badge.id,
  );
  const canbadgeValue = canAccessElement(
    ClientElements.ClientList.total_agreement_value_badge.id,
  );
  const canadd = canAccessElement(ClientElements.ClientList.btn_add.id);
  const canexport = canAccessElement(ClientElements.ClientList.btn_export.id);

  const handleClientClick = (client: Client) => {
    if (!canclickItem) {
      showToast(
        "error",
        "Access Denied",
        "You do not have permission to view client details",
      );
      return;
    }
    setSelectedClient(client);
  };

  return (
    <div className="col-span-1 lg:col-span-4 flex flex-col rounded-2xl overflow-hidden transition-all duration-300 bg-[var(--color-card)] border border-[var(--color-border)] shadow-[var(--elevation-card)]">
      {/* Header */}
      <div className="relative px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='${isDark ? "%23ffffff" : "%23000000"}' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg gradient-accent shadow-lg"
              aria-hidden="true"
            >
              👥
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
                Clients
              </h2>
              {canViewItems && (
                <p className="text-[10px] text-[var(--color-text-muted)]">
                  {clientCounts.total} total
                </p>
              )}
            </div>
          </div>

          {/* ✅ Conditional Buttons based on Registry */}
          <div className="flex gap-1.5">
            {cansearch && (
              <FloatingSearch
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search clients..."
                icon="🔍"
              />
            )}
            {canexport && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onExport}
                title="Export to Excel"
                className="transition-all hover:scale-105 shadow-md shadow-slate-700/50"
              >
                📊
              </Button>
            )}
            {canadd && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onAddClick}
                title="Add Client"
                className="transition-all hover:scale-105 shadow-md shadow-slate-700/50"
              >
                ➕
              </Button>
            )}
          </div>
        </div>
      </div>

      {canfilterType && (
        <div className="px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex gap-1.5">
            {(["ALL", "LEGAL", "INDIVIDUAL"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={`flex-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] ${
                  filter === f
                    ? "gradient-accent text-white shadow-md"
                    : "bg-[var(--color-muted)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                {f === "ALL"
                  ? `All (${clientCounts.total})`
                  : f === "LEGAL"
                    ? `🏢 Legal (${clientCounts.legal})`
                    : `👤 Individual (${clientCounts.individual})`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Client List Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4">
            <TableSkeleton rows={8} columns={3} showHeader={false} />
          </div>
        ) : !canViewItems ? (
          <EmptyState
            icon={Lock}
            title="Access Denied"
            description="You do not have permission to view the client list."
            className="h-full"
          />
        ) : sortedClients.length === 0 ? (
          <EmptyState
            icon={searchQuery ? Search : Users}
            title={searchQuery ? "No Matches Found" : "No clients found"}
            description="Try adjusting your search or filters"
            className="h-full"
          />
        ) : (
          <div className="p-2 space-y-1.5">
            {sortedClients.map((client) => {
              const isSelected = selectedClient?.id === client.id;
              const clientContracts = contracts.filter(
                (c) => c.client_id === client.id,
              );
              const totalValue = clientContracts.reduce(
                (sum, c) => sum + c.total_value,
                0,
              );

              return (
                <button
                  key={client.id}
                  onClick={() => handleClientClick(client)}
                  disabled={!canclickItem}
                  className={`group relative w-full text-left rounded-xl p-3 transition-all duration-200 border ${
                    !canclickItem
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer"
                  } ${
                    isSelected
                      ? "bg-[var(--color-accent-from)]/10 border-[var(--color-accent-from)]/50 shadow-md"
                      : "bg-transparent border-transparent hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-border)] hover:shadow-sm"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-[var(--color-accent-from)]" />
                  )}

                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar
                        name={client.name_en}
                        gradient={client.logoColor}
                        size="md"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold truncate text-[var(--color-text-primary)]">
                          {client.name_en}
                        </h3>
                        <Badge
                          tone={client.type === "LEGAL" ? "indigo" : "emerald"}
                          className="text-[10px] shrink-0"
                        >
                          {client.type === "LEGAL" ? "Legal" : "Individual"}
                        </Badge>
                      </div>

                      <p
                        className="text-[11px] truncate mb-2 text-[var(--color-text-secondary)]"
                        dir="rtl"
                      >
                        {client.name_fa}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center gap-3">
                        {canbadgeAgreements && (
                          <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-secondary)]">
                            <span aria-hidden="true">📄</span>
                            <span className="font-semibold">
                              {clientContracts.length}
                            </span>
                            <span>Agreements</span>
                          </div>
                        )}

                        {canbadgeValue && totalValue > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-[var(--color-success)]">
                            <span aria-hidden="true">💰</span>
                            <span className="font-semibold">
                              {totalValue >= 1000000000
                                ? `${(totalValue / 1000000000).toFixed(1)}B`
                                : totalValue >= 1000000
                                  ? `${(totalValue / 1000000).toFixed(1)}M`
                                  : totalValue.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
