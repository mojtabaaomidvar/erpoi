// src/features/client-management/domain/models/Client.ts

export interface ClientContact {
  id: string;
  name: string;
  position?: string;
  mobile: string;
  email?: string;
  department?: string;
}

export interface Client {
  id: string;
  name_en: string;
  name_fa: string;
  type: "LEGAL" | "INDIVIDUAL";
  national_id: string;
  phone: string;
  email: string;
  emails?: string[];
  departments: string[];
  contactPersons: ClientContact[];
  logoColor: string;
  contracts: number;
  contacts: number;
  registration_no?: string;
  economic_code?: string;
  abbreviated_name?: string;
  company_type?: string;
  address_en?: string;
  address_fa?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NewContactPerson {
  name: string;
  position: string;
  mobile: string;
  email: string;
}

export interface DuplicateClientInfo {
  id: string;
  name_en: string;
  name_fa: string;
  type: "LEGAL" | "INDIVIDUAL";
  national_id: string;
  logoColor: string;
  departments: string[];
  contactPersons: ClientContact[];
  emails?: string[];
  _resolvedDepartmentNames: string[];
}
