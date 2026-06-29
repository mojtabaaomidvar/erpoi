import { useState, useMemo } from "react";
import { clients } from "@data/mockData";
import { Badge, Button } from "@shared/ui";

interface ClientSelectorProps {
value: string;
onChange: (clientId: string) => void;
onAddNew?: () => void;
error?: string;
}

export function ClientSelector({
value,
onChange,
onAddNew,
error,
}: ClientSelectorProps) {
const [isOpen, setIsOpen] = useState(false);
const [search, setSearch] = useState("");

const filteredClients = useMemo(() => {
if (!search) return clients;


const query = search.toLowerCase();

return clients.filter(
  (c) =>
    c.name_en.toLowerCase().includes(query) ||
    c.name_fa.includes(query) ||
    (c.national_id && c.national_id.includes(query))
);


}, [search]);

const selectedClient = clients.find((c) => c.id === value);

return ( <div className="relative"> <label className="mb-1.5 block text-xs font-semibold text-slate-700">
Client * </label>


  <div className="flex gap-2">
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className={`flex-1 rounded-lg border px-3 py-2 text-left text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 ${
        error
          ? "border-rose-300"
          : "border-slate-200 focus:border-indigo-400"
      } ${
        selectedClient
          ? "bg-white text-slate-900"
          : "bg-slate-50 text-slate-400"
      }`}
    >
      {selectedClient ? (
        <div className="flex items-center gap-2">
          <span className="truncate">{selectedClient.name_en}</span>
          <Badge tone="slate" className="shrink-0 text-[10px]">
            {selectedClient.type === "LEGAL" ? "Legal" : "Individual"}
          </Badge>
        </div>
      ) : (
        <span>Select Client...</span>
      )}
    </button>

    {onAddNew && (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAddNew}
        className="shrink-0 gap-1.5 text-xs"
      >
        ➕ New
      </Button>
    )}
  </div>

  {isOpen && (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={() => setIsOpen(false)}
      />

      <div className="absolute left-0 right-0 z-50 mt-1 max-h-64 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
        <div className="border-b border-slate-100 p-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or ID..."
            className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            autoFocus
          />
        </div>

        <div className="max-h-48 overflow-y-auto">
          {filteredClients.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">
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
                className={`w-full border-b border-slate-50 px-3 py-2 text-left transition-colors hover:bg-indigo-50 last:border-0 ${
                  value === client.id ? "bg-indigo-50" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-900">
                      {client.name_en}
                    </div>
                    <div
                      className="truncate text-xs text-slate-500"
                      dir="rtl"
                    >
                      {client.name_fa}
                    </div>
                  </div>

                  <Badge
                    tone={
                      client.type === "LEGAL" ? "indigo" : "violet"
                    }
                    className="ml-2 shrink-0"
                  >
                    {client.type === "LEGAL" ? "Legal" : "Individual"}
                  </Badge>
                </div>
              </button>
            ))
          )}
        </div>

        {onAddNew && (
          <button
            type="button"
            onClick={() => {
              onAddNew();
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-2 border-t border-slate-100 bg-indigo-50 px-3 py-2 text-left text-sm font-medium text-indigo-700 hover:bg-indigo-100"
          >
            <span>➕</span>
            <span>Create New Client</span>
          </button>
        )}
      </div>
    </>
  )}

  {error && (
    <p className="mt-1 text-[11px] font-medium text-rose-600">
      ✕ {error}
    </p>
  )}
</div>

);
}