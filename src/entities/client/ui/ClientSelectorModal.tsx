// src/components/ClientSelectorModal.tsx

import { useState, useMemo, useEffect } from "react";
import { useTheme } from "@app/providers/ThemeProvider";
import { Modal, Badge, Button } from "@design-system";
import { clientAppService } from "@/features/client-management/application";
import type { Client } from "@/features/client-management/domain/models/Client";

interface ClientSelectorModalProps {
  value: string;
  onChange: (clientId: string) => void;
  onAddNew?: () => void;
  error?: string;
}

export function ClientSelectorModal({
  value,
  onChange,
  onAddNew,
  error,
}: ClientSelectorModalProps) {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadClients = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await clientAppService.getAll();

      setClients(data);
    } catch (err: any) {
      setLoadError("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const filteredClients = useMemo(() => {
    if (!search) return clients;
    const query = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.name_en.toLowerCase().includes(query) ||
        c.name_fa.includes(query) ||
        (c.national_id && c.national_id.includes(query)),
    );
  }, [search, clients]);

  const selectedClient = clients.find((c) => c.id === value);

  return (
    <>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-primary">
          Client *
        </label>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`w-full rounded-lg border px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-indigo-100 input-themed ${
            error ? "border-rose-300" : ""
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              <span>Loading clients...</span>
            </span>
          ) : loadError ? (
            <span className="text-rose-600">{loadError}</span>
          ) : selectedClient ? (
            <div className="flex items-center gap-2">
              <span className="truncate text-primary">
                {selectedClient.name_en}
              </span>
              <Badge tone="slate" className="shrink-0 text-[10px]">
                {selectedClient.type === "LEGAL" ? "Legal" : "Individual"}
              </Badge>
            </div>
          ) : (
            <span className="text-muted">Select Client...</span>
          )}
        </button>
        {error && (
          <p className="mt-1 text-[11px] font-medium text-rose-600">
            ✕ {error}
          </p>
        )}
      </div>

      {isOpen && (
        <Modal
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            setSearch("");
          }}
          title="Select Client"
          size="md"
        >
          <div className="space-y-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                🔍
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or ID..."
                className="w-full rounded-lg py-2 pl-9 pr-3 text-sm input-themed"
                autoFocus
              />
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-2 animate-pulse">⏳</div>
                <div className="text-sm text-secondary">Loading clients...</div>
              </div>
            ) : loadError ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-2">❌</div>
                <div className="text-sm text-rose-600 mb-3">{loadError}</div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={loadClients}
                >
                  🔄 Retry
                </Button>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2">
                {filteredClients.length === 0 ? (
                  <div className="p-8 text-center text-sm text-secondary">
                    <div className="text-4xl mb-2">🔍</div>
                    No clients found
                  </div>
                ) : (
                  filteredClients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => {
                        onChange(client.id);
                        setIsOpen(false);
                        setSearch("");
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                        value === client.id
                          ? isDark
                            ? "border-indigo-500 bg-indigo-900/30"
                            : "border-indigo-400 bg-indigo-50"
                          : isDark
                            ? "border-slate-700 hover:border-indigo-500 hover:bg-slate-800"
                            : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-primary truncate">
                            {client.name_en}
                          </div>
                          <div
                            className="text-xs text-secondary truncate"
                            dir="rtl"
                          >
                            {client.name_fa}
                          </div>
                        </div>
                        <Badge
                          tone={client.type === "LEGAL" ? "indigo" : "violet"}
                          className="shrink-0 ml-2"
                        >
                          {client.type === "LEGAL" ? "Legal" : "Individual"}
                        </Badge>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {onAddNew && !loading && !loadError && (
              <div
                className={`pt-4 border-t ${
                  isDark ? "border-slate-700" : "border-slate-100"
                }`}
              >
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onAddNew();
                    setIsOpen(false);
                  }}
                  className="w-full justify-center gap-2"
                >
                  <span>➕</span>
                  <span>Create New Client</span>
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
