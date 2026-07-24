// src/features/client-management/ui/ClientList.tsx

import { Avatar, Badge, Button } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import { showToast } from "@shared/ui/ToastContainer";
import { FloatingSearch } from "@shared/ui/FloatingSearch";
import { ClientElements } from "@shared/authorization/ui/elements/ClientElements";
import type { Contract } from "@/features/contract-management/domain";
import type { Client } from "@/features/client-management/domain/models/Client";

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
    <div
      className={`col-span-1 lg:col-span-4 flex flex-col rounded-2xl overflow-hidden transition-all duration-300 ${
        isDark
          ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-700/50 shadow-2xl shadow-black/30"
          : "bg-gradient-to-br from-white via-slate-50 to-indigo-50/30 border border-slate-200/70 shadow-xl shadow-slate-200/50"
      }`}
    >
      {/* Header */}
      <div
        className={`relative px-5 py-4 border-b ${
          isDark
            ? "border-slate-700/50 bg-gradient-to-r from-indigo-900/30 via-slate-900 to-violet-900/30"
            : "border-slate-200/70 bg-gradient-to-r from-indigo-50/50 via-white to-violet-50/50"
        }`}
      >
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='${isDark ? "%23ffffff" : "%23000000"}' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
                isDark
                  ? "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30"
                  : "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20"
              }`}
            >
              👥
            </div>
            <div>
              <h2
                className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                Clients
              </h2>
              {canViewItems && (
                <p
                  className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
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
        <div
          className={`px-4 py-2.5 border-b ${isDark ? "border-slate-700/50 bg-slate-900/30" : "border-slate-200/70 bg-slate-50/50"}`}
        >
          <div className="flex gap-1.5">
            {(["ALL", "LEGAL", "INDIVIDUAL"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                  filter === f
                    ? isDark
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/30"
                      : "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/20"
                    : isDark
                      ? "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
                      : "bg-white/70 text-slate-600 hover:bg-slate-100 hover:text-slate-900 shadow-sm"
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
        {!canViewItems ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 ${isDark ? "bg-slate-800/50" : "bg-slate-100"}`}
            >
              🔒
            </div>
            <p
              className={`text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              Access Denied
            </p>
            <p
              className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}
            >
              You do not have permission to view the client list.
            </p>
          </div>
        ) : sortedClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 ${isDark ? "bg-slate-800/50" : "bg-slate-100"}`}
            >
              🔍
            </div>
            <p
              className={`text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              No clients found
            </p>
            <p
              className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}
            >
              Try adjusting your search or filters
            </p>
          </div>
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
                  className={`group relative w-full text-left rounded-xl p-3 transition-all duration-200 ${
                    !canclickItem
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer"
                  } ${
                    isSelected
                      ? isDark
                        ? "bg-gradient-to-r from-indigo-900/50 to-violet-900/50 border border-indigo-500/50 shadow-lg shadow-indigo-500/20"
                        : "bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-300/50 shadow-lg shadow-indigo-500/10"
                      : isDark
                        ? "bg-slate-800/30 border border-transparent hover:bg-slate-800/60 hover:border-slate-700/50 hover:shadow-md"
                        : "bg-white/50 border border-transparent hover:bg-white hover:border-slate-200/70 hover:shadow-md"
                  }`}
                >
                  {isSelected && (
                    <div
                      className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full ${isDark ? "bg-indigo-500" : "bg-indigo-500"}`}
                    />
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
                        <h3
                          className={`text-sm font-bold truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}
                        >
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
                        className={`text-[11px] truncate mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                        dir="rtl"
                      >
                        {client.name_fa}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center gap-3">
                        {canbadgeAgreements && (
                          <div
                            className={`flex items-center gap-1 text-[10px] ${isDark ? "text-slate-400" : "text-slate-600"}`}
                          >
                            <span>📄</span>
                            <span className="font-semibold">
                              {clientContracts.length}
                            </span>
                            <span>Agreements</span>
                          </div>
                        )}

                        {canbadgeValue && totalValue > 0 && (
                          <div
                            className={`flex items-center gap-1 text-[10px] ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                          >
                            <span>💰</span>
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
