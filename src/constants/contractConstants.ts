// ============ CONTRACT STATUSES ============
export const CONTRACT_STATUSES = [
  { value:"ACTIVE", label:"Active", color:"emerald", icon:"🟢"},
  { value:"PENDING", label:"Pending", color:"amber", icon:"🟡"},
  { value:"CLOSED", label:"Closed", color:"slate", icon:"⚫"},
] as const;

export type ContractStatusType = typeof CONTRACT_STATUSES[number]["value"];

export const getStatusConfig = (status: string) => {
  return CONTRACT_STATUSES.find(s => s.value === status) || CONTRACT_STATUSES[0];
};

// ============ PROGRESS COLOR ============
export const getProgressColor = (progress: number): string => {
  if (progress >= 100) return"bg-emerald-500";
  if (progress >= 75) return"bg-emerald-400";
  if (progress >= 50) return"bg-yellow-500";
  if (progress >= 25) return"bg-orange-500";
  return"bg-rose-500";
};

// ============ CONTRACT TYPES ============
export const CONTRACT_TYPES = [
  { value:"CONTRACT", label:"Contract", icon:"📄", color:"indigo"},
  { value:"WORK_ORDER", label:"Work Order", icon:"📦", color:"amber"},
] as const;

export type ContractType = typeof CONTRACT_TYPES[number]["value"];

export const getTypeConfig = (type: string) => {
  return CONTRACT_TYPES.find(t => t.value === type) || CONTRACT_TYPES[0];
};




