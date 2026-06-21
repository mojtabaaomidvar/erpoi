import { useState, useMemo, useEffect } from "react";
import { Button, Badge, Card, Avatar, Modal } from "../design-system";
import {
  contracts as initialContracts,
  clients as initialClients,
  contractTariffs,
} from "../data/mockData";
import { formatCurrency, contractHealth } from "../lib/formatters";
import { exportToExcel } from "../lib/exportToExcel";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import jalaali from "jalaali-js";
import { useTheme } from "../contexts/ThemeContext";

// ============ TYPES ============
interface TariffLine {
  id: string;
  contract_id?: string;
  description: string;
  unit: string;
  rate: string | number;
  currency?: string;
  total?: number;
  isLumpSum?: boolean;
  total_quantity?: number;
  consumed_quantity?: number;
  invoiced?: number;
}

interface Client {
  id: string;
  type: "LEGAL" | "INDIVIDUAL";
  name_en: string;
  name_fa: string;
  national_id?: string;
  email?: string;
  phone?: string;
  category: string;
  contacts: number;
  contracts: number;
  logoColor: string;
  emails?: string[];
}

interface Contract {
  id: string;
  contract_no: string;
  external_contract_no?: string;
  source_type?: "EMAIL" | "LETTER";
  source_ref?: string;
  source_file?: string;
  source_file_object?: File | null;
  source_letter_date?: string;
  source_letter_image?: string;
  source_letter_image_object?: File | null;
  source_letter_image_preview?: string;
  source_email_from?: string;
  source_email_date?: string;
  client_id: string;
  client_name: string;
  contract_title: string;
  start_date: string;
  end_date: string;
  total_value: number;
  invoiced: number;
  currency: string;
  status: "ACTIVE" | "COMPLETED";
  type: "CONTRACT" | "WORK_ORDER";
  tariffs: number;
  contract_count?: number;
  tariffLines?: TariffLine[];
  department: string;
  description?: string;
}

const CURRENT_DEPARTMENT = "Unit A";
const DEPT_CODE = "UNA";
const CURRENCIES = ["IRR", "USD", "EUR"];
const UNITS = ["MAN_DAY", "DOCUMENT", "VESSEL", "LUMP_SUM"];

// ============ PROGRESS COLOR ============
const getProgressColor = (progress: number): string => {
  if (progress >= 100) return "bg-emerald-500";
  if (progress >= 75) return "bg-emerald-400";
  if (progress >= 50) return "bg-amber-500";
  if (progress >= 25) return "bg-orange-500";
  return "bg-rose-500";
};

const getProgressTextClass = (progress: number): string => {
  if (progress >= 100) return "text-emerald-600";
  if (progress >= 80) return "text-amber-600";
  if (progress >= 50) return "text-yellow-600";
  if (progress >= 25) return "text-orange-600";
  return "text-rose-600";
};

const getProgressTextColor = (progress: number): string => {
  if (progress >= 100) return "text-emerald-600";
  if (progress >= 75) return "text-emerald-500";
  if (progress >= 50) return "text-amber-600";
  if (progress >= 25) return "text-orange-600";
  return "text-rose-600";
};

const getProgressTone = (progress: number): string => {
  if (progress >= 100) return "emerald";
  if (progress >= 80) return "amber";
  if (progress >= 50) return "yellow";
  if (progress >= 25) return "orange";
  return "rose";
};

const getProgressBgClass = (progress: number): string => {
  if (progress >= 100) return "bg-emerald-500";
  if (progress >= 80) return "bg-amber-500";
  if (progress >= 50) return "bg-yellow-500";
  if (progress >= 25) return "bg-orange-500";
  return "bg-rose-500";
};

// ============ JALAALI HELPERS ============
const getCurrentJalaaliYear = (): number => {
  const now = new Date();
  const j = jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return j.jy;
};

const generateContractNo = (
  type: "CONTRACT" | "WORK_ORDER",
  contracts: Contract[]
): string => {
  const year = getCurrentJalaaliYear();
  const prefix = type === "CONTRACT" ? "CTR" : "WO";
  const count = contracts.filter((c) => c.department === CURRENT_DEPARTMENT && c.type === type).length + 1;
  return `${prefix}-${DEPT_CODE}-${year}-${String(count).padStart(4, "0")}`;
};

// ============ NUMBER FORMATTING ============
const formatNumberInput = (value: string): string => {
  const num = value.replace(/[^0-9]/g, "");
  if (!num) return "";
  return Number(num).toLocaleString("en-US");
};

const parseNumberInput = (value: string): number => {
  const num = value.replace(/,/g, "");
  return Number(num) || 0;
};

// ============ PROGRESS CALCULATION ============
const calculateProgressFromTariffs = (contract: Contract): number => {
  const tariffs = contractTariffs.filter((t) => t.contract_id === contract.id);
  if (tariffs.length === 0) return 0;
  if (contract.total_value <= 0) return 0;
  const totalPerformed = tariffs.reduce((sum, t) => {
    const rate = typeof t.rate === 'string' ? parseNumberInput(t.rate) : (t.rate || 0);
    const consumed = t.consumed_quantity || 0;
    return sum + (rate * consumed);
  }, 0);
  return (totalPerformed / contract.total_value) * 100;
};

const calculateInvoiceProgress = (contract: Contract): number => {
  if (contract.total_value <= 0) return 0;
  return (contract.invoiced / contract.total_value) * 100;
};

// ============ DATE CALCULATION HELPERS ============
const calculateDaysLeft = (endDate: string): number => {
  if (!endDate) return 0;
  const [jy, jm, jd] = endDate.split('/').map(Number);
  const gDate = jalaali.toGregorian(jy, jm, jd);
  const endGregorian = new Date(gDate.gy, gDate.gm - 1, gDate.gd);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = endGregorian.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const isContractNotStarted = (startDate: string): boolean => {
  if (!startDate) return false;
  const [jy, jm, jd] = startDate.split('/').map(Number);
  const gDate = jalaali.toGregorian(jy, jm, jd);
  const startGregorian = new Date(gDate.gy, gDate.gm - 1, gDate.gd);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return startGregorian.getTime() > today.getTime();
};

const getDaysUntilStart = (startDate: string): number => {
  if (!startDate) return 0;
  const [jy, jm, jd] = startDate.split('/').map(Number);
  const gDate = jalaali.toGregorian(jy, jm, jd);
  const startGregorian = new Date(gDate.gy, gDate.gm - 1, gDate.gd);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = startGregorian.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const calculateBudgetSpent = (totalValue: number, invoiced: number): number => {
  if (totalValue <= 0) return 0;
  return (invoiced / totalValue) * 100;
};

// ============ FINANCIAL STATUS HELPERS ============
const getContractFinancialStatus = (contract: Contract): "completed" | "needs_review" | "active" => {
  const daysLeft = calculateDaysLeft(contract.end_date);
  const isExpired = daysLeft < 0;
  const isFullyInvoiced = contract.invoiced >= contract.total_value;
  if (contract.status === "COMPLETED") return "completed";
  if (isExpired && isFullyInvoiced) return "completed";
  if (isExpired && !isFullyInvoiced) return "needs_review";
  return "active";
};

const getInvoicedPercentage = (contract: Contract): number => {
  if (contract.total_value <= 0) return 0;
  return (contract.invoiced / contract.total_value) * 100;
};

// ============ PERSIAN DATE PICKER ============
interface JalaaliDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
  disabled?: boolean;
}

function JalaaliDatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = "Select date",
  disabled = false,
}: JalaaliDatePickerProps) {
  const { isDark } = useTheme();
  const handleSelect = (date: any) => {
    if (date && !Array.isArray(date)) {
      const formatted = `${date.year}/${String(date.month.index).padStart(2, "0")}/${String(date.day).padStart(2, "0")}`;
      onChange(formatted);
    } else {
      onChange("");
    }
  };
  return (
    <DatePicker
      calendar={persian}
      locale={persian_fa}
      value={value || undefined}
      onChange={handleSelect}
      calendarPosition="bottom-right"
      inputClass={`w-full rounded-lg py-2.5 px-3 text-sm text-left font-sans input-themed`}
      placeholder={placeholder}
      disabled={disabled}
      minDate={minDate}
      maxDate={maxDate}
      format="YYYY/MM/DD"
    />
  );
}

// ============ CLIENT SELECTOR MODAL ============
interface ClientSelectorModalProps {
  value: string;
  onChange: (clientId: string) => void;
  onAddNew?: () => void;
  error?: string;
}

function ClientSelectorModal({ value, onChange, onAddNew, error }: ClientSelectorModalProps) {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredClients = useMemo(() => {
    if (!search) return initialClients;
    const query = search.toLowerCase();
    return initialClients.filter(
      (c) =>
        c.name_en.toLowerCase().includes(query) ||
        c.name_fa.includes(query) ||
        (c.national_id && c.national_id.includes(query))
    );
  }, [search]);

  const selectedClient = initialClients.find((c) => c.id === value);

  return (
    <>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-primary">Client *</label>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`w-full rounded-lg border px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-indigo-100 input-themed ${
            error ? "border-rose-300" : ""
          }`}
        >
          {selectedClient ? (
            <div className="flex items-center gap-2">
              <span className="truncate text-primary">{selectedClient.name_en}</span>
              <Badge tone="slate" className="shrink-0 text-[10px]">
                {selectedClient.type === "LEGAL" ? "Legal" : "Individual"}
              </Badge>
            </div>
          ) : (
            <span className="text-muted">Select Client...</span>
          )}
        </button>
        {error && (
          <p className="mt-1 text-[11px] font-medium text-rose-600">✕ {error}</p>
        )}
      </div>

      {isOpen && (
        <Modal isOpen={isOpen} onClose={() => { setIsOpen(false); setSearch(""); }} title="Select Client" size="md">
          <div className="space-y-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">🔍</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or ID..."
                className="w-full rounded-lg py-2 pl-9 pr-3 text-sm input-themed"
                autoFocus
              />
            </div>

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
                        ? (isDark ? "border-indigo-500 bg-indigo-900/30" : "border-indigo-400 bg-indigo-50")
                        : (isDark ? "border-slate-700 hover:border-indigo-500 hover:bg-slate-800" : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50")
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-primary truncate">{client.name_en}</div>
                        <div className="text-xs text-secondary truncate" dir="rtl">{client.name_fa}</div>
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

            {onAddNew && (
              <div className={`pt-4 border-t ${isDark ? "border-slate-700" : "border-slate-100"}`}>
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

// ============ TARIFF EDITOR ============
interface TariffEditorProps {
  tariffs: TariffLine[];
  onChange: (tariffs: TariffLine[]) => void;
  error?: string;
  showTotals?: boolean;
}

function TariffEditor({ tariffs, onChange, error, showTotals = true }: TariffEditorProps) {
  const { isDark } = useTheme();

  const addTariff = () => {
    const newTariff: TariffLine = {
      id: `t${Date.now()}`,
      description: "",
      unit: "MAN_DAY",
      rate: "",
      currency: "IRR",
      total: 0,
      isLumpSum: false,
    };
    onChange([...tariffs, newTariff]);
  };

  const removeTariff = (id: string) => {
    if (tariffs.length <= 1) return;
    onChange(tariffs.filter((t) => t.id !== id));
  };

  const updateTariff = (id: string, field: keyof TariffLine, value: any) => {
    const updated = tariffs.map((t) => {
      if (t.id !== id) return t;
      const newTariff = { ...t, [field]: value };
      if (field === "rate") {
        newTariff.total = parseNumberInput(newTariff.rate as string);
      }
      if (field === "isLumpSum" && value === true) {
        newTariff.unit = "LUMP_SUM";
      }
      return newTariff;
    });
    onChange(updated);
  };

  const totalsByCurrency = useMemo(() => {
    const totals: Record<string, number> = {};
    tariffs.forEach((t) => {
      if (!totals[t.currency || "IRR"]) totals[t.currency || "IRR"] = 0;
      totals[t.currency || "IRR"] += t.total || parseNumberInput(t.rate as string);
    });
    return totals;
  }, [tariffs]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-primary">Tariff Lines</h3>
          <Badge tone="indigo">{tariffs.length}</Badge>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addTariff}
          className="gap-1.5 text-xs"
        >
          ➕ Add Tariff
        </Button>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs font-medium text-rose-700">
          ✕ {error}
        </div>
      )}

      <div className="space-y-2">
        {tariffs.map((tariff, index) => (
          <div
            key={tariff.id}
            className={`rounded-lg border p-3 ${
              tariff.isLumpSum
                ? (isDark ? "border-indigo-700 bg-indigo-900/20" : "border-indigo-200 bg-indigo-50/30")
                : (isDark ? "border-slate-700 bg-muted/50" : "border-slate-200 bg-muted/50")
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-secondary">#{index + 1}</span>
              {tariff.isLumpSum && <Badge tone="indigo">Lump Sum</Badge>}
              <div className="flex-1" />
              {tariffs.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTariff(tariff.id)}
                  className="p-1 text-rose-600 hover:bg-rose-100 rounded transition-colors"
                  title="Remove"
                >
                  🗑️
                </button>
              )}
            </div>

            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-6">
                <input
                  type="text"
                  value={tariff.description}
                  onChange={(e) => updateTariff(tariff.id, "description", e.target.value)}
                  placeholder="Description..."
                  className="w-full rounded border px-2 py-1.5 text-xs input-themed"
                />
              </div>

              <div className="col-span-2">
                <select
                  value={tariff.unit}
                  onChange={(e) => updateTariff(tariff.id, "unit", e.target.value)}
                  className="w-full rounded border px-2 py-1.5 text-xs input-themed"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u === "MAN_DAY" ? "Man Day" : u === "DOCUMENT" ? "Document" : u === "VESSEL" ? "Vessel" : "Lump Sum"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-3">
                <input
                  type="text"
                  inputMode="numeric"
                  value={tariff.rate}
                  onChange={(e) => updateTariff(tariff.id, "rate", formatNumberInput(e.target.value))}
                  className="w-full rounded border px-2 py-1.5 text-xs font-mono text-right input-themed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="Rate"
                />
              </div>

              <div className="col-span-1">
                <select
                  value={tariff.currency}
                  onChange={(e) => updateTariff(tariff.id, "currency", e.target.value)}
                  className="w-full rounded border px-1 py-1.5 text-[10px] font-semibold input-themed"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showTotals && Object.keys(totalsByCurrency).length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="text-xs font-semibold text-primary mb-2">Totals by Currency:</div>
          {Object.entries(totalsByCurrency).map(([currency, total]) => (
            <div key={currency} className={`flex items-center justify-between rounded-lg border p-3 ${
              isDark ? "border-slate-700 bg-muted" : "border-slate-200 bg-muted"
            }`}>
              <div className="flex items-center gap-2">
                <Badge tone="indigo">{currency}</Badge>
                <span className="text-sm font-semibold text-primary">Total:</span>
              </div>
              <span className="text-lg font-bold text-accent-emerald">{total.toLocaleString("en-US")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ MAIN COMPONENT ============
export function Contracts() {
  const { isDark } = useTheme();

  const [contracts, setContracts] = useState<Contract[]>(initialContracts);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [typeFilter, setTypeFilter] = useState<"ALL" | "CONTRACT" | "WORK_ORDER">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");
  const [sortBy, setSortBy] = useState<"date" | "value" | "status">("date");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    setStatusFilter("ALL");
  }, [typeFilter]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    contract_no: "",
    external_contract_no: "",
    source_type: "LETTER" as "EMAIL" | "LETTER",
    source_ref: "",
    source_file: "",
    source_file_object: null as File | null,
    source_letter_date: "",
    source_letter_image: "",
    source_letter_image_object: null as File | null,
    source_letter_image_preview: "",
    source_email_from: "",
    source_email_date: new Date().toISOString().split("T")[0],
    client_id: "",
    contract_title: "",
    start_date: "",
    end_date: "",
    total_value: 0,
    currency: "IRR",
    status: "ACTIVE" as "ACTIVE" | "COMPLETED",
    type: "CONTRACT" as "CONTRACT" | "WORK_ORDER",
    contract_count: 1,
    description: "",
    tariffs: [
      {
        id: "1",
        description: "",
        unit: "MAN_DAY",
        rate: "",
        currency: "IRR",
        total: 0,
        isLumpSum: false,
      },
    ] as TariffLine[],
  });

  const [editForm, setEditForm] = useState<any>({});
  const [addErrors, setAddErrors] = useState<any>({});
  const [isClientContractsOpen, setIsClientContractsOpen] = useState(false);
  const [clientContractsList, setClientContractsList] = useState<Contract[]>([]);
  const [selectedClientForView, setSelectedClientForView] = useState<any>(null);
  const [viewFilterType, setViewFilterType] = useState<"ALL" | "CONTRACT" | "WORK_ORDER">("ALL");
  const [viewFilterStatus, setViewFilterStatus] = useState<string>("ALL");
  const [userRole, setUserRole] = useState<"admin" | "user">("admin");
  const [confirmCompleteOpen, setConfirmCompleteOpen] = useState(false);
  const [contractToComplete, setContractToComplete] = useState<Contract | null>(null);
  const [completeReason, setCompleteReason] = useState("");

  useEffect(() => {
    const returnData = localStorage.getItem("returnToContract");
    if (returnData && isAddModalOpen) {
      const data = JSON.parse(returnData);
      setAddForm((prev) => ({
        ...prev,
        type: data.type || "WORK_ORDER",
        source_type: data.sourceType || "LETTER",
        source_ref: data.sourceRef || "",
        source_letter_date: data.sourceLetterDate || "",
        source_email_from: data.sourceEmailFrom || "",
        source_email_date: data.sourceEmailDate || new Date().toISOString().split("T")[0],
        source_file: data.sourceFile || "",
        client_id: data.newClientId || "",
      }));
      localStorage.removeItem("returnToContract");
    }
  }, [isAddModalOpen]);

  // ============ 1. BASE CONTRACTS ============
  const baseContracts = useMemo(() => {
    return contracts.filter((contract) => {
      const query = searchQuery.toLowerCase();
      return (
        !query ||
        contract.contract_no.toLowerCase().includes(query) ||
        (contract.external_contract_no && contract.external_contract_no.toLowerCase().includes(query)) ||
        contract.client_name.toLowerCase().includes(query) ||
        contract.contract_title.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, contracts]);

  // ============ 2. CROSS-FILTERED COUNTS ============
  const filterCounts = useMemo(() => {
    return {
      type: {
        ALL: baseContracts.filter(c => statusFilter === "ALL" || c.status === statusFilter).length,
        CONTRACT: baseContracts.filter(c => c.type === "CONTRACT" && (statusFilter === "ALL" || c.status === statusFilter)).length,
        WORK_ORDER: baseContracts.filter(c => c.type === "WORK_ORDER" && (statusFilter === "ALL" || c.status === statusFilter)).length,
      },
      status: {
        ALL: baseContracts.filter(c => typeFilter === "ALL" || c.type === typeFilter).length,
        ACTIVE: baseContracts.filter(c => c.status === "ACTIVE" && (typeFilter === "ALL" || c.type === typeFilter)).length,
        COMPLETED: baseContracts.filter(c => c.status === "COMPLETED" && (typeFilter === "ALL" || c.type === typeFilter)).length,
      },
      total: baseContracts.length,
      totalValue: baseContracts.reduce((sum, c) => sum + c.total_value, 0),
      totalInvoiced: baseContracts.reduce((sum, c) => sum + c.invoiced, 0),
    };
  }, [baseContracts, typeFilter, statusFilter]);

  // ============ 3. FINAL FILTERED ============
  const filteredContracts = useMemo(() => {
    let result = baseContracts.filter((contract) => {
      const matchesType = typeFilter === "ALL" || contract.type === typeFilter;
      const matchesStatus = statusFilter === "ALL" || contract.status === statusFilter;
      return matchesType && matchesStatus;
    });
    return result.sort((a, b) => {
      if (sortBy === "date") return b.start_date.localeCompare(a.start_date);
      if (sortBy === "value") return b.total_value - a.total_value;
      if (sortBy === "status") {
        const order: Record<string, number> = { ACTIVE: 1, COMPLETED: 2 };
        return (order[a.status] || 99) - (order[b.status] || 99);
      }
      return 0;
    });
  }, [baseContracts, typeFilter, statusFilter, sortBy]);

  const selectedTariffs = useMemo(() => {
    if (!selectedContract) return [];
    return contractTariffs.filter((t) => t.contract_id === selectedContract.id);
  }, [selectedContract]);

  const totalPerformedWork = useMemo(() => {
    if (!selectedContract) return 0;
    return selectedTariffs.reduce((sum, t) => {
      const rate = typeof t.rate === 'string' ? Number(t.rate.replace(/,/g, '')) || 0 : (t.rate || 0);
      const consumed = t.consumed_quantity || 0;
      return sum + (rate * consumed);
    }, 0);
  }, [selectedContract, selectedTariffs]);

  useEffect(() => {
    if (isAddModalOpen) {
      const newContractNo = generateContractNo(addForm.type, contracts);
      setAddForm((prev) => ({
        ...prev,
        contract_no: newContractNo,
        external_contract_no: "",
        source_type: "LETTER",
        source_ref: "",
        source_file: "",
        source_file_object: null,
        source_letter_date: "",
        source_letter_image: "",
        source_letter_image_object: null,
        source_letter_image_preview: "",
        source_email_from: "",
        source_email_date: new Date().toISOString().split("T")[0],
        client_id: "",
        contract_title: "",
        start_date: "",
        end_date: "",
        total_value: 0,
        currency: "IRR",
        status: "ACTIVE",
        contract_count: 1,
        description: "",
        tariffs: [
          {
            id: "1",
            description: "",
            unit: "MAN_DAY",
            rate: "",
            currency: "IRR",
            total: 0,
            isLumpSum: false,
          },
        ],
      }));
      setAddErrors({});
    }
  }, [addForm.type]);

  const getExistingContractsForClient = (clientId: string) => {
    return contracts.filter((c) => c.client_id === clientId && c.department === CURRENT_DEPARTMENT);
  };

  const handleExportToExcel = () => {
    const dataToExport = filteredContracts.map((c) => ({
      "شماره داخلی": c.contract_no,
      "نوع": c.type === "CONTRACT" ? "قرارداد" : "سفارش کار",
      "مشتری": c.client_name,
      "عنوان": c.contract_title,
      "وضعیت": c.status,
      "تاریخ شروع": c.start_date,
      "تاریخ پایان": c.end_date,
      "ارزش کل": c.total_value,
    }));
    const filterName = typeFilter === "ALL" ? "All" : typeFilter === "CONTRACT" ? "Contracts" : "WorkOrders";
    const today = new Date().toISOString().split("T")[0];
    exportToExcel(dataToExport, `${filterName}_Contracts_${today}`, "Contracts");
  };

  const handleAddClick = () => {
    const contractNo = generateContractNo("CONTRACT", contracts);
    setAddForm({
      contract_no: contractNo,
      external_contract_no: "",
      source_type: "LETTER",
      source_ref: "",
      source_file: "",
      source_file_object: null,
      source_letter_date: "",
      source_letter_image: "",
      source_letter_image_object: null,
      source_letter_image_preview: "",
      source_email_from: "",
      source_email_date: new Date().toISOString().split("T")[0],
      client_id: "",
      contract_title: "",
      start_date: "",
      end_date: "",
      total_value: 0,
      currency: "IRR",
      status: "ACTIVE",
      type: "CONTRACT",
      contract_count: 1,
      description: "",
      tariffs: [
        {
          id: "1",
          description: "",
          unit: "MAN_DAY",
          rate: "",
          currency: "IRR",
          total: 0,
          isLumpSum: false,
        },
      ],
    });
    setAddErrors({});
    setIsAddModalOpen(true);
  };

  const validateAddForm = () => {
    const errors: any = {};
    if (addForm.type === "WORK_ORDER") {
      if (addForm.source_type === "LETTER") {
        if (!addForm.source_ref.trim()) errors.source_ref = "Letter number is required";
        if (!addForm.source_letter_date) errors.source_letter_date = "Letter date is required";
        if (!addForm.source_letter_image) errors.source_letter_image = "Letter image is required";
      } else if (addForm.source_type === "EMAIL") {
        if (!addForm.source_email_from.trim()) errors.source_email_from = "Email address is required";
      }
      if (!addForm.client_id) errors.client_id = "Client selection is required";
      if (!addForm.contract_title.trim()) errors.contract_title = "Work order title is required";

      if (!addForm.tariffs || addForm.tariffs.length === 0) {
        errors.tariffs = "At least one tariff line is required";
      } else {
        const emptyTariff = addForm.tariffs.find((t) => !t.description.trim() || !t.rate || parseNumberInput(t.rate as string) <= 0);
        if (emptyTariff) errors.tariffs = "All tariff lines must have description and rate";
      }
    } else {
      if (!addForm.contract_title.trim()) errors.contract_title = "Contract title is required";
      if (!addForm.client_id) errors.client_id = "Client selection is required";
      if (!addForm.start_date) errors.start_date = "Start date is required";
      if (!addForm.end_date) errors.end_date = "End date is required";
      if (addForm.start_date && addForm.end_date && addForm.end_date < addForm.start_date) {
        errors.end_date = "End date cannot be before start date";
      }
      if (addForm.total_value <= 0) errors.total_value = "Amount must be greater than zero";
      if (!addForm.contract_count || addForm.contract_count <= 0) errors.contract_count = "Contract count is required";
    }

    setAddErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveAdd = () => {
    if (!validateAddForm()) return;
    const client = clients.find((c) => c.id === addForm.client_id);
    const newContract: Contract = {
      id: `ct${Date.now()}`,
      ...addForm,
      client_name: client?.name_en || "N/A",
      invoiced: 0,
      tariffs: addForm.tariffs.length,
      tariffLines: addForm.tariffs,
      department: CURRENT_DEPARTMENT,
    };
    setContracts([newContract, ...contracts]);
    setSelectedContract(newContract);
    setIsDetailsOpen(true);
    if (addForm.source_type === "EMAIL" && addForm.source_email_from && addForm.client_id) {
      setClients(prevClients =>
        prevClients.map(client => {
          if (client.id === addForm.client_id) {
            const existingEmails = client.emails || [];
            if (!existingEmails.includes(addForm.source_email_from)) {
              return {
                ...client,
                emails: [...existingEmails, addForm.source_email_from]
              };
            }
          }
          return client;
        })
      );
    }
    setIsAddModalOpen(false);
  };

  const handleEditClick = () => {
    if (!selectedContract) return;
    setEditForm({ ...selectedContract });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedContract) return;
    const updatedContracts = contracts.map((c) =>
      c.id === selectedContract.id ? { ...c, ...editForm } : c
    );
    setContracts(updatedContracts);
    setSelectedContract({ ...selectedContract, ...editForm });
    setIsEditModalOpen(false);
  };

  const handleRequestComplete = (contract: Contract) => {
    setContractToComplete(contract);
    setCompleteReason("");
    setConfirmCompleteOpen(true);
  };

  const handleConfirmComplete = () => {
    if (!contractToComplete) return;
    const updatedContracts = contracts.map((c) =>
      c.id === contractToComplete.id ? { ...c, status: "COMPLETED" as const } : c
    );
    setContracts(updatedContracts);
    if (selectedContract?.id === contractToComplete.id) {
      setSelectedContract({ ...contractToComplete, status: "COMPLETED" });
    }
    setConfirmCompleteOpen(false);
    setContractToComplete(null);
    setCompleteReason("");
  };

  const handleTypeChange = (type: "CONTRACT" | "WORK_ORDER") => {
    setAddForm({ ...addForm, type });
  };

  const handleViewClientContracts = () => {
    if (!addForm.client_id) return;
    let existingContracts = contracts.filter(
      (c) => c.client_id === addForm.client_id && c.department === CURRENT_DEPARTMENT
    );
    if (addForm.type === "WORK_ORDER") {
      existingContracts = existingContracts.filter((c) => c.type === "WORK_ORDER");
      setViewFilterType("WORK_ORDER");
    } else {
      setViewFilterType("ALL");
    }
    const client = clients.find((c) => c.id === addForm.client_id);
    setClientContractsList(existingContracts);
    setSelectedClientForView(client);
    setViewFilterStatus("ALL");
    setIsClientContractsOpen(true);
  };

  const handleNavigateToClients = () => {
    localStorage.setItem(
      "returnToContract",
      JSON.stringify({
        type: addForm.type,
        sourceType: addForm.source_type,
        sourceRef: addForm.source_ref,
        sourceLetterDate: addForm.source_letter_date,
        sourceEmailFrom: addForm.source_email_from,
        sourceEmailDate: addForm.source_email_date,
        sourceFile: addForm.source_file,
      })
    );
    window.dispatchEvent(new CustomEvent("navigateToClients", { detail: { returnTo: "contracts" } }));
  };

  const filteredClientContracts = useMemo(() => {
    let result = clientContractsList;
    if (viewFilterType !== "ALL") result = result.filter((c) => c.type === viewFilterType);
    if (viewFilterStatus !== "ALL") result = result.filter((c) => c.status === viewFilterStatus);
    return result;
  }, [clientContractsList, viewFilterType, viewFilterStatus]);

  const clientContractCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: clientContractsList.length };
    clientContractsList.forEach((c) => { counts[c.status] = (counts[c.status] || 0) + 1; });
    return counts;
  }, [clientContractsList]);

  const availableStatuses = useMemo(() => {
    const statuses = new Set(clientContractsList.map((c) => c.status));
    return Array.from(statuses);
  }, [clientContractsList]);

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 p-3 lg:p-6 h-auto lg:h-[calc(100vh-140px)]`}>
      {/* LEFT PANEL */}
      <div className={`col-span-1 lg:col-span-4 relative flex flex-col rounded-xl border shadow-sm overflow-hidden transition-all duration-300 ease-in-out max-h-[50vh] lg:max-h-none ${
        isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200/70"
      }`}>
        <div className={`relative z-10 border-b px-4 py-4 space-y-3 ${
          isDark ? "border-slate-700 bg-slate-800/50" : "border-slate-100 bg-slate-50/50"
        }`}>
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-primary shrink-0">Contracts</h3>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by contract no, client, title..."
                className="w-full rounded-lg py-2 pl-9 pr-8 text-sm input-themed"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary">✕</button>
              )}
            </div>
          </div>

          <div className={`flex items-center justify-end gap-3 pt-2 border-t border-theme`}>
            <Button variant="outline" size="sm" onClick={handleExportToExcel} className="shrink-0 gap-1.5 text-xs">📥 Export</Button>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "date" | "value" | "status")}
                className="appearance-none text-xs rounded-md pl-2 pr-6 py-2 font-medium cursor-pointer input-themed"
              >
                <option value="date">Latest First</option>
                <option value="value">Highest Value</option>
                <option value="status">By Status</option>
              </select>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none text-[10px]">▼</span>
            </div>
          </div>

          <div className={`flex gap-2 rounded-lg border p-1 text-xs ${
            isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"
          }`}>
            <div className="flex-1 flex gap-1 rounded-md filter-group-inner p-0.5">
              {(["ALL", "CONTRACT", "WORK_ORDER"] as const).map((t) => {
                const count = t === "ALL" ? contracts.length : t === "CONTRACT" ? contracts.filter(c => c.type === "CONTRACT").length : contracts.filter(c => c.type === "WORK_ORDER").length;
                return (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`flex-1 rounded px-1 py-1 font-medium transition-all whitespace-nowrap ${
                      typeFilter === t
                        ? (isDark ? "bg-card text-indigo-300 shadow-sm" : "bg-card text-indigo-700 shadow-sm")
                        : (isDark ? "text-secondary hover:text-primary" : "text-secondary hover:text-slate-700")
                    }`}
                  >
                    {t === "ALL" ? `All (${count})` : t === "CONTRACT" ? `📄 (${count})` : `📦(${count})`}
                  </button>
                );
              })}
            </div>

            <div className={`h-6 w-px shrink-0 ${isDark ? "bg-slate-700" : "bg-slate-200"}`} />

            <div className="flex-1 flex gap-1 rounded-md filter-group-inner p-0.5">
              {(["ALL", "ACTIVE", "COMPLETED"] as const).map((t) => {
                const baseContractsFiltered = typeFilter === "ALL"
                  ? contracts
                  : contracts.filter(c => c.type === typeFilter);
                const count = t === "ALL"
                  ? baseContractsFiltered.length
                  : t === "ACTIVE"
                    ? baseContractsFiltered.filter(c => c.status === "ACTIVE").length
                    : baseContractsFiltered.filter(c => c.status === "COMPLETED").length;
                return (
                  <button
                    key={t}
                    onClick={() => setStatusFilter(t)}
                    className={`flex-1 rounded px-1 py-1 font-medium transition-all whitespace-nowrap ${
                      statusFilter === t
                        ? (isDark ? "bg-card text-emerald-300 shadow-sm" : "bg-card text-emerald-700 shadow-sm")
                        : (isDark ? "text-secondary hover:text-primary" : "text-secondary hover:text-slate-700")
                    }`}
                  >
                    {t === "ALL" ? `All (${count})` : t === "ACTIVE" ? `🟢 (${count})` : `⚫ (${count})`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-24">
          {filteredContracts.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-2">📄</div>
              <p className="text-sm text-secondary">No contracts found</p>
            </div>
          ) : (
            filteredContracts.map((contract) => {
              const progress = calculateProgressFromTariffs(contract);
              return (
                <div
                  key={contract.id}
                  onClick={() => { setSelectedContract(contract); setIsDetailsOpen(true); }}
                  className={`flex flex-col gap-2 px-4 py-3 border-b border-theme cursor-pointer transition-colors ${
                    selectedContract?.id === contract.id
                      ? (isDark ? "bg-indigo-900/30 border-l-4 border-l-indigo-400" : "bg-indigo-50 border-l-4 border-l-indigo-500")
                      : (isDark ? "hover:bg-muted" : "hover:bg-muted")
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge tone={contract.type === "CONTRACT" ? "indigo" : "amber"}>
                          {contract.type === "CONTRACT" ? "Contract" : "Work Order"}
                        </Badge>
                        <span className="font-mono text-xs text-secondary">{contract.contract_no}</span>
                      </div>
                      <div className="text-sm font-medium text-primary truncate">{contract.contract_title}</div>
                      <div className="text-xs text-secondary truncate">{contract.client_name}</div>
                    </div>
                    {(() => {
                      const financialStatus = getContractFinancialStatus(contract);
                      if (contract.status === "COMPLETED") {
                        return <Badge tone="slate">✓ Completed</Badge>;
                      }
                      if (financialStatus === "needs_review") {
                        return (
                          <Badge tone="amber" className="gap-1">
                            <span>⚠️</span>
                            <span>Needs Review</span>
                          </Badge>
                        );
                      }
                      return <Badge tone="emerald">🟢 Active</Badge>;
                    })()}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-secondary" dir="rtl">{contract.start_date} → {contract.end_date}</span>
                    <span className="font-semibold text-primary">{formatCurrency(contract.total_value, contract.currency)}</span>
                  </div>
                  <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-slate-100"}`}>
                    {(() => {
                      const progress = calculateProgressFromTariffs(contract);
                      return (
                        <div
                          className={`h-full rounded-full ${getProgressColor(progress)}`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      );
                    })()}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className={`absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t pointer-events-none z-10 ${
          isDark ? "from-card via-card/90" : "from-card via-card/90"
        } to-transparent`} />
        <div className="absolute bottom-6 left-0 right-0 px-6 z-20">
          <Button
            variant="primary"
            size="md"
            onClick={handleAddClick}
            className="w-full justify-center gap-2 shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all duration-300"
          >
            <span>➕</span> Add New Contract
          </Button>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className={`col-span-1 lg:col-span-8 flex flex-col rounded-xl border shadow-sm overflow-hidden transition-all duration-300 ease-in-out ${
        isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200/70"
      }`}>
        {selectedContract ? (
          <>
            <div className={`border-b border-theme px-6 py-4 ${
              isDark
                ? "bg-gradient-to-r from-slate-800 to-card"
                : "bg-gradient-to-r from-slate-50 to-white"
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-secondary">Contract Details</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedContract(null)}
                  className={`transition-colors ${
                    isDark ? "text-muted hover:text-rose-400 hover:bg-rose-900/30" : "text-muted hover:text-rose-600 hover:bg-rose-50"
                  }`}
                >✕ Close Panel</Button>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-lg font-bold">📄</div>
                  <div>
                    <h3 className="text-xl font-bold text-primary">{selectedContract.contract_title}</h3>
                    <p className="text-sm text-secondary font-mono">{selectedContract.contract_no} • {selectedContract.client_name}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge tone={selectedContract.type === "CONTRACT" ? "indigo" : "amber"}>
                        {selectedContract.type === "CONTRACT" ? "Contract" : "Work Order"}
                      </Badge>
                      {(() => {
                        const financialStatus = getContractFinancialStatus(selectedContract);
                        if (selectedContract.status === "COMPLETED") {
                          return <Badge tone="slate">✓ Completed</Badge>;
                        }
                        if (financialStatus === "needs_review") {
                          return (
                            <div className="flex items-center gap-2">
                              <Badge tone="amber" className="gap-1">
                                <span>⚠️</span>
                                <span>Needs Financial Review</span>
                              </Badge>
                              {userRole === "admin" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRequestComplete(selectedContract)}
                                  className={`gap-1 text-xs ${
                                    isDark ? "border-amber-600 text-amber-300 hover:bg-amber-900/30" : "border-amber-300 text-amber-700 hover:bg-amber-50"
                                  }`}
                                >
                                  <span>✓</span>
                                  <span>Mark as Completed</span>
                                </Button>
                              )}
                            </div>
                          );
                        }
                        return <Badge tone="emerald">🟢 Active</Badge>;
                      })()}
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="md" onClick={handleEditClick} className="gap-2 shadow-sm">
                  <span>✏️</span> Edit {selectedContract.type === "CONTRACT" ? "Contract" : "Work Order"}
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div className={`rounded-lg border border-theme p-4 bg-muted/30`}>
                  <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">📋 Contract Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 text-sm">
                    <div>
                      <div className="text-[10px] uppercase text-secondary font-semibold mb-1">Internal Contract No.</div>
                      <div className="font-mono text-xs text-primary">{selectedContract.contract_no}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-secondary font-semibold mb-1">External Contract No.</div>
                      <div className="font-mono text-xs text-primary">{selectedContract.external_contract_no || "—"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-secondary font-semibold mb-1">Currency</div>
                      <div className="text-xs text-primary">{selectedContract.currency}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-secondary font-semibold mb-1">Start Date</div>
                      <div className="text-xs text-primary">{selectedContract.start_date}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-secondary font-semibold mb-1">End Date</div>
                      <div className="text-xs text-primary">{selectedContract.end_date}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-secondary font-semibold mb-1">Total Value</div>
                      <div className="text-xs font-semibold text-accent-emerald">{formatCurrency(selectedContract.total_value, selectedContract.currency)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-secondary font-semibold mb-1">Total Performed Works</div>
                      <div className="text-xs font-semibold text-accent-emerald">{formatCurrency(totalPerformedWork, selectedContract.currency)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-secondary font-semibold mb-1">Invoiced</div>
                      <div className="text-xs font-semibold text-accent-indigo">
                        {formatCurrency(selectedTariffs.reduce((sum, t) => sum + ((t as any).invoiced || 0), 0))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-secondary font-semibold mb-1">Not Invoiced</div>
                      {(() => {
                        const totalInvoiced = selectedTariffs.reduce((sum, t) => sum + ((t as any).invoiced || 0), 0);
                        const notInvoiced = Math.max(0, totalPerformedWork - totalInvoiced);
                        return <div className="text-xs font-semibold text-accent-rose">{formatCurrency(notInvoiced, selectedContract.currency)}</div>;
                      })()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                  <Card className={`p-4 bg-muted/50`}>
                    <div className="text-xs text-secondary">Total Performed Work (%)</div>
                    {(() => {
                      const workProgress = calculateProgressFromTariffs(selectedContract);
                      return (
                        <>
                          <div className={`text-lg font-bold ${getProgressTextClass(workProgress)}`}>
                            {workProgress.toFixed(2)}%
                          </div>
                          <div className={`mt-2 h-1.5 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-slate-200"}`}>
                            <div
                              className={`h-full rounded-full ${getProgressColor(workProgress)}`}
                              style={{ width: `${Math.min(workProgress, 100)}%` }}
                            />
                          </div>
                        </>
                      );
                    })()}
                  </Card>

                  <Card className={`p-4 bg-muted/50`}>
                    <div className="text-xs text-secondary">Total Invoiced (%)</div>
                    {(() => {
                      const spent = calculateBudgetSpent(selectedContract.total_value, selectedContract.invoiced);
                      return (
                        <>
                          <div className={`text-lg font-bold ${getProgressTextColor(spent)}`}>
                            {spent.toFixed(1)}%
                            {spent > 100 && <span className="text-xs ml-1">(Over)</span>}
                          </div>
                          <div className={`mt-2 h-1.5 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-slate-200"}`}>
                            <div
                              className={`h-full rounded-full ${getProgressColor(spent)}`}
                              style={{ width: `${Math.min(spent, 100)}%` }}
                            />
                          </div>
                        </>
                      );
                    })()}
                  </Card>

                  <Card className={`p-4 bg-muted/50`}>
                    {(() => {
                      const daysUntilStart = getDaysUntilStart(selectedContract.start_date);
                      const notStarted = daysUntilStart > 0;
                      const daysLeft = calculateDaysLeft(selectedContract.end_date);
                      const isExpired = daysLeft < 0;
                      const isFullyInvoiced = selectedContract.invoiced >= selectedContract.total_value;
                      const needsFinancialReview = isExpired && !isFullyInvoiced;

                      if (notStarted) {
                        return (
                          <>
                            <div className="text-xs text-secondary">Status</div>
                            <div className="text-lg font-bold text-amber-600">⏳ Not Started</div>
                            <div className="text-[10px] text-amber-500 mt-0.5">Starts in {daysUntilStart} days</div>
                          </>
                        );
                      }

                      if (selectedContract.status === "COMPLETED") {
                        return (
                          <>
                            <div className="text-xs text-secondary">Status</div>
                            <div className="text-lg font-bold text-slate-600">✓ Completed</div>
                          </>
                        );
                      }

                      if (needsFinancialReview) {
                        return (
                          <>
                            <div className="text-xs text-secondary mb-2">Financial Status</div>
                            <div className="text-lg font-bold text-amber-600 mb-2">⚠️ Needs Review</div>
                            <button
                              onClick={() => userRole === "admin" && handleRequestComplete(selectedContract)}
                              disabled={userRole !== "admin"}
                              className={`w-full rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                                userRole === "admin"
                                  ? "bg-amber-500 text-white hover:bg-amber-600 shadow-sm cursor-pointer"
                                  : (isDark ? "bg-slate-700 text-slate-400 cursor-not-allowed opacity-60" : "bg-slate-100 text-slate-400 cursor-not-allowed opacity-60")
                              }`}
                              title={userRole !== "admin" ? "Only managers can approve completion" : "Click to mark as completed"}
                            >
                              {userRole === "admin" ? (
                                <span className="flex items-center justify-center gap-1.5">
                                  <span>✓</span>
                                  <span>Mark as Completed</span>
                                </span>
                              ) : (
                                <span className="flex items-center justify-center gap-1.5">
                                  <span>🔒</span>
                                  <span>Manager Approval Required</span>
                                </span>
                              )}
                            </button>
                          </>
                        );
                      }

                      if (daysLeft < 0) {
                        return (
                          <>
                            <div className="text-xs text-secondary">Status</div>
                            <div className="text-lg font-bold text-rose-600">{Math.abs(daysLeft)} days overdue</div>
                          </>
                        );
                      } else if (daysLeft === 0) {
                        return (
                          <>
                            <div className="text-xs text-secondary">Time Remaining</div>
                            <div className="text-lg font-bold text-amber-600">Today (Expires)</div>
                          </>
                        );
                      } else {
                        return (
                          <>
                            <div className="text-xs text-secondary">Time Remaining</div>
                            <div className="text-lg font-bold text-emerald-600">{daysLeft} days remaining</div>
                          </>
                        );
                      }
                    })()}
                  </Card>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-primary mb-3">Tariff Lines & Consumption ({selectedTariffs.length})</h3>
                  {selectedTariffs.length === 0 ? (
                    <div className="text-center py-8 text-muted text-sm">No tariff lines defined for this contract</div>
                  ) : (
                    <div className={`overflow-x-auto rounded-lg border border-theme`}>
                      <table className="w-full text-left text-xs">
                        <thead className={`bg-muted text-[10px] uppercase tracking-wide text-secondary`}>
                          <tr>
                            <th className="px-3 py-2 font-medium">Description</th>
                            <th className="px-3 py-2 font-medium">Unit</th>
                            <th className="px-3 py-2 font-medium text-right">Rate</th>
                            <th className="px-3 py-2 font-medium text-center">Performed Work</th>
                            <th className="px-3 py-2 font-medium text-right">Total Value of Performed Works</th>
                            <th className="px-3 py-2 font-medium text-right">Total Invoiced</th>
                          </tr>
                        </thead>
                        <tbody className={isDark ? "divide-y divide-slate-700" : "divide-y divide-slate-100"}>
                          {selectedTariffs.map((tariff) => {
                            const value = tariff.consumed_quantity * tariff.rate;
                            const invoiced = (tariff as any).invoiced || 0;
                            return (
                              <tr key={tariff.id} className={isDark ? "hover:bg-muted/60" : "hover:bg-muted/60"}>
                                <td className={`px-3 py-2 font-medium text-primary`}>{tariff.description}</td>
                                <td className="px-3 py-2"><Badge tone="indigo">{tariff.unit.replace("_", " ")}</Badge></td>
                                <td className="px-3 py-2 text-right font-mono">{formatCurrency(tariff.rate, selectedContract.currency)}</td>
                                <td className="px-3 py-2 text-center font-mono">{tariff.consumed_quantity}</td>
                                <td className="px-3 py-2 text-right font-mono font-semibold text-accent-emerald">{formatCurrency(value, selectedContract.currency)}</td>
                                <td className="px-3 py-2 text-right font-mono font-semibold text-accent-indigo">{formatCurrency(invoiced)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className={isDark ? "bg-muted border-t-2 border-slate-600" : "bg-slate-100 border-t-2 border-slate-300"}>
                          <tr>
                            <td colSpan={3} className={`px-3 py-2.5 text-sm font-bold text-left uppercase tracking-wider text-primary`}>💰 Total</td>
                            <td className="px-3 py-2.5 text-center font-mono font-bold text-primary"></td>
                            <td className="px-3 py-2.5 text-right font-mono font-bold text-accent-emerald">
                              {formatCurrency(selectedTariffs.reduce((sum, t) => sum + ((t.consumed_quantity || 0) * (t.rate || 0)), 0))}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono font-bold text-accent-indigo">
                              {formatCurrency(selectedTariffs.reduce((sum, t) => sum + ((t as any).invoiced || 0), 0))}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className={`flex-1 flex items-center justify-center relative overflow-hidden min-h-[600px] ${
            isDark
              ? "bg-gradient-to-br from-slate-800 via-card to-indigo-950/30"
              : "bg-gradient-to-br from-slate-50 via-white to-indigo-50/30"
          }`}>
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='${isDark ? '%23ffffff' : '%23000000'}' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />

            <div className="text-center z-10 relative">
              <div className="relative inline-block mb-8">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 blur-2xl opacity-40 animate-pulse" />
                <div className={`relative inline-flex items-center justify-center w-44 h-44 rounded-full shadow-2xl shadow-indigo-500/30 border-4 ${
                  isDark ? "bg-slate-800 border-slate-700" : "bg-white border-white"
                }`}>
                  <img src="public/images/logo.png" alt="ICS Logo" className="w-36 h-36 object-contain" />
                </div>
              </div>

              <h2 className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-3 ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                OFFSHORE & ENERGY DEPARTMENT INSPECTION PLATFORM
              </h2>
              <p className={`text-base max-w-md mx-auto leading-relaxed ${isDark ? "text-secondary" : "text-slate-500"}`}>
                Select a contract from the list to view details, tariffs, and progress information
              </p>

              <div className="flex items-center justify-center gap-6 mt-8">
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isDark ? "bg-indigo-900/50" : "bg-indigo-100"}`}>📄</div>
                  <span className={`text-xs font-medium ${isDark ? "text-secondary" : "text-slate-500"}`}>Contracts</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isDark ? "bg-emerald-900/50" : "bg-emerald-100"}`}>📊</div>
                  <span className={`text-xs font-medium ${isDark ? "text-secondary" : "text-slate-500"}`}>Tariffs</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isDark ? "bg-amber-900/50" : "bg-amber-100"}`}>📈</div>
                  <span className={`text-xs font-medium ${isDark ? "text-secondary" : "text-slate-500"}`}>Progress</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ADD CONTRACT MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Contract" size="lg">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-primary">Type *</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange("CONTRACT")}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  addForm.type === "CONTRACT"
                    ? "bg-indigo-600 text-white shadow-md"
                    : (isDark ? "bg-muted text-secondary hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                }`}
              >
                📄 Contract
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange("WORK_ORDER")}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  addForm.type === "WORK_ORDER"
                    ? "bg-amber-600 text-white shadow-md"
                    : (isDark ? "bg-muted text-secondary hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                }`}
              >
                📦 Work Order
              </button>
            </div>
          </div>

          <div className={`rounded-lg border border-theme bg-muted p-3`}>
            <label className="mb-1.5 block text-xs font-semibold text-primary">Internal Contract No (ICS)</label>
            <div className={`w-full rounded-lg border border-theme bg-card py-2.5 px-3 text-sm font-mono font-semibold text-primary`}>
              {addForm.contract_no}
            </div>
            <p className="text-[10px] text-secondary mt-1">Auto-generated, unique per department</p>
          </div>

          {addForm.type === "CONTRACT" ? (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-primary">Contract Count *</label>
                <input
                  type="number"
                  value={addForm.contract_count || ""}
                  onChange={(e) => setAddForm({ ...addForm, contract_count: Math.max(1, Number(e.target.value)) })}
                  className={`w-full rounded-lg px-3 py-2 text-sm input-themed ${
                    addErrors.contract_count ? "border-rose-300" : ""
                  }`}
                  placeholder="1"
                  min="1"
                />
                {addErrors.contract_count && <p className="mt-1 text-[11px] font-medium text-rose-600">✕ {addErrors.contract_count}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-primary">External Contract No (Optional)</label>
                  <input
                    value={addForm.external_contract_no}
                    onChange={(e) => setAddForm({ ...addForm, external_contract_no: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm font-mono input-themed"
                    placeholder="Client's contract number"
                  />
                </div>
                <div>
                  <ClientSelectorModal
                    value={addForm.client_id}
                    onChange={(clientId) => setAddForm({ ...addForm, client_id: clientId })}
                    onAddNew={handleNavigateToClients}
                    error={addErrors.client_id}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-primary">Contract Title *</label>
                <input
                  value={addForm.contract_title}
                  onChange={(e) => setAddForm({ ...addForm, contract_title: e.target.value })}
                  className={`w-full rounded-lg px-3 py-2 text-sm input-themed ${
                    addErrors.contract_title ? "border-rose-300" : ""
                  }`}
                  placeholder="e.g., South Pars Phase 22 — TPI"
                />
                {addErrors.contract_title && <p className="mt-1 text-[11px] font-medium text-rose-600">✕ {addErrors.contract_title}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-primary">Start Date *</label>
                  <JalaaliDatePicker
                    value={addForm.start_date}
                    onChange={(date) => setAddForm({ ...addForm, start_date: date })}
                    placeholder="Select start date"
                  />
                  {addErrors.start_date && <p className="mt-1 text-[11px] font-medium text-rose-600">✕ {addErrors.start_date}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-primary">End Date *</label>
                  <JalaaliDatePicker
                    value={addForm.end_date}
                    onChange={(date) => setAddForm({ ...addForm, end_date: date })}
                    minDate={addForm.start_date}
                    placeholder="Select end date"
                  />
                  {addErrors.end_date && <p className="mt-1 text-[11px] font-medium text-rose-600">✕ {addErrors.end_date}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-primary">Total Value *</label>
                  <input
                    type="number"
                    value={addForm.total_value || ""}
                    onChange={(e) => setAddForm({ ...addForm, total_value: Number(e.target.value) })}
                    className={`w-full rounded-lg px-3 py-2 text-sm input-themed ${
                      addErrors.total_value ? "border-rose-300" : ""
                    }`}
                    placeholder="0"
                  />
                  {addErrors.total_value && <p className="mt-1 text-[11px] font-medium text-rose-600">✕ {addErrors.total_value}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-primary">Currency</label>
                  <select
                    value={addForm.currency}
                    onChange={(e) => setAddForm({ ...addForm, currency: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm input-themed"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="IRR">IRR</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-primary">Status</label>
                  <select
                    value={addForm.status}
                    onChange={(e) => setAddForm({ ...addForm, status: e.target.value as any })}
                    className="w-full rounded-lg px-3 py-2 text-sm input-themed"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-primary">Description</label>
                <textarea
                  value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg px-3 py-2 text-sm input-themed"
                  placeholder="Optional description..."
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-primary">Source Type *</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAddForm({ ...addForm, source_type: "LETTER" })}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      addForm.source_type === "LETTER"
                        ? "bg-emerald-600 text-white shadow-md"
                        : (isDark ? "bg-muted text-secondary hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                    }`}
                  >
                    📄 Letter
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddForm({ ...addForm, source_type: "EMAIL" })}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      addForm.source_type === "EMAIL"
                        ? "bg-blue-600 text-white shadow-md"
                        : (isDark ? "bg-muted text-secondary hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                    }`}
                  >
                    📧 Email
                  </button>
                </div>
              </div>

              {addForm.source_type === "LETTER" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-primary">Letter Number *</label>
                      <input
                        value={addForm.source_ref}
                        onChange={(e) => setAddForm({ ...addForm, source_ref: e.target.value })}
                        className="w-full rounded-lg bg-card px-3 py-2.5 text-sm font-mono input-themed"
                        placeholder="e.g., 1404/1234"
                      />
                      {addErrors.source_ref && <p className="mt-1 text-[11px] font-medium text-rose-600">✕ {addErrors.source_ref}</p>}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-primary">Letter Date *</label>
                      <JalaaliDatePicker
                        value={addForm.source_letter_date || ""}
                        onChange={(date) => setAddForm({ ...addForm, source_letter_date: date })}
                        placeholder="Select letter date"
                      />
                      {addErrors.source_letter_date && <p className="mt-1 text-[11px] font-medium text-rose-600">✕ {addErrors.source_letter_date}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-primary">
                      Letter Image * <span className="text-rose-500">(Required)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        id="letter-image-input"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const preview = URL.createObjectURL(file);
                            setAddForm({
                              ...addForm,
                              source_letter_image: file.name,
                              source_letter_image_object: file,
                              source_letter_image_preview: preview,
                            });
                          }
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor="letter-image-input"
                        className={`flex items-center justify-between gap-2 w-full rounded-lg border-2 px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                          addForm.source_letter_image
                            ? (isDark ? "border-emerald-600 bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/50" : "border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-emerald-100")
                            : (isDark ? "border-dashed border-slate-600 bg-muted text-secondary hover:border-indigo-500 hover:bg-slate-800" : "border-dashed border-slate-300 bg-muted text-slate-600 hover:border-indigo-400 hover:bg-indigo-50")
                        }`}
                      >
                        {addForm.source_letter_image ? (
                          <>
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span>🖼️</span>
                              <span className="truncate font-medium">{addForm.source_letter_image}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {addForm.source_letter_image_preview && (
                                <img src={addForm.source_letter_image_preview} alt="Preview" className="h-8 w-8 object-cover rounded border border-slate-200" />
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setAddForm({
                                    ...addForm,
                                    source_letter_image: "",
                                    source_letter_image_object: null,
                                    source_letter_image_preview: "",
                                  });
                                  const input = document.getElementById('letter-image-input') as HTMLInputElement;
                                  if (input) input.value = '';
                                }}
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded transition-colors"
                                title="Remove image"
                              >
                                ✕
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>📎</span>
                            <span>Click to attach letter image (JPG, PNG, PDF)</span>
                          </div>
                        )}
                      </label>
                    </div>
                    {addErrors.source_letter_image && <p className="mt-1 text-[11px] font-medium text-rose-600">✕ {addErrors.source_letter_image}</p>}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-primary">From Email Address *</label>
                      <input
                        type="email"
                        value={addForm.source_email_from || ""}
                        onChange={(e) => setAddForm({ ...addForm, source_email_from: e.target.value })}
                        className={`w-full rounded-lg bg-card px-3 py-2.5 text-sm font-mono input-themed ${
                          addErrors.source_email_from ? "border-rose-300" : ""
                        }`}
                        placeholder="sender@example.com"
                      />
                      {addErrors.source_email_from && <p className="mt-1 text-[11px] font-medium text-rose-600">✕ {addErrors.source_email_from}</p>}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-primary">Email Date</label>
                      <input
                        type="date"
                        value={addForm.source_email_date || ""}
                        onChange={(e) => setAddForm({ ...addForm, source_email_date: e.target.value })}
                        className="w-full rounded-lg bg-card px-3 py-2.5 text-sm input-themed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-primary">Attach Email File</label>
                    <div className="relative">
                      <input
                        type="file"
                        id="email-file-input"
                        accept=".msg,.eml"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setAddForm({
                              ...addForm,
                              source_file: file.name,
                              source_file_object: file
                            });
                          }
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor="email-file-input"
                        className={`flex items-center justify-between gap-2 w-full rounded-lg border-2 px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                          addForm.source_file
                            ? (isDark ? "border-emerald-600 bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/50" : "border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-emerald-100")
                            : (isDark ? "border-dashed border-slate-600 bg-muted text-secondary hover:border-indigo-500 hover:bg-slate-800" : "border-dashed border-slate-300 bg-muted text-slate-600 hover:border-indigo-400 hover:bg-indigo-50")
                        }`}
                      >
                        {addForm.source_file ? (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (addForm.source_file_object) {
                                  const url = URL.createObjectURL(addForm.source_file_object);
                                  window.open(url, '_blank');
                                }
                              }}
                              className="flex items-center gap-2 flex-1 text-left hover:underline min-w-0"
                              title="Click to open email"
                            >
                              <span>📧</span>
                              <span className="truncate font-medium">{addForm.source_file}</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setAddForm({ ...addForm, source_file: "", source_file_object: null });
                                const input = document.getElementById('email-file-input') as HTMLInputElement;
                                if (input) input.value = '';
                              }}
                              className="shrink-0 p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded transition-colors"
                              title="Remove file"
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>📎</span>
                            <span>Click to attach (.msg, .eml)</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <ClientSelectorModal
                value={addForm.client_id}
                onChange={(clientId) => setAddForm({ ...addForm, client_id: clientId })}
                onAddNew={handleNavigateToClients}
                error={addErrors.client_id}
              />

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-primary">Work Order Title *</label>
                <input
                  value={addForm.contract_title}
                  onChange={(e) => setAddForm({ ...addForm, contract_title: e.target.value })}
                  className={`w-full rounded-lg px-3 py-2 text-sm input-themed ${
                    addErrors.contract_title ? "border-rose-300" : ""
                  }`}
                  placeholder="Brief title of the work order"
                />
                {addErrors.contract_title && <p className="mt-1 text-[11px] font-medium text-rose-600">✕ {addErrors.contract_title}</p>}
              </div>

              <TariffEditor
                tariffs={addForm.tariffs}
                onChange={(tariffs) => setAddForm({ ...addForm, tariffs })}
                error={addErrors.tariffs}
                showTotals={false}
              />

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-primary">Description (Optional)</label>
                <textarea
                  value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg px-3 py-2 text-sm input-themed"
                  placeholder="Additional details..."
                />
              </div>
            </>
          )}

          <div className={`flex justify-end gap-3 pt-4 border-t ${isDark ? "border-slate-700" : "border-slate-100"}`}>
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAdd}>💾 Save {addForm.type === "CONTRACT" ? "Contract" : "Work Order"}</Button>
          </div>
        </div>
      </Modal>

      {/* EDIT CONTRACT MODAL */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Contract" size="lg">
        {selectedContract && (
          <div className="space-y-4">
            <div className={`rounded-lg border border-theme bg-muted p-4`}>
              <div className="flex items-center gap-2 mb-3">
                <span>🔒</span>
                <h3 className="text-sm font-semibold text-secondary">Read-Only Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-secondary">Internal Contract No</label>
                  <div className={`w-full rounded-lg border border-theme bg-slate-100 py-2.5 px-3 text-sm font-mono ${isDark ? "text-slate-300" : "text-slate-600"}`}>{editForm.contract_no}</div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-secondary">Type</label>
                  <div className={`w-full rounded-lg border border-theme bg-slate-100 py-2.5 px-3 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>{editForm.type === "CONTRACT" ? "Contract" : "Work Order"}</div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-secondary">Department</label>
                  <div className={`w-full rounded-lg border border-theme bg-slate-100 py-2.5 px-3 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>{editForm.department}</div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-secondary">Created Date</label>
                  <div className={`w-full rounded-lg border border-theme bg-slate-100 py-2.5 px-3 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`} dir="rtl">{editForm.start_date}</div>
                </div>
              </div>
            </div>

            <div className={`rounded-lg border p-4 ${isDark ? "border-indigo-700 bg-indigo-950/30" : "border-indigo-200 bg-indigo-50/30"}`}>
              <div className="flex items-center gap-2 mb-3">
                <span>✏️</span>
                <h3 className="text-sm font-semibold text-primary">Editable Information</h3>
              </div>

              <div className="space-y-4">
                {editForm.type === "CONTRACT" ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-primary">External Contract No</label>
                        <input
                          value={editForm.external_contract_no || ""}
                          onChange={(e) => setEditForm({ ...editForm, external_contract_no: e.target.value })}
                          className="w-full rounded-lg bg-card px-3 py-2 text-sm font-mono input-themed"
                          placeholder="Client's contract number"
                        />
                      </div>
                      <div>
                        <ClientSelectorModal
                          value={editForm.client_id || ""}
                          onChange={(clientId) => setEditForm({ ...editForm, client_id: clientId })}
                          onAddNew={handleNavigateToClients}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-primary">Contract Title</label>
                      <input
                        value={editForm.contract_title || ""}
                        onChange={(e) => setEditForm({ ...editForm, contract_title: e.target.value })}
                        className="w-full rounded-lg bg-card px-3 py-2 text-sm input-themed"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-primary">Start Date</label>
                        <JalaaliDatePicker
                          value={editForm.start_date || ""}
                          onChange={(date) => setEditForm({ ...editForm, start_date: date })}
                          placeholder="Select start date"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-primary">End Date</label>
                        <JalaaliDatePicker
                          value={editForm.end_date || ""}
                          onChange={(date) => setEditForm({ ...editForm, end_date: date })}
                          minDate={editForm.start_date}
                          placeholder="Select end date"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-primary">Total Value</label>
                        <input
                          type="number"
                          value={editForm.total_value || 0}
                          onChange={(e) => setEditForm({ ...editForm, total_value: Number(e.target.value) })}
                          className="w-full rounded-lg bg-card px-3 py-2 text-sm input-themed"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-primary">Invoiced</label>
                        <input
                          type="number"
                          value={editForm.invoiced || 0}
                          onChange={(e) => setEditForm({ ...editForm, invoiced: Number(e.target.value) })}
                          className="w-full rounded-lg bg-card px-3 py-2 text-sm input-themed"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-primary">Description</label>
                      <textarea
                        value={editForm.description || ""}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows={3}
                        className="w-full rounded-lg bg-card px-3 py-2 text-sm input-themed"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`rounded-lg border p-3 ${isDark ? "border-amber-700 bg-amber-900/30" : "border-amber-200 bg-amber-50/50"}`}>
                      <p className={`text-xs ${isDark ? "text-amber-300" : "text-amber-800"}`}>
                        Work Order - Source: {editForm.source_type === "LETTER" ? `Letter #${editForm.source_ref}` : `Email from ${editForm.source_email_from}`}
                      </p>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-primary">Work Order Title</label>
                      <input
                        value={editForm.contract_title || ""}
                        onChange={(e) => setEditForm({ ...editForm, contract_title: e.target.value })}
                        className="w-full rounded-lg bg-card px-3 py-2 text-sm input-themed"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-primary">Total Value</label>
                        <input
                          type="number"
                          value={editForm.total_value || 0}
                          onChange={(e) => setEditForm({ ...editForm, total_value: Number(e.target.value) })}
                          className="w-full rounded-lg bg-card px-3 py-2 text-sm input-themed"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-primary">Description</label>
                      <textarea
                        value={editForm.description || ""}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows={3}
                        className="w-full rounded-lg bg-card px-3 py-2 text-sm input-themed"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className={`flex justify-end gap-3 pt-4 border-t ${isDark ? "border-slate-700" : "border-slate-100"}`}>
              <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit}>💾 Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL نمایش قراردادهای قبلی مشتری */}
      <Modal
        isOpen={isClientContractsOpen}
        onClose={() => {
          setIsClientContractsOpen(false);
          setClientContractsList([]);
          setSelectedClientForView(null);
          setViewFilterType("ALL");
          setViewFilterStatus("ALL");
        }}
        title={`Previous Contracts — ${selectedClientForView?.name_en || ""}`}
        size="lg"
      >
        {selectedClientForView && (
          <div className="space-y-4">
            <div className={`rounded-lg border p-4 ${isDark ? "border-indigo-700 bg-indigo-950/50" : "border-indigo-200 bg-indigo-50/50"}`}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-bold">
                  {selectedClientForView.name_en.split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-primary">{selectedClientForView.name_en}</h3>
                  <p className="text-xs text-secondary" dir="rtl">{selectedClientForView.name_fa}</p>
                  <p className="text-xs font-medium mt-0.5 text-accent-indigo">
                    {clientContractsList.length} {clientContractsList.length === 1 ? "contract" : "contracts"} in {CURRENT_DEPARTMENT}
                  </p>
                </div>
                {viewFilterType === "WORK_ORDER" && (
                  <Badge tone="amber">Work Orders Only</Badge>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-1 filter-group p-0.5 text-xs">
                <button
                  onClick={() => setViewFilterStatus("ALL")}
                  className={`flex-1 rounded-md px-2 py-1.5 font-medium transition-colors ${
                    viewFilterStatus === "ALL"
                      ? (isDark ? "bg-indigo-900/40 text-indigo-300" : "bg-indigo-50 text-indigo-700")
                      : (isDark ? "text-secondary hover:text-primary" : "text-secondary hover:text-slate-700")
                  }`}
                >
                  All ({clientContractCounts.ALL || 0})
                </button>
                {availableStatuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => setViewFilterStatus(status)}
                    className={`flex-1 rounded-md px-2 py-1.5 font-medium transition-colors ${
                      viewFilterStatus === status
                        ? (isDark ? "bg-indigo-900/40 text-indigo-300" : "bg-indigo-50 text-indigo-700")
                        : (isDark ? "text-secondary hover:text-primary" : "text-secondary hover:text-slate-700")
                    }`}
                  >
                    {status === "ACTIVE" ? "🟢" : "⚫"} {status} ({clientContractCounts[status] || 0})
                  </button>
                ))}
              </div>
            </div>

            {filteredClientContracts.length === 0 ? (
              <div className="text-center py-8 text-muted">
                <div className="text-4xl mb-2">📄</div>
                <p className="text-sm">No contracts found with current filters</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredClientContracts.map((contract) => {
                  const progress = calculateProgressFromTariffs(contract);
                  return (
                    <div
                      key={contract.id}
                      className={`rounded-lg border p-3 transition-colors ${
                        isDark ? "border-slate-700 hover:border-indigo-500" : "border-slate-200 hover:border-indigo-300"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge tone={contract.type === "CONTRACT" ? "indigo" : "amber"}>
                              {contract.type === "CONTRACT" ? "Contract" : "Work Order"}
                            </Badge>
                            <span className="font-mono text-xs text-secondary">{contract.contract_no}</span>
                            {contract.external_contract_no && (
                              <span className="text-xs text-muted font-mono">({contract.external_contract_no})</span>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-primary">{contract.contract_title}</h4>
                        </div>
                        <Badge tone={contract.status === "ACTIVE" ? "emerald" : "slate"}>
                          {contract.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-secondary" dir="rtl">{contract.start_date} → {contract.end_date}</span>
                        <span className="font-semibold text-primary">{formatCurrency(contract.total_value, contract.currency)}</span>
                      </div>
                      <div className={`mt-2 h-1.5 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-slate-100"}`}>
                        {(() => {
                          const progress = calculateProgressFromTariffs(contract);
                          return (
                            <div
                              className={`h-full rounded-full ${getProgressColor(progress)}`}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          );
                        })()}
                      </div>
                      <div className="text-[10px] text-secondary mt-1">
                        {progress.toFixed(0)}% performed
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className={`flex justify-end pt-4 border-t ${isDark ? "border-slate-700" : "border-slate-100"}`}>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsClientContractsOpen(false);
                  setClientContractsList([]);
                  setSelectedClientForView(null);
                  setViewFilterType("ALL");
                  setViewFilterStatus("ALL");
                }}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL تایید تکمیل قرارداد */}
      <Modal
        isOpen={confirmCompleteOpen}
        onClose={() => {
          setConfirmCompleteOpen(false);
          setContractToComplete(null);
          setCompleteReason("");
        }}
        title="Mark Contract as Completed"
        size="md"
      >
        {contractToComplete && (
          <div className="space-y-4">
            <div className={`rounded-lg border p-4 ${isDark ? "border-amber-700 bg-amber-900/30" : "border-amber-200 bg-amber-50"}`}>
              <div className="flex items-start gap-3">
                <div className="text-2xl">⚠️</div>
                <div className="flex-1">
                  <h3 className={`text-sm font-semibold mb-1 ${isDark ? "text-amber-200" : "text-amber-900"}`}>
                    Financial Review Required
                  </h3>
                  <p className={`text-xs ${isDark ? "text-amber-300" : "text-amber-800"}`}>
                    This contract has expired but invoiced amount is less than total value.
                    Please review and confirm completion.
                  </p>
                </div>
              </div>
            </div>

            <div className={`rounded-lg border border-theme bg-muted p-4`}>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-[10px] uppercase text-secondary font-semibold mb-1">Contract No</div>
                  <div className="font-mono text-xs text-primary">{contractToComplete.contract_no}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-secondary font-semibold mb-1">Client</div>
                  <div className="text-xs text-primary">{contractToComplete.client_name}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-secondary font-semibold mb-1">Total Value</div>
                  <div className="text-xs font-semibold text-accent-emerald">
                    {formatCurrency(contractToComplete.total_value, contractToComplete.currency)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-secondary font-semibold mb-1">Invoiced</div>
                  <div className="text-xs font-semibold text-accent-indigo">
                    {formatCurrency(contractToComplete.invoiced, contractToComplete.currency)}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-[10px] uppercase text-secondary font-semibold mb-1">Invoiced Percentage</div>
                  <div className="flex items-center gap-2">
                    <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-slate-200"}`}>
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${Math.min(getInvoicedPercentage(contractToComplete), 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-amber-600">
                      {getInvoicedPercentage(contractToComplete).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-primary">
                Reason for Completion (Optional)
              </label>
              <textarea
                value={completeReason}
                onChange={(e) => setCompleteReason(e.target.value)}
                rows={3}
                className="w-full rounded-lg px-3 py-2 text-sm input-themed"
                placeholder="e.g., Final settlement reached, remaining amount waived..."
              />
            </div>

            <div className={`flex justify-end gap-3 pt-4 border-t ${isDark ? "border-slate-700" : "border-slate-100"}`}>
              <Button
                variant="ghost"
                onClick={() => {
                  setConfirmCompleteOpen(false);
                  setContractToComplete(null);
                  setCompleteReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmComplete}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <span>✓</span>
                <span>Confirm Completion</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}