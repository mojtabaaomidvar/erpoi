import { useState, useMemo, useEffect } from "react";
import { Card, Badge, Button, Avatar, Modal } from "../components/ui";
import { clients as initialClients, contracts as initialContracts, contractTariffs } from "../data/mockData";
import { formatCurrency, formatDate } from "../lib/formatters";
import { exportToExcel } from "../lib/exportToExcel";
import { validateNationalCode, validateNationalId, validateMobile } from "../lib/validators";
import jalaali from "jalaali-js";

// ============ PROGRESS CALCULATION ============
const calculateProgressFromTariffs = (contract: any): number => {
  const tariffs = contractTariffs.filter((t) => t.contract_id === contract.id);
  if (tariffs.length === 0) return 0;
  if (contract.total_value <= 0) return 0;
  const totalPerformed = tariffs.reduce((sum, t) => {
    return sum + (t.rate * t.consumed_quantity);
  }, 0);
  return (totalPerformed / contract.total_value) * 100;
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

const getProgressTextClass = (progress: number): string => {
  if (progress >= 100) return "text-emerald-600";
  if (progress >= 80) return "text-amber-600";
  if (progress >= 50) return "text-yellow-600";
  if (progress >= 25) return "text-orange-600";
  return "text-rose-600";
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

const calculateBudgetSpent = (totalValue: number, invoiced: number): number => {
  if (totalValue <= 0) return 0;
  return (invoiced / totalValue) * 100;
};

const calculateInvoiceProgress = (contract: any): number => {
  if (contract.total_value <= 0) return 0;
  if (!contract.tariffLines || contract.tariffLines.length === 0) return 0;
  const totalInvoiced = contract.tariffLines.reduce((sum: number, t: any) => sum + (t.invoiced || 0), 0);
  return (totalInvoiced / contract.total_value) * 100;
};

// ============ UNINVOICED WORK CALCULATION ============
// محاسبه Total Value of Performed Works از contractTariffs
const calculatePerformedWorkValue = (contract: Contract): number => {
  const tariffs = contractTariffs.filter((t) => t.contract_id === contract.id);
  if (tariffs.length === 0) return 0;
  return tariffs.reduce((sum, t) => {
    const rate = typeof t.rate === 'string' ? parseNumberInput(t.rate) : (t.rate || 0);
    const consumed = t.consumed_quantity || 0;
    return sum + (rate * consumed);
  }, 0);
};

// محاسبه Total Invoiced از contractTariffs
const calculateTotalInvoicedFromTariffs = (contract: Contract): number => {
  const tariffs = contractTariffs.filter((t) => t.contract_id === contract.id);
  return tariffs.reduce((sum, t) => sum + (t.invoiced || 0), 0);
};

// محاسبه Not Invoiced Works = Performed Works - Invoiced
const calculateUninvoicedWork = (contract: Contract): number => {
  const performedWork = calculatePerformedWorkValue(contract);
  const totalInvoiced = calculateTotalInvoicedFromTariffs(contract);
  return Math.max(0, performedWork - totalInvoiced);
};
  
// ============ TYPES ============
interface ContactPerson {
  id: string;
  name: string;
  position: string;
  mobile: string;
  email: string;
  department: string;
}

interface Client {
  id: string;
  type: "LEGAL" | "INDIVIDUAL";
  name_en: string;
  name_fa: string;
  national_id?: string;
  email?: string;
  emails?: string[];
  phone?: string;
  category: string;
  contacts: number;
  contracts: number;
  logoColor: string;
  abbreviated_name?: string;
  company_type?: string;
  registration_no?: string;
  economic_code?: string;
  address_en?: string;
  address_fa?: string;
  departments?: string[];
  contactPersons?: ContactPerson[];
}

interface Contract {
  id: string;
  contract_no: string;
  client_id: string;
  client_name: string;
  contract_title: string;
  start_date: string;
  end_date: string;
  total_value: number;
  invoiced: number;
  currency: string;
  status: string;
  type: "CONTRACT" | "WORK_ORDER";
  tariffs: number;
}

// ============ COMPONENT ============
export function Clients() {
  // ============ STATES ============
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [contracts] = useState<Contract[]>(initialContracts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [filter, setFilter] = useState<"ALL" | "LEGAL" | "INDIVIDUAL">("ALL");
  const [contractTab, setContractTab] = useState<"ALL" | "CONTRACT" | "WORK_ORDER">("ALL");
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "contracts" | "value">("contracts");
  
  // 🔑 States برای Dropdown ها و Toast
  const [showEmailDropdown, setShowEmailDropdown] = useState(false);
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name_en: "", name_fa: "", abbreviated_name: "", company_type: "", national_id: "",
    economic_code: "", registration_no: "", address_en: "", address_fa: "", primary_phone: "",
    email_inbox: "", category: "OIL_GAS" as const,
    contactPersons: [{ id: "1", name: "", position: "", mobile: "", email: "" }],
  });
  const [addErrors, setAddErrors] = useState<any>({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [duplicateWarning, setDuplicateWarning] = useState<{ field: string; client: any; message: string } | null>(null);
  const [isViewDuplicateOpen, setIsViewDuplicateOpen] = useState(false);
  const [viewDuplicateClient, setViewDuplicateClient] = useState<any>(null);
  const [newContactForDuplicate, setNewContactForDuplicate] = useState({ name: "", position: "", mobile: "", email: "" });
  


  // 🔑 Department یوزر لاگین‌شده (در آینده از auth context می‌آید)
  const currentDepartment = "Unit A";

  // ============ HANDLERS ============
  const handleCopyEmail = async (email: string) => {
  let success = false;
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(email);
      success = true;
    } catch (err) {
      console.log("Clipboard API failed, trying fallback");
    }
  }
  if (!success) {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = email;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      textArea.style.opacity = "0";
      textArea.setAttribute("readonly", "");
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, email.length);
      
      success = document.execCommand('copy');
      document.body.removeChild(textArea);
    } catch (err) {
      console.error("Fallback copy failed:", err);
    }
  }
  if (success) {
    setToastMessage("✅ Email address copied!");
  } else {
    setToastMessage("❌ Failed to copy email");
  }
  setTimeout(() => setToastMessage(""), 2500);
};

const handleEditClick = () => {
    if (!selectedClient) return;
    setEditForm({
      ...selectedClient,
      contactPersons: (selectedClient.contactPersons || []).filter((cp: any) => cp.department === "Unit A").map((cp: any) => ({ ...cp })),
    });
    setIsEditModalOpen(true);
  };
  
  // ============ EFFECTS ============
  useEffect(() => {
    setContractTab("ALL");
  }, [selectedClient]);
  
  // 🔑 بستن dropdown ها با کلیک خارج از آن‌ها
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    // اگر کلیک داخل هیچکدام از dropdown ها نبوده، آن‌ها را ببند
    if (!target.closest('.email-dropdown-container') && 
        !target.closest('.contact-dropdown-container') &&
        !target.closest('button[onclick*="setShowEmailDropdown"]') &&
        !target.closest('button[onclick*="setShowContactDropdown"]')) {
      setShowEmailDropdown(false);
      setShowContactDropdown(false);
    }
  };
  
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      let found: any = null;
      let field = "";
      const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, "").trim();
      if (addForm.name_en.trim().length >= 3) {
        found = clients.find((c) => normalize(c.name_en) === normalize(addForm.name_en));
        if (found) field = "name_en";
      }
      if (!found && addForm.national_id && addForm.national_id.length >= 10) {
        found = clients.find((c) => c.national_id && c.national_id === addForm.national_id);
        if (found) field = "national_id";
      }
      if (!found && addForm.company_type && addForm.registration_no.trim()) {
        found = clients.find((c) => (c as any).registration_no === addForm.registration_no);
        if (found) field = "registration_no";
      }
      if (found) {
        const dept = (found as any).departments?.[0] || "Unknown";
        const totalContacts = (found as any).contactPersons?.length || 0;
        setDuplicateWarning({ field, client: found, message: `⚠️ This client already exists in ${dept}. Total contacts: ${totalContacts}` });
      } else {
        setDuplicateWarning(null);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [addForm.national_id, addForm.name_en, addForm.registration_no, clients, addForm.company_type]);

  // ============ COMPUTED VALUES ============
  const clientCounts = useMemo(() => ({
    total: clients.length,
    legal: clients.filter((c) => c.type === "LEGAL").length,
    individual: clients.filter((c) => c.type === "INDIVIDUAL").length,
  }), [clients]);

  const filteredClients = useMemo(() => {
    let result = clients.filter((client) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = !query || client.name_en.toLowerCase().includes(query) || client.name_fa.includes(query) || (client.national_id && client.national_id.includes(query));
      const matchesFilter = filter === "ALL" || client.type === filter;
      return matchesSearch && matchesFilter;
    });
    return result.sort((a, b) => {
      if (sortBy === "contracts") {
        const countA = contracts.filter(c => c.client_id === a.id).length;
        const countB = contracts.filter(c => c.client_id === b.id).length;
        if (countB !== countA) return countB - countA;
        return a.name_en.localeCompare(b.name_en);
      }
      if (sortBy === "name") return a.name_en.localeCompare(b.name_en);
      if (sortBy === "value") {
        const valA = contracts.filter((c) => c.client_id === a.id).reduce((sum, c) => sum + c.total_value, 0);
        const valB = contracts.filter((c) => c.client_id === b.id).reduce((sum, c) => sum + c.total_value, 0);
        if (valB !== valA) return valB - valA;
        return a.name_en.localeCompare(b.name_en);
      }
      return 0;
    });
  }, [searchQuery, filter, clients, sortBy, contracts]);

  useEffect(() => {
    if (selectedClient && !filteredClients.find((c) => c.id === selectedClient.id)) {
      setSelectedClient(filteredClients[0] || null);
    }
  }, [filter, filteredClients, selectedClient]);

  const clientContracts = selectedClient ? contracts.filter((c) => c.client_id === selectedClient.id) : [];
  const filteredContracts = contractTab === "ALL" ? clientContracts : clientContracts.filter((c) => c.type === contractTab);
  // 🔑 محاسبه کار انجام شده ولی صورتحساب نشده (فقط برای قراردادهای مشتری فعلی)
  const totalUninvoicedWork = useMemo(() => {
  return filteredContracts.reduce((sum, contract) => {
    return sum + calculateUninvoicedWork(contract);
  }, 0);
}, [filteredContracts]);
  const totalValue = filteredContracts.reduce((sum, c) => sum + c.total_value, 0);
  // 🔑 محاسبه Invoiced از contractTariffs (داده‌های واقعی)
const totalInvoiced = useMemo(() => {
  const contractIds = filteredContracts.map(c => c.id);
  return contractTariffs
    .filter(t => contractIds.includes(t.contract_id))
    .reduce((sum, t) => sum + (t.invoiced || 0), 0);
}, [filteredContracts]);
  const dynamicContractCount = filteredContracts.length;
  const totalTariffLines = filteredContracts.reduce((sum, c) => sum + c.tariffs, 0);
  const summaryTitle = contractTab === "ALL" ? "Total Agreements" : contractTab === "CONTRACT" ? "Total Contracts" : "Total Work Orders";

  //  فیلتر کردن کانتکت پرسن‌ها بر اساس department یوزر
  const filteredContactPersons = useMemo(() => {
    if (!selectedClient || !selectedClient.contactPersons) return [];
    return selectedClient.contactPersons.filter((cp) => cp.department === currentDepartment);
  }, [selectedClient]);

  // ============ HANDLERS ============
  const handleExportToExcel = () => {
    const dataToExport = filteredClients.map((client) => ({
      "نام انگلیسی": client.name_en,
      "نام فارسی": client.name_fa,
      "نوع": client.type === "LEGAL" ? "حقوقی" : "حقیقی",
      "شناسه/کد ملی": client.national_id || "-",
      "شماره ثبت": (client as any).registration_no || "-",
      "کد اقتصادی": (client as any).economic_code || "-",
      "تلفن": client.phone || "-",
      "ایمیل": client.email || "-",
      "تعداد قراردادها": client.contracts,
    }));
    const filterName = filter === "ALL" ? "All" : filter === "LEGAL" ? "Legal" : "Individual";
    const today = new Date().toISOString().split("T")[0];
    exportToExcel(dataToExport, `${filterName}_Clients_${today}`, "Clients");
  };

  const handleAddClick = () => {
    setAddForm({
      name_en: "", name_fa: "", abbreviated_name: "", company_type: "Private Joint Stock",
      national_id: "", economic_code: "", registration_no: "", address_en: "", address_fa: "",
      primary_phone: "", email_inbox: "", category: "OIL_GAS",
      contactPersons: [{ id: "1", name: "", position: "", mobile: "", email: "" }],
    });
    setAddErrors({});
    setDuplicateWarning(null);
    setIsAddModalOpen(true);
  };

  const validateAddForm = () => {
    const errors: any = {};
    if (!addForm.name_en.trim()) errors.name_en = "English name is required";
    if (!addForm.name_fa.trim()) errors.name_fa = "نام فارسی الزامی است";
    if (!addForm.national_id) errors.national_id = "National ID/Code is required";
    else if (addForm.company_type && !validateNationalId(addForm.national_id)) errors.national_id = "Must be exactly 11 digits";
    else if (!addForm.company_type && !validateNationalCode(addForm.national_id)) errors.national_id = "Invalid national code";
    if (addForm.company_type && !addForm.registration_no) errors.registration_no = "Registration number is required";
    if (!addForm.primary_phone) errors.primary_phone = "Primary phone is required";
    else if (!validateMobile(addForm.primary_phone)) errors.primary_phone = "Invalid mobile format";
    if (!addForm.address_en.trim()) errors.address_en = "English address is required";
    if (!addForm.address_fa.trim()) errors.address_fa = "آدرس فارسی الزامی است";
    const validContacts = addForm.contactPersons.filter((cp) => cp.name.trim() && validateMobile(cp.mobile));
    if (addForm.company_type && validContacts.length === 0) errors.contactPersons = "At least one valid contact person required";
    setAddErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveAdd = () => {
    if (!validateAddForm()) return;
    if (duplicateWarning) { alert("Please resolve the duplicate client warning first."); return; }
    const newClient: any = {
      id: `c${Date.now()}`, type: addForm.company_type ? "LEGAL" : "INDIVIDUAL",
      name_en: addForm.name_en, name_fa: addForm.name_fa, national_id: addForm.national_id,
      category: addForm.category, contacts: addForm.company_type ? addForm.contactPersons.filter((cp) => cp.name.trim()).length : 0,
      contracts: 0, logoColor: "from-indigo-500 to-violet-600", email: addForm.email_inbox, phone: addForm.primary_phone,
      address_en: addForm.address_en, address_fa: addForm.address_fa, departments: [(currentDepartment)],
      contactPersons: addForm.company_type ? addForm.contactPersons.filter((cp) => cp.name.trim()).map((cp) => ({ ...cp, department: (currentDepartment) })) : [],
    };
    if (addForm.company_type) {
      newClient.company_type = addForm.company_type; newClient.registration_no = addForm.registration_no;
      newClient.economic_code = addForm.economic_code; newClient.abbreviated_name = addForm.abbreviated_name;
    }
    setClients([newClient, ...clients]); setSelectedClient(newClient); setIsAddModalOpen(false);
  };

  const handleSaveEdit = () => {
  if (!selectedClient) return;
  const updatedClients = clients.map((c) => {
    if (c.id === selectedClient.id) {
      const updated = { ...c, address_en: editForm.address_en, address_fa: editForm.address_fa, email: editForm.email_inbox || editForm.email, phone: editForm.primary_phone || editForm.phone };
      if (c.type === "LEGAL") {
        const otherDepts = (c.contactPersons || []).filter((cp: any) => cp.department !== currentDepartment);
        updated.contactPersons = [...otherDepts, ...editForm.contactPersons.map((cp: any) => ({ ...cp, department: currentDepartment }))];
        updated.contacts = updated.contactPersons.length;
      }
      return updated;
    }
    return c;
  });
  setClients(updatedClients);
  setSelectedClient(updatedClients.find((c) => c.id === selectedClient.id) || null);
  setIsEditModalOpen(false);
};
  
  const handleViewDuplicate = () => { if (duplicateWarning) { setViewDuplicateClient(duplicateWarning.client); setIsViewDuplicateOpen(true); setIsAddModalOpen(false); } };

  const handleAddContactToDuplicate = () => {
    if (!duplicateWarning || !newContactForDuplicate.name.trim() || !validateMobile(newContactForDuplicate.mobile)) return alert("Valid name and mobile required");
    const updatedClients = clients.map((c) => {
      if (c.id === duplicateWarning.client.id) {
        const updated = { ...c };
        if (!updated.departments) updated.departments = [];
        if (!updated.departments.includes(currentDepartment)) updated.departments.push(currentDepartment);
        if (!updated.contactPersons) updated.contactPersons = [];
        updated.contactPersons.push({ ...newContactForDuplicate, id: Date.now().toString(), department: currentDepartment });
        updated.contacts = updated.contactPersons.length;
        return updated;
      }
      return c;
    });
    setClients(updatedClients); setSelectedClient(updatedClients.find((c) => c.id === duplicateWarning.client.id) || null);
    setIsAddModalOpen(false); setNewContactForDuplicate({ name: "", position: "", mobile: "", email: "" }); setDuplicateWarning(null);
  };

  const addContactPerson = () => setAddForm({ ...addForm, contactPersons: [...addForm.contactPersons, { id: Date.now().toString(), name: "", position: "", mobile: "", email: "" }] });
  const removeContactPerson = (id: string) => setAddForm({ ...addForm, contactPersons: addForm.contactPersons.filter((cp) => cp.id !== id) });
  const updateContactPerson = (id: string, field: string, value: string) => setAddForm({ ...addForm, contactPersons: addForm.contactPersons.map((cp) => (cp.id === id ? { ...cp, [field]: value } : cp)) });
  const addEditContactPerson = () => setEditForm({ ...editForm, contactPersons: [...editForm.contactPersons, { id: Date.now().toString(), name: "", position: "", mobile: "", email: "", department: currentDepartment }] });
  const removeEditContactPerson = (id: string) => setEditForm({ ...editForm, contactPersons: editForm.contactPersons.filter((cp: any) => cp.id !== id) });
  const updateEditContactPerson = (id: string, field: string, value: string) => setEditForm({ ...editForm, contactPersons: editForm.contactPersons.map((cp: any) => (cp.id === id ? { ...cp, [field]: value } : cp)) });

  // ============ RENDER ============
  return (
    <div className="grid grid-cols-12 gap-4 h-[calc(100vh-140px)] p-6">
      {/* LEFT PANEL */}
      <div className="col-span-4 relative flex flex-col bg-white rounded-xl border border-slate-200/70 shadow-sm overflow-hidden transition-all duration-300 ease-in-out">
        <div className="relative z-10 border-b border-slate-100 px-4 py-4 bg-slate-50/50 space-y-3">
          <div className="flex items-center gap-8">
            <h3 className="text-sm font-semibold text-slate-900 shrink-0">Clients</h3>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name, Code..." className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
              {searchQuery && (<button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">✕</button>)}
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={handleExportToExcel} className="shrink-0 gap-1.5 text-xs">📥 Export</Button>
            <div className="relative">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "name" | "contracts" | "value")} className="appearance-none text-xs rounded-md border border-slate-200 bg-white pl-2 pr-6 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer hover:bg-slate-50">
                <option value="contracts">Most Contracts</option>
                <option value="value">Highest Value</option>
                <option value="name">Name (A-Z)</option>
              </select>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]">▼</span>
            </div>
          </div>
          <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
            {(["ALL", "LEGAL", "INDIVIDUAL"] as const).map((t) => {
              const count = t === "ALL" ? clientCounts.total : t === "LEGAL" ? clientCounts.legal : clientCounts.individual;
              return (
                <button key={t} onClick={() => setFilter(t)} className={`flex-1 rounded-md px-2 py-1.5 font-medium transition-colors ${filter === t ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:text-slate-700"}`}>
                  {t === "ALL" ? `All (${count})` : t === "LEGAL" ? `🏢 Legal (${count})` : `👤 Individual (${count})`}
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto pb-24">
          {filteredClients.length === 0 ? (
            <div className="p-8 text-center"><div className="text-4xl mb-2">🔍</div><p className="text-sm text-slate-500">No clients found</p></div>
          ) : (
            filteredClients.map((client) => (
              <div key={client.id} onClick={() => setSelectedClient(client)} className={`flex items-center gap-3 px-4 py-3 border-b border-slate-100 cursor-pointer transition-colors ${selectedClient?.id === client.id ? "bg-indigo-50 border-l-4 border-l-indigo-500" : "hover:bg-slate-50"}`}>
                <Avatar name={client.name_en} gradient={client.logoColor} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{client.name_en}</div>
                  <div className="text-xs text-slate-500 truncate" dir="rtl">{client.name_fa}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge tone={client.type === "LEGAL" ? "indigo" : "violet"}>{client.type === "LEGAL" ? "Legal" : "Individual"}</Badge>
                    {(() => {
                      const realCount = contracts.filter(c => c.client_id === client.id).length;
                      return (<span className="text-[10px] text-slate-400 font-mono">{realCount} {realCount === 1 ? "Agreement" : "Agreements"}</span>);
                    })()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none z-10" />
        <div className="absolute bottom-6 left-0 right-0 px-6 z-20">
          <Button variant="primary" size="md" onClick={handleAddClick} className="w-full justify-center gap-2 shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all duration-300">
            <span>➕</span> Add New Client
          </Button>
        </div>
      </div>

      {/* RIGHT PANEL - همیشه باز */}
		{/* RIGHT PANEL - همیشه نمایش داده می‌شود */}
		<div className="col-span-8 flex flex-col bg-white rounded-xl border border-slate-200/70 shadow-sm overflow-hidden transition-all duration-300 ease-in-out">
		  {selectedClient ? (
			<>
			  {/* Header وقتی مشتری انتخاب شده */}
			  <div className="border-b border-slate-100 px-6 py-4 bg-gradient-to-r from-slate-50 to-white">
				<div className="flex items-center justify-between mb-4">
				  <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Client Details</h2>
				  <Button variant="ghost" size="sm" onClick={() => setSelectedClient(null)} className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">✕ Close Panel</Button>
				</div>
				<div className="flex items-center justify-between">
				  <div className="flex items-center gap-4">
					<Avatar name={selectedClient.name_en} gradient={selectedClient.logoColor} size="lg" />
					<div>
					  <h3 className="text-xl font-bold text-slate-900">{selectedClient.name_en}</h3>
					  <p className="text-sm text-slate-500" dir="rtl">{selectedClient.name_fa}</p>
					</div>
				  </div>
				  <Button variant="outline" size="md" onClick={handleEditClick} className="gap-2 shadow-sm">
					<span>✏️</span> Edit Client
				  </Button>
				</div>
			  </div>

			  {/* محتوای فعلی پنل */}
			  <div className="flex-1 overflow-y-auto p-6">
				<div className="space-y-6">
				  {/* Company Information */}
				  {selectedClient.type === "LEGAL" && (
					<div className="rounded-lg border border-slate-200 p-4 bg-slate-50/30">
					  <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">🏢 Company Information</h3>
					  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
						<div><div className="text-[10px] uppercase text-slate-500 font-semibold mb-1">National ID</div><div className="font-mono text-xs text-slate-900">{selectedClient.national_id || "—"}</div></div>
						<div><div className="text-[10px] uppercase text-slate-500 font-semibold mb-1">Registration No</div><div className="font-mono text-xs text-slate-900">{(selectedClient as any).registration_no || "—"}</div></div>
						<div><div className="text-[10px] uppercase text-slate-500 font-semibold mb-1">Economic Code</div><div className="font-mono text-xs text-slate-900">{(selectedClient as any).economic_code || "—"}</div></div>
						<div><div className="text-[10px] uppercase text-slate-500 font-semibold mb-1">Abbreviated Name</div><div className="text-xs text-slate-900">{(selectedClient as any).abbreviated_name || "—"}</div></div>
						
						{/* 🔑 Emails Dropdown - فقط ایمیل‌های مربوط به department یوزر */}
						<div className="relative">
						  <div className="text-[10px] uppercase text-slate-500 font-semibold mb-1">Emails</div>
						  {(() => {
							// 🔑 فقط ایمیل‌های کانتکت پرسن‌های department یوزر + ایمیل اصلی
							const contactEmails = filteredContactPersons.map(cp => cp.email).filter(email => email);
							const allEmails = [
							  ...(selectedClient.email ? [selectedClient.email] : []),
							  ...(selectedClient.emails || []),
							  ...contactEmails
							].filter((email, index, self) => self.indexOf(email) === index);
							
							if (allEmails.length > 0) {
							  return (
								<button
								  onClick={() => setShowEmailDropdown(!showEmailDropdown)}
								  className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
								>
								  <span>📧 {allEmails.length} email{allEmails.length > 1 ? 's' : ''}</span>
								  <span className={`text-[10px] transition-transform ${showEmailDropdown ? 'rotate-180' : ''}`}>▼</span>
								</button>
							  );
							}
							return <div className="text-xs text-slate-400">—</div>;
						  })()}
						  
						  {showEmailDropdown && (() => {
							// 🔑 فقط کانتکت پرسن‌های department یوزر
							const contactEmails = filteredContactPersons
							  .filter(cp => cp.email)
							  .map(cp => ({ email: cp.email, name: cp.name }));
							const primaryEmail = selectedClient.email;
							const otherEmails = selectedClient.emails || [];
							
							return (
							  <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-2 max-h-80 overflow-y-auto">
								{/* Primary Email */}
								{primaryEmail && (
								  <>
									<div className="px-3 py-1.5 text-[10px] uppercase text-slate-500 font-semibold border-b border-slate-100">⭐ Primary Email</div>
									<button
									  onClick={(e) => { e.stopPropagation(); handleCopyEmail(primaryEmail); setShowEmailDropdown(false); }}
									  className="w-full text-left px-3 py-2 text-xs font-mono text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2 border-b border-slate-100"
									>  
									  <span className="truncate">{primaryEmail}</span>
									  <span className="text-slate-400 ml-auto">📋</span>
									</button>
								  </>
								)}
								
								{/* Other Emails */}
								{otherEmails.length > 0 && (
								  <>
									<div className="px-3 py-1.5 text-[10px] uppercase text-slate-500 font-semibold border-b border-slate-100">Other Emails</div>
									{otherEmails.map((email, index) => (
									  <button
										key={index}
										onClick={(e) => { e.stopPropagation(); handleCopyEmail(email); setShowEmailDropdown(false); }}
										className="w-full text-left px-3 py-2 text-xs font-mono text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2 border-b border-slate-50"
									  >
										<span className="text-slate-400">📋</span>
										<span className="truncate">{email}</span>
									  </button>
									))}
								  </>
								)}
								
								{/* 🔑 Contact Persons Emails - فقط department یوزر */}
								{contactEmails.length > 0 && (
								  <>
									<div className="px-3 py-1.5 text-[10px] uppercase text-slate-500 font-semibold border-b border-slate-100">👥 Contact Persons</div>
									{contactEmails.map((contact, index) => (
									  <button
										key={index}
										onClick={(e) => { e.stopPropagation(); handleCopyEmail(contact.email); setShowEmailDropdown(false); }}
										className="w-full text-left px-3 py-2 hover:bg-indigo-50 transition-colors border-b border-slate-50 last:border-0"
									  >
										<div className="flex items-center justify-between mb-0.5">
										  <span className="text-xs font-semibold text-slate-900 truncate">{contact.name}</span>
										  <span className="text-slate-400">📋</span>
										</div>
										<div className="text-[10px] font-mono text-indigo-600 truncate">{contact.email}</div>
									  </button>
									))}
								  </>
								)}
							  </div>
							);
						  })()}
						</div>
						
						{/* 🔑 Contact Persons Dropdown - فقط department یوزر */}
						<div className="relative">
						  <div className="text-[10px] uppercase text-slate-500 font-semibold mb-1">Contact Persons</div>
						  {filteredContactPersons.length > 0 ? (
							<button
							  onClick={() => setShowContactDropdown(!showContactDropdown)}
							  className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
							>
							  <span>👥 {filteredContactPersons.length} contact{filteredContactPersons.length > 1 ? 's' : ''}</span>
							  <span className={`text-[10px] transition-transform ${showContactDropdown ? 'rotate-180' : ''}`}>▼</span>
							</button>
						  ) : (
							<div className="text-xs text-slate-400">—</div>
						  )}
						  
						  {showContactDropdown && filteredContactPersons.length > 0 && (
							<div className="absolute top-full left-0 mt-1 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-2 max-h-80 overflow-y-auto">
							  <div className="px-3 py-1.5 text-[10px] uppercase text-slate-500 font-semibold border-b border-slate-100">
								Department Contacts
							  </div>
							  {filteredContactPersons.map((cp) => (
								<div key={cp.id} className="px-3 py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
								  <div className="flex items-center justify-between mb-1">
									<span className="text-xs font-semibold text-slate-900">{cp.name}</span>
									<Badge tone="slate" className="text-[9px]">{cp.department}</Badge>
								  </div>
								  {cp.position && <div className="text-[10px] text-slate-500 mb-1">{cp.position}</div>}
								  <div className="flex items-center gap-2 text-[10px]">
									<span className="text-slate-400">📞</span>
									<span className="font-mono text-slate-700">{cp.mobile}</span>
								  </div>
								  {cp.email && (
									<button
									  onClick={(e) => { e.stopPropagation(); handleCopyEmail(cp.email); }}
									  className="flex items-center gap-2 text-[10px] mt-0.5 hover:text-indigo-600 transition-colors"
									>
									  <span className="text-slate-400">✉️</span>
									  <span className="font-mono text-indigo-600 truncate">{cp.email}</span>
									  <span className="text-slate-400 ml-auto">📋</span>
									</button>
								  )}
								</div>
							  ))}
							</div>
						  )}
						</div>
					  </div>
					</div>
				  )}

				  {/* Individual Information */}
				  {selectedClient.type === "INDIVIDUAL" && (
					<div className="rounded-lg border border-slate-200 p-4 bg-slate-50/30">
					  <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">👤 Personal Information</h3>
					  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
						<div><div className="text-[10px] uppercase text-slate-500 font-semibold mb-1">National Code</div><div className="font-mono text-xs text-slate-900">{selectedClient.national_id || "—"}</div></div>
						<div><div className="text-[10px] uppercase text-slate-500 font-semibold mb-1">Mobile</div><div className="text-xs text-slate-900">{selectedClient.phone || "—"}</div></div>
						
						<div className="relative">
						  <div className="text-[10px] uppercase text-slate-500 font-semibold mb-1">Emails</div>
						  {(() => {
							const allEmails = [
							  ...(selectedClient.email ? [selectedClient.email] : []),
							  ...(selectedClient.emails || [])
							].filter((email, index, self) => self.indexOf(email) === index);
							
							if (allEmails.length > 0) {
							  return (
								<button onClick={() => setShowEmailDropdown(!showEmailDropdown)} className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium">
								  <span>📧 {allEmails.length} email{allEmails.length > 1 ? 's' : ''}</span>
								  <span className={`text-[10px] transition-transform ${showEmailDropdown ? 'rotate-180' : ''}`}>▼</span>
								</button>
							  );
							}
							return <div className="text-xs text-slate-400">—</div>;
						  })()}
						  
						  {showEmailDropdown && (() => {
							const allEmails = [
							  ...(selectedClient.email ? [selectedClient.email] : []),
							  ...(selectedClient.emails || [])
							].filter((email, index, self) => self.indexOf(email) === index);
							
							return (
							  <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-2">
								{selectedClient.email && (
								  <>
									<div className="px-3 py-1.5 text-[10px] uppercase text-slate-500 font-semibold border-b border-slate-100">⭐ Primary Email</div>
									<button onClick={() => { handleCopyEmail(selectedClient.email!); setShowEmailDropdown(false); }} className="w-full text-left px-3 py-2 text-xs font-mono text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2 border-b border-slate-100">
									  <span className="text-emerald-500">⭐</span>
									  <span className="truncate">{selectedClient.email}</span>
									</button>
								  </>
								)}
								{selectedClient.emails && selectedClient.emails.length > 0 && (
								  <>
									<div className="px-3 py-1.5 text-[10px] uppercase text-slate-500 font-semibold border-b border-slate-100">Other Emails</div>
									{selectedClient.emails.map((email, index) => (
									  <button key={index} onClick={() => { handleCopyEmail(email); setShowEmailDropdown(false); }} className="w-full text-left px-3 py-2 text-xs font-mono text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2">
										<span className="text-slate-400">📋</span>
										<span className="truncate">{email}</span>
									  </button>
									))}
								  </>
								)}
							  </div>
							);
						  })()}
						</div>
					  </div>
					</div>
				  )}
				
				  {/* Stats Cards */}
				  <div className="grid grid-cols-4 gap-4">
					<div className="rounded-lg border border-slate-200 p-4"><div className="text-xs text-slate-500 mb-1">{summaryTitle}</div><div className="text-2xl font-bold text-slate-900">{dynamicContractCount}</div></div>
					<div className="rounded-lg border border-slate-200 p-4"><div className="text-xs text-slate-500 mb-1">Total Value of Agreements</div><div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalValue)}</div></div>
					<div className="rounded-lg border border-slate-200 p-4"><div className="text-xs text-slate-500 mb-1">Invoiced</div><div className="text-2xl font-bold text-indigo-600">{formatCurrency(totalInvoiced)}</div></div>
					<div className="rounded-lg border border-slate-200 p-4"><div className="text-xs text-slate-500 mb-1">Not Invoiced Works</div><div className="text-2xl font-bold text-slate-900">{formatCurrency(totalUninvoicedWork)}</div></div>
				  </div>

				  {/* Contracts List */}
				  <div>
					<div className="flex items-center justify-between mb-4">
					  <h3 className="text-sm font-semibold text-slate-900">Agreements</h3>
					  <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
						{(["ALL", "CONTRACT", "WORK_ORDER"] as const).map((t) => (
						  <button key={t} onClick={() => setContractTab(t)} className={`rounded-md px-3 py-1.5 font-medium transition-colors ${contractTab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>
							{t === "ALL" ? `All (${clientContracts.length})` : t === "CONTRACT" ? `📄 Contracts (${clientContracts.filter(c => c.type === "CONTRACT").length})` : `📦 Work Orders (${clientContracts.filter(c => c.type === "WORK_ORDER").length})`}
						  </button>
						))}
					  </div>
					</div>
					<div className="space-y-3">
					  {filteredContracts.map((contract) => {
						const workProgress = calculateProgressFromTariffs(contract);
						const invoiceProgress = calculateInvoiceProgress(contract);
						
						return (
						  <div key={contract.id} onClick={() => setSelectedContract(contract)} className="rounded-lg border border-slate-200 p-4 hover:border-indigo-300 transition-colors cursor-pointer">
							<div className="flex items-start justify-between mb-3">
							  <div className="flex-1">
								<div className="flex items-center gap-2 mb-1">
								  <Badge tone={contract.type === "CONTRACT" ? "indigo" : "amber"}>{contract.type === "CONTRACT" ? "Contract" : "Work Order"}</Badge>
								  <span className="font-mono text-xs text-slate-500">{contract.contract_no}</span>
								  <Badge tone="slate">{contract.tariffs} {contract.tariffs === 1 ? "Tariff" : "Tariffs"}</Badge>
								</div>
								<h4 className="text-sm font-semibold text-slate-900">{contract.contract_title}</h4>
							  </div>
							  <div className="text-right">
								<div className="text-sm font-bold text-slate-900">{formatCurrency(contract.total_value)}</div>
								<Badge tone={contract.status === "ACTIVE" ? "emerald" : contract.status === "PENDING" ? "amber" : "slate"}>{contract.status}</Badge>
							  </div>
							</div>

							<div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
							  <span>Work Performed</span>
							  <span className={`font-semibold ${getProgressTextClass(workProgress)}`}>{workProgress.toFixed(1)}%</span>
							</div>
							<div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
							  <div className={`h-full rounded-full ${getProgressBgClass(workProgress)}`} style={{ width: `${Math.min(workProgress, 100)}%` }} />
							</div>

							<div className="flex items-center justify-between text-[10px] text-slate-500 mt-3 mb-1">
							  <span>Invoiced</span>
							  <span className={`font-semibold ${getProgressTextClass(invoiceProgress)}`}>{invoiceProgress.toFixed(1)}%</span>
							</div>
							<div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
							  <div className={`h-full rounded-full ${getProgressBgClass(invoiceProgress)}`} style={{ width: `${Math.min(invoiceProgress, 100)}%` }} />
							</div>

							<div className="text-xs text-slate-400 mt-2">{contract.start_date} → {contract.end_date}</div>
						  </div>
						);
					  })}
					</div>
				  </div>
				</div>
			  </div>
			</>
		    ) : (
    /* Placeholder با لوگو - وقتی مشتری انتخاب نشده */
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 relative overflow-hidden min-h-[600px]">
      {/* Pattern پس‌زمینه */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />
      
      {/* محتوای مرکزی */}
      <div className="text-center z-10 relative">
        {/* لوگو با highlight */}
        <div className="relative inline-block mb-8">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-400 to-violet-500 blur-xl opacity-30 animate-pulse" />
			<div className="relative inline-block mb-8">
			  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 blur-2xl opacity-40 animate-pulse" />
				  <div className="relative inline-flex items-center justify-center w-44 h-44 rounded-full bg-white shadow-2xl shadow-indigo-500/30 border-4 border-white">
					<img 
					  src="public/images/logo.png" 
					  alt="ICS Logo" 
					  className="w-36 h-36 object-contain"
					/>
				  </div>
			  </div>
        </div>
        
        <h2 className="text-3xl font-bold text-slate-700 mb-3">OFFSHORE & ENERGY DEPARTMENT INSPECTION PLATFORM</h2>
        <p className="text-base text-slate-500 max-w-md mx-auto leading-relaxed">
          Select a client from the list to view details, contracts, and contact information
        </p>
        
        <div className="flex items-center justify-center gap-6 mt-8">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-2xl">👥</div>
            <span className="text-xs text-slate-500 font-medium">Clients</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-2xl">📄</div>
            <span className="text-xs text-slate-500 font-medium">Contracts</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-2xl">📧</div>
            <span className="text-xs text-slate-500 font-medium">Contacts</span>
          </div>
        </div>
      </div>
    </div>
  )}
</div>
		

      {/* ADD CLIENT MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); setDuplicateWarning(null); }} title="Entity Onboarding" size="xl">
        <div className="space-y-6">
          <div className="flex gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 w-fit">
            <button type="button" onClick={() => setAddForm({ ...addForm, company_type: "Private Joint Stock" })} className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${addForm.company_type ? "bg-indigo-600 text-white shadow-md" : "text-slate-600 hover:bg-white"}`}>🏢 LEGAL</button>
            <button type="button" onClick={() => setAddForm({ ...addForm, company_type: "" })} className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${!addForm.company_type ? "bg-indigo-600 text-white shadow-md" : "text-slate-600 hover:bg-white"}`}>👤 INDIVIDUAL</button>
          </div>

          <div className="rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">🌐 BASIC IDENTITY</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Full Name (English) *</label>
                <input value={addForm.name_en} onChange={(e) => setAddForm({ ...addForm, name_en: e.target.value })} className={`w-full rounded-lg border bg-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 ${addErrors.name_en ? "border-rose-300 focus:ring-rose-100" : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"}`} />
                {duplicateWarning?.field === "name_en" && (<div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3"><p className="text-xs font-medium text-amber-900 mb-2">{duplicateWarning.message}</p><div className="flex gap-2"><Button size="sm" variant="outline" onClick={handleViewDuplicate}>👁️ View Client</Button><Button size="sm" onClick={handleAddContactToDuplicate}>+ Add Contact</Button></div></div>)}
                {addErrors.name_en && !duplicateWarning && <p className="mt-1 text-[11px] font-medium text-rose-600">✕ {addErrors.name_en}</p>}
              </div>
              <div dir="rtl">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 text-left">Full Name (Farsi) *</label>
                <input value={addForm.name_fa} onChange={(e) => setAddForm({ ...addForm, name_fa: e.target.value })} className={`w-full rounded-lg border bg-white py-2.5 px-3 text-sm text-right focus:outline-none focus:ring-2 ${addErrors.name_fa ? "border-rose-300 focus:ring-rose-100" : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"}`} />
                {addErrors.name_fa && <p className="mt-1 text-[11px] font-medium text-rose-600 text-right">✕ {addErrors.name_fa}</p>}
              </div>

              {addForm.company_type && (<>
                <div><label className="mb-1.5 block text-xs font-semibold text-slate-700">Abbreviated Name</label><input value={addForm.abbreviated_name} onChange={(e) => setAddForm({ ...addForm, abbreviated_name: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100" /></div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Company Type *</label>
                  <select value={addForm.company_type} onChange={(e) => setAddForm({ ...addForm, company_type: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100">
                    <option value="Private Joint Stock">Private Joint Stock</option>
                    <option value="Public Joint Stock">Public Joint Stock</option>
                    <option value="Limited Liability">Limited Liability</option>
                  </select>
                </div>
              </>)}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">{addForm.company_type ? "National ID (11 digits) *" : "National Code (10 digits) *"}</label>
                <input value={addForm.national_id} onChange={(e) => setAddForm({ ...addForm, national_id: e.target.value.replace(/\D/g, "") })} maxLength={addForm.company_type ? 11 : 10} className={`w-full rounded-lg border bg-white py-2.5 px-3 text-sm font-mono focus:outline-none focus:ring-2 ${addErrors.national_id ? "border-rose-300 focus:ring-rose-100" : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"}`} />
                {duplicateWarning?.field === "national_id" && (<div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3"><p className="text-xs font-medium text-amber-900 mb-2">{duplicateWarning.message}</p><div className="flex gap-2"><Button size="sm" variant="outline" onClick={handleViewDuplicate}>👁️ View Client</Button><Button size="sm" onClick={handleAddContactToDuplicate}>+ Add Contact</Button></div></div>)}
                {addErrors.national_id && !duplicateWarning && <p className="mt-1 text-[11px] font-medium text-rose-600">✕ {addErrors.national_id}</p>}
              </div>

              {addForm.company_type && (<>
                <div><label className="mb-1.5 block text-xs font-semibold text-slate-700">Economic Code</label><input value={addForm.economic_code} onChange={(e) => setAddForm({ ...addForm, economic_code: e.target.value.replace(/\D/g, "") })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-100" /></div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Registration Number *</label>
                  <input value={addForm.registration_no} onChange={(e) => setAddForm({ ...addForm, registration_no: e.target.value })} className={`w-full rounded-lg border bg-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 ${addErrors.registration_no ? "border-rose-300 focus:ring-rose-100" : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"}`} />
                  {duplicateWarning?.field === "registration_no" && (<div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3"><p className="text-xs font-medium text-amber-900 mb-2">{duplicateWarning.message}</p><div className="flex gap-2"><Button size="sm" variant="outline" onClick={handleViewDuplicate}>👁️ View Client</Button><Button size="sm" onClick={handleAddContactToDuplicate}>+ Add Contact</Button></div></div>)}
                  {addErrors.registration_no && !duplicateWarning && <p className="mt-1 text-[11px] font-medium text-rose-600">✕ {addErrors.registration_no}</p>}
                </div>
              </>)}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">📞 CONTACT HUB</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Primary Phone *</label>
                <input value={addForm.primary_phone} onChange={(e) => setAddForm({ ...addForm, primary_phone: e.target.value.replace(/\D/g, "") })} maxLength={11} className={`w-full rounded-lg border bg-white py-2.5 px-3 text-sm font-mono focus:outline-none focus:ring-2 ${addErrors.primary_phone ? "border-rose-300 focus:ring-rose-100" : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"}`} />
                {addErrors.primary_phone && <p className="mt-1 text-[11px] font-medium text-rose-600">✕ {addErrors.primary_phone}</p>}
              </div>
              <div><label className="mb-1.5 block text-xs font-semibold text-slate-700">Email Inbox</label><input type="email" value={addForm.email_inbox} onChange={(e) => setAddForm({ ...addForm, email_inbox: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100" /></div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"> OFFICIAL ADDRESS</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Address (English) *</label>
                <textarea value={addForm.address_en} onChange={(e) => setAddForm({ ...addForm, address_en: e.target.value })} rows={3} className={`w-full rounded-lg border bg-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 ${addErrors.address_en ? "border-rose-300 focus:ring-rose-100" : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"}`} />
                {addErrors.address_en && <p className="mt-1 text-[11px] font-medium text-rose-600">✕ {addErrors.address_en}</p>}
              </div>
              <div dir="rtl">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 text-left">Address (Farsi) *</label>
                <textarea value={addForm.address_fa} onChange={(e) => setAddForm({ ...addForm, address_fa: e.target.value })} rows={3} className={`w-full rounded-lg border bg-white py-2.5 px-3 text-sm text-right focus:outline-none focus:ring-2 ${addErrors.address_fa ? "border-rose-300 focus:ring-rose-100" : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"}`} />
                {addErrors.address_fa && <p className="mt-1 text-[11px] font-medium text-rose-600 text-right">✕ {addErrors.address_fa}</p>}
              </div>
            </div>
          </div>

          {addForm.company_type && (
            <div className="rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">👥 CONTACT PERSONS <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">{addForm.contactPersons.length}</span></h2>
                <button type="button" onClick={addContactPerson} className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">+ ADD LIAISON</button>
              </div>
              {addErrors.contactPersons && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">✕ {addErrors.contactPersons}</div>}
              <div className="space-y-3">
                {addForm.contactPersons.map((cp) => (
                  <div key={cp.id} className="grid grid-cols-12 gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div className="col-span-4"><label className="mb-1 block text-[10px] font-semibold text-slate-600">Liaison Name *</label><input value={cp.name} onChange={(e) => updateContactPerson(cp.id, "name", e.target.value)} className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs focus:border-indigo-400 focus:outline-none" /></div>
                    <div className="col-span-3"><label className="mb-1 block text-[10px] font-semibold text-slate-600">Position/Rank</label><input value={cp.position} onChange={(e) => updateContactPerson(cp.id, "position", e.target.value)} className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs focus:border-indigo-400 focus:outline-none" /></div>
                    <div className="col-span-3"><label className="mb-1 block text-[10px] font-semibold text-slate-600">Mobile *</label><input value={cp.mobile} onChange={(e) => updateContactPerson(cp.id, "mobile", e.target.value.replace(/\D/g, ""))} className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs font-mono focus:border-indigo-400 focus:outline-none" /></div>
                    <div className="col-span-2 flex items-end gap-1">
                      <div className="flex-1"><label className="mb-1 block text-[10px] font-semibold text-slate-600">Direct Email</label><input value={cp.email} onChange={(e) => updateContactPerson(cp.id, "email", e.target.value)} className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs focus:border-indigo-400 focus:outline-none" /></div>
                      {addForm.contactPersons.length > 1 && <button type="button" onClick={() => removeContactPerson(cp.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">🗑️</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="ghost" onClick={() => { setIsAddModalOpen(false); setDuplicateWarning(null); }}>Cancel</Button>
            <Button onClick={handleSaveAdd}> Save Entity</Button>
          </div>
        </div>
      </Modal>

      {/* VIEW DUPLICATE MODAL */}
      <Modal isOpen={isViewDuplicateOpen} onClose={() => { setIsViewDuplicateOpen(false); setViewDuplicateClient(null); setNewContactForDuplicate({ name: "", position: "", mobile: "", email: "" }); }} title="Existing Client — Add Contact Person" size="xl">
        {viewDuplicateClient && (
          <div className="space-y-6">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">⚠️</div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-amber-900 mb-1">This client already exists in the system</h3>
                  <p className="text-xs text-amber-800">You can view the existing information and add a new contact person for <span className="font-semibold">{currentDepartment}</span>. Other departments' contact persons are hidden for privacy.</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/30">
              <div className="flex items-center gap-4 mb-4">
                <Avatar name={viewDuplicateClient.name_en} gradient={viewDuplicateClient.logoColor} size="lg" />
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{viewDuplicateClient.name_en}</h2>
                  <p className="text-sm text-slate-500" dir="rtl">{viewDuplicateClient.name_fa}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge tone={viewDuplicateClient.type === "LEGAL" ? "indigo" : "violet"}>{viewDuplicateClient.type === "LEGAL" ? "Legal Entity" : "Individual"}</Badge>
                    <Badge tone="slate">{(viewDuplicateClient as any).departments?.join(", ") || "Unknown"}</Badge>
                  </div>
                </div>
              </div>
              {viewDuplicateClient.type === "LEGAL" && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm pt-4 border-t border-slate-200">
                  <div><div className="text-[10px] uppercase text-slate-500 font-semibold mb-1">National ID</div><div className="font-mono text-xs text-slate-900">{viewDuplicateClient.national_id || "—"}</div></div>
                  <div><div className="text-[10px] uppercase text-slate-500 font-semibold mb-1">Registration No</div><div className="font-mono text-xs text-slate-900">{(viewDuplicateClient as any).registration_no || "—"}</div></div>
                  <div><div className="text-[10px] uppercase text-slate-500 font-semibold mb-1">Economic Code</div><div className="font-mono text-xs text-slate-900">{(viewDuplicateClient as any).economic_code || "—"}</div></div>
                  <div><div className="text-[10px] uppercase text-slate-500 font-semibold mb-1">Company Type</div><div className="text-xs text-slate-900">{(viewDuplicateClient as any).company_type || "—"}</div></div>
                  <div><div className="text-[10px] uppercase text-slate-500 font-semibold mb-1">Total Contacts</div><div className="text-xs text-slate-900 font-semibold">{(viewDuplicateClient as any).contactPersons?.length || 0}</div></div>
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/30 p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">➕ Add New Contact Person for {currentDepartment}</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="mb-1 block text-xs font-semibold text-slate-700">Contact Name *</label><input value={newContactForDuplicate.name} onChange={(e) => setNewContactForDuplicate({ ...newContactForDuplicate, name: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" /></div>
                  <div><label className="mb-1 block text-xs font-semibold text-slate-700">Position</label><input value={newContactForDuplicate.position} onChange={(e) => setNewContactForDuplicate({ ...newContactForDuplicate, position: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="mb-1 block text-xs font-semibold text-slate-700">Mobile *</label><input value={newContactForDuplicate.mobile} onChange={(e) => setNewContactForDuplicate({ ...newContactForDuplicate, mobile: e.target.value.replace(/\D/g, "") })} maxLength={11} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" /></div>
                  <div><label className="mb-1 block text-xs font-semibold text-slate-700">Email</label><input type="email" value={newContactForDuplicate.email} onChange={(e) => setNewContactForDuplicate({ ...newContactForDuplicate, email: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" /></div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="ghost" onClick={() => { setIsViewDuplicateOpen(false); setViewDuplicateClient(null); setNewContactForDuplicate({ name: "", position: "", mobile: "", email: "" }); }}>Cancel</Button>
              <Button onClick={handleAddContactToDuplicate}>💾 Save Contact Person</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* EDIT CLIENT MODAL */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Client Information" size="xl">
        {selectedClient && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/30">
              <div className="flex items-center gap-2 mb-4"><span className="text-sm">🔒</span><h3 className="text-sm font-semibold text-slate-700">Read-Only Information</h3></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div><label className="mb-1.5 block text-xs font-semibold text-slate-500">Full Name (English)</label><div className="w-full rounded-lg border border-slate-200 bg-slate-100 py-2.5 px-3 text-sm text-slate-600">{editForm.name_en}</div></div>
                <div dir="rtl"><label className="mb-1.5 block text-xs font-semibold text-slate-500 text-left">Full Name (Farsi)</label><div className="w-full rounded-lg border border-slate-200 bg-slate-100 py-2.5 px-3 text-sm text-slate-600 text-right">{editForm.name_fa}</div></div>
                {editForm.type === "LEGAL" && (<>
                  <div><label className="mb-1.5 block text-xs font-semibold text-slate-500">Abbreviated Name</label><div className="w-full rounded-lg border border-slate-200 bg-slate-100 py-2.5 px-3 text-sm text-slate-600">{editForm.abbreviated_name || "—"}</div></div>
                  <div><label className="mb-1.5 block text-xs font-semibold text-slate-500">Company Type</label><div className="w-full rounded-lg border border-slate-200 bg-slate-100 py-2.5 px-3 text-sm text-slate-600">{editForm.company_type || "—"}</div></div>
                  <div><label className="mb-1.5 block text-xs font-semibold text-slate-500">National ID</label><div className="w-full rounded-lg border border-slate-200 bg-slate-100 py-2.5 px-3 text-sm font-mono text-slate-600">{editForm.national_id}</div></div>
                  <div><label className="mb-1.5 block text-xs font-semibold text-slate-500">Registration Number</label><div className="w-full rounded-lg border border-slate-200 bg-slate-100 py-2.5 px-3 text-sm font-mono text-slate-600">{editForm.registration_no || "—"}</div></div>
                  <div><label className="mb-1.5 block text-xs font-semibold text-slate-500">Economic Code</label><div className="w-full rounded-lg border border-slate-200 bg-slate-100 py-2.5 px-3 text-sm font-mono text-slate-600">{editForm.economic_code || "—"}</div></div>
                </>)}
                {editForm.type === "INDIVIDUAL" && <div><label className="mb-1.5 block text-xs font-semibold text-slate-500">National Code</label><div className="w-full rounded-lg border border-slate-200 bg-slate-100 py-2.5 px-3 text-sm font-mono text-slate-600">{editForm.national_id}</div></div>}
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/30 p-6">
              <div className="flex items-center gap-2 mb-4"><span className="text-sm">✏️</span><h3 className="text-sm font-semibold text-slate-900">Editable Information</h3></div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div><label className="mb-1.5 block text-xs font-semibold text-slate-700">Primary Phone *</label><input value={editForm.phone || editForm.primary_phone || ""} onChange={(e) => setEditForm({ ...editForm, primary_phone: e.target.value, phone: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400" /></div>
                  <div><label className="mb-1.5 block text-xs font-semibold text-slate-700">Email Inbox</label><input type="email" value={editForm.email || editForm.email_inbox || ""} onChange={(e) => setEditForm({ ...editForm, email_inbox: e.target.value, email: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400" /></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div><label className="mb-1.5 block text-xs font-semibold text-slate-700">Address (English) *</label><textarea value={editForm.address_en || ""} onChange={(e) => setEditForm({ ...editForm, address_en: e.target.value })} rows={3} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400" /></div>
                  <div><label className="mb-1.5 block text-xs font-semibold text-slate-700 text-left">Address (Farsi) *</label><textarea value={editForm.address_fa || ""} onChange={(e) => setEditForm({ ...editForm, address_fa: e.target.value })} rows={3} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400" /></div>
                </div>
              </div>
            </div>

            {editForm.type === "LEGAL" && (
              <div className="rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">👥 Contact Persons <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">{editForm.contactPersons?.length || 0}</span></h3>
                  <button type="button" onClick={addEditContactPerson} className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">+ ADD LIAISON</button>
                </div>
                <p className="text-xs text-slate-500 mb-4">Only contact persons related to your department ({currentDepartment}) are shown and editable. Other departments' contacts (if any) are hidden.</p>
                <div className="space-y-3">
                  {editForm.contactPersons?.map((cp: any) => (
                    <div key={cp.id} className="grid grid-cols-12 gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                      <div className="col-span-4"><label className="mb-1 block text-[10px] font-semibold text-slate-600">Liaison Name *</label><input value={cp.name} onChange={(e) => updateEditContactPerson(cp.id, "name", e.target.value)} className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs focus:border-indigo-400 focus:outline-none" /></div>
                      <div className="col-span-3"><label className="mb-1 block text-[10px] font-semibold text-slate-600">Position/Rank</label><input value={cp.position} onChange={(e) => updateEditContactPerson(cp.id, "position", e.target.value)} className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs focus:border-indigo-400 focus:outline-none" /></div>
                      <div className="col-span-3"><label className="mb-1 block text-[10px] font-semibold text-slate-600">Mobile *</label><input value={cp.mobile} onChange={(e) => updateEditContactPerson(cp.id, "mobile", e.target.value.replace(/\D/g, ""))} className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs font-mono focus:border-indigo-400 focus:outline-none" /></div>
                      <div className="col-span-2 flex items-end gap-1">
                        <div className="flex-1"><label className="mb-1 block text-[10px] font-semibold text-slate-600">Direct Email</label><input value={cp.email} onChange={(e) => updateEditContactPerson(cp.id, "email", e.target.value)} className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs focus:border-indigo-400 focus:outline-none" /></div>
                        {editForm.contactPersons.length > 1 && <button type="button" onClick={() => removeEditContactPerson(cp.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">🗑️</button>}
                      </div>
                    </div>
                  ))}
                  {(!editForm.contactPersons || editForm.contactPersons.length === 0) && <div className="text-center py-6 text-slate-400 text-sm">No contact persons for {currentDepartment} yet. Click "+ ADD LIAISON" to add one.</div>}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit}>💾 Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* CONTRACT DETAILS MODAL */}
      <Modal isOpen={!!selectedContract} onClose={() => setSelectedContract(null)} title="Contract Details" size="lg">
        {selectedContract && (() => {
          const tariffs = contractTariffs.filter((t) => t.contract_id === selectedContract.id);
          const daysLeft = calculateDaysLeft(selectedContract.end_date);
          const workProgress = calculateProgressFromTariffs(selectedContract);
          const invoiceProgress = calculateInvoiceProgress(selectedContract);
          
          return (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge tone={selectedContract.type === "CONTRACT" ? "indigo" : "amber"}>{selectedContract.type}</Badge>
                    <Badge tone={selectedContract.status === "ACTIVE" ? "emerald" : "slate"}>{selectedContract.status}</Badge>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedContract.contract_title}</h2>
                  <div className="text-sm text-slate-500 mt-1">{selectedContract.contract_no} • {selectedContract.client_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Total Value</div>
                  <div className="text-xl font-bold text-slate-900">{formatCurrency(selectedContract.total_value)}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 bg-slate-50/50">
                  <div className="text-xs text-slate-500 mb-1">Work Progress</div>
                  <div className={`text-lg font-bold ${getProgressTextClass(workProgress)}`}>
                    {workProgress.toFixed(2)}%
                  </div>
                  <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${getProgressBgClass(workProgress)}`} style={{ width: `${Math.min(workProgress, 100)}%` }} />
                  </div>
                </Card>

                <Card className="p-4 bg-slate-50/50">
                  <div className="text-xs text-slate-500 mb-1">Invoice Progress</div>
                  <div className={`text-lg font-bold ${getProgressTextClass(invoiceProgress)}`}>
                    {invoiceProgress.toFixed(2)}%
                  </div>
                  <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${getProgressBgClass(invoiceProgress)}`} style={{ width: `${Math.min(invoiceProgress, 100)}%` }} />
                  </div>
                </Card>

                <Card className="p-4 bg-slate-50/50">
                  <div className="text-xs text-slate-500">Time Remaining</div>
                  {daysLeft < 0 ? (
                    <div className="text-lg font-bold text-rose-600">{Math.abs(daysLeft)} days overdue</div>
                  ) : daysLeft === 0 ? (
                    <div className="text-lg font-bold text-amber-600">Today (Expires)</div>
                  ) : (
                    <div className="text-lg font-bold text-emerald-600">{daysLeft} days remaining</div>
                  )}
                </Card>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Details</h3>
                {tariffs.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">No tariff lines defined for this contract</div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-3 py-2 font-medium">Description</th>
                          <th className="px-3 py-2 font-medium">Unit</th>
                          <th className="px-3 py-2 font-medium text-right">Rate</th>
                          <th className="px-3 py-2 font-medium text-center">Total Performed Work</th>
                          <th className="px-3 py-2 font-medium text-right">Total Value of Performed Works</th>
                          <th className="px-3 py-2 font-medium text-right">Total Invoiced</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {tariffs.map((tariff) => {
                          const progress = tariff.consumed_quantity;
                          const value = tariff.consumed_quantity * tariff.rate;
                          const invoiced = (tariff as any).invoiced || 0;
                          return (
                            <tr key={tariff.id} className="hover:bg-slate-50/60">
                              <td className="px-3 py-2 font-medium text-slate-800">{tariff.description}</td>
                              <td className="px-3 py-2"><Badge tone="indigo">{tariff.unit.replace("_", " ")}</Badge></td>
                              <td className="px-3 py-2 text-right font-mono">{formatCurrency(tariff.rate)}</td>
                              <td className="px-3 py-2 text-center font-mono">{progress}</td>
                              <td className="px-3 py-2 text-right font-mono font-semibold">{formatCurrency(value)}</td>
                              <td className="px-3 py-2 text-right font-mono font-semibold text-indigo-600">{formatCurrency(invoiced)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                        <tr>
                          <td colSpan={3} className="px-3 py-2.5 text-sm font-bold text-slate-700 text-left uppercase tracking-wider">💰 Total</td>
                          <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-900"></td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-700">{formatCurrency(tariffs.reduce((sum, t) => sum + ((t.consumed_quantity || 0) * (t.rate || 0)), 0))}</td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-indigo-700">{formatCurrency(tariffs.reduce((sum, t) => sum + ((t as any).invoiced || 0), 0))}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-4">
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}