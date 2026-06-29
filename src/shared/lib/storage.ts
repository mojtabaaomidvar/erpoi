// ============ STORAGE KEYS ============
const STORAGE_KEYS = {
  CLIENTS:'ics_clients',
  CONTRACTS:'ics_contracts',
  CONTRACT_TARIFFS:'ics_contract_tariffs',
  INSPECTORS:'ics_inspectors',
  INSPECTIONS:'ics_inspections',
  BILLING:'ics_billing',
} as const;

// ============ GENERIC FUNCTIONS ============
export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as T;
    }
  } catch (error) {
    console.error(`Error loading ${key} from storage:`, error);
  }
  return fallback;
}

export function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to storage:`, error);
  }
}

export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from storage:`, error);
  }
}

// ============ SPECIFIC FUNCTIONS ============
export const storage = {
  clients: {
    load: () => loadFromStorage(STORAGE_KEYS.CLIENTS, []),
    save: (data: any[]) => saveToStorage(STORAGE_KEYS.CLIENTS, data),
    clear: () => removeFromStorage(STORAGE_KEYS.CLIENTS),
  },
  contracts: {
    load: () => loadFromStorage(STORAGE_KEYS.CONTRACTS, []),
    save: (data: any[]) => saveToStorage(STORAGE_KEYS.CONTRACTS, data),
    clear: () => removeFromStorage(STORAGE_KEYS.CONTRACTS),
  },
  contractTariffs: {
    load: () => loadFromStorage(STORAGE_KEYS.CONTRACT_TARIFFS, []),
    save: (data: any[]) => saveToStorage(STORAGE_KEYS.CONTRACT_TARIFFS, data),
    clear: () => removeFromStorage(STORAGE_KEYS.CONTRACT_TARIFFS),
  },
  inspectors: {
    load: () => loadFromStorage(STORAGE_KEYS.INSPECTORS, []),
    save: (data: any[]) => saveToStorage(STORAGE_KEYS.INSPECTORS, data),
    clear: () => removeFromStorage(STORAGE_KEYS.INSPECTORS),
  },
  inspections: {
    load: () => loadFromStorage(STORAGE_KEYS.INSPECTIONS, []),
    save: (data: any[]) => saveToStorage(STORAGE_KEYS.INSPECTIONS, data),
    clear: () => removeFromStorage(STORAGE_KEYS.INSPECTIONS),
  },
  billing: {
    load: () => loadFromStorage(STORAGE_KEYS.BILLING, []),
    save: (data: any[]) => saveToStorage(STORAGE_KEYS.BILLING, data),
    clear: () => removeFromStorage(STORAGE_KEYS.BILLING),
  },
};

// ============ RESET ALL DATA ============
export function resetAllData(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    removeFromStorage(key);
  });
  window.location.reload();
}




