// src/types/client.ts

// ═══════════════════════════════════════
// 👤 Contact Person
// ═══════════════════════════════════════
export interface ContactPerson {
  id: string;
  name: string;
  position?: string;
  mobile: string;
  email?: string;
  department?: string;
}

// ═══════════════════════════════════════
// 🏢 Client
// ═══════════════════════════════════════
export interface Client {
  id: string;
  name_en: string;
  name_fa: string;
  type: "LEGAL" | "INDIVIDUAL";
  category?: string;
  company_type?: string;
  national_id: string;
  phone: string;
  email: string;
  emails?: string[];
  departments: string[];
  contactPersons: ContactPerson[];
  logoColor: string;
  contracts: number;
  contacts: number;
  registration_no?: string;
  economic_code?: string;
  abbreviated_name?: string;
  address_en?: string;
  address_fa?: string;
  createdAt?: string;
  updatedAt?: string;
}