// src/shared/database/types.ts

// ═══════════════════════════════════════
// 🔐 Auth & Permission Types
// ═══════════════════════════════════════

export interface DBUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  password: string;
  role: string;
  department: string;
  status: 'active' | 'inactive' | 'suspended';
  avatar?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  customPermissions?: string[];
  preferences?: any;
}

export interface DBRole {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DBPermissionMapping {
  permission: string;
  allowedElements: string[];
  deniedElements: string[];
  updatedAt: string;
}

export interface DBUIElement {
  id: string;
  name: string;
  type: string;
  entity: string;
  module: string;
  description?: string;
  component?: string;
}

export interface DBSettings {
  key: string;
  value: any;
  updatedAt: string;
}

// ═══════════════════════════════════════
// 🏢 Business Entity Types
// ═══════════════════════════════════════

export interface DBClient {
  id: string;
  type: 'LEGAL' | 'INDIVIDUAL';
  name_en: string;
  name_fa: string;
  national_id: string;
  email?: string;
  phone?: string;
  category: string;
  contacts: number;
  contracts: number;
  logoColor: string;
  abbreviated_name?: string;
  company_type?: string;
  registration_no?: string;
  economic_code?: string;
  address_en: string;
  address_fa: string;
  departments: string[];
  contactPersons: DBContactPerson[];
  createdAt: string;
  updatedAt: string;
}

export interface DBContactPerson {
  id: string;
  name: string;
  position: string;
  mobile: string;
  email: string;
  department: string;
}

export interface DBContract {
  id: string;
  contract_no: string;
  external_contract_no?: string;
  client_id: string;
  client_name: string;
  contract_title: string;
  start_date: string;
  end_date: string;
  total_value: number;
  invoiced: number;
  currency: string;
  status: 'ACTIVE' | 'COMPLETED' | 'NOT_STARTED' | 'NEEDS_REVIEW';
  type: 'CONTRACT' | 'WORK_ORDER';
  tariffs: number;
  department: string;
  description?: string;
  contract_count?: number;
  tariffLines?: DBTariffLine[];
  financial_terms?: any;
  service_description?: string;
  source_type?: string;
  source_ref?: string;
  source_file?: string;
  source_letter_date?: string;
  source_letter_image?: string;
  source_email_from?: string;
  source_email_date?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DBTariffLine {
  id: string;
  contract_id: string;
  description: string;
  unit: string;
  rate: number | string;
  total_quantity: number;
  consumed_quantity: number;
  invoiced: number;
  createdAt: string;
  updatedAt: string;
}

export interface DBInspector {
  id: string;
  name_en: string;
  name_fa: string;
  phone: string;
  email: string;
  location: string;
  rating: number;
  status: 'AVAILABLE' | 'BUSY' | 'ON_LEAVE';
  specialties: string[];
  certifications: number;
  activeJobs: number;
  completedJobs: number;
  createdAt: string;
  updatedAt: string;
}

export interface DBInspection {
  id: string;
  inspection_no: string;
  contract_id: string;
  contract_no: string;
  client_name: string;
  inspector_id?: string;
  inspector_name?: string;
  source: 'EMAIL' | 'LETTER' | 'PHONE';
  reference_no: string;
  date_requested: string;
  date_assigned?: string;
  date_executed?: string;
  date_completed?: string;
  status: 'REQUESTED' | 'INSPECTOR_ASSIGNED' | 'DOC_REVIEW' | 'EXECUTING' | 'NCR_ISSUED' | 'COMPLETED';
  has_ncr: boolean;
  location: string;
  discipline: string;
  createdAt: string;
  updatedAt: string;
}

export interface DBNCR {
  id: string;
  ncr_no: string;
  inspection_id: string;
  inspection_no: string;
  client_name: string;
  description: string;
  severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  date_raised: string;
  date_closed?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DBInvoice {
  id: string;
  invoice_no: string;
  inspection_id: string;
  inspection_no: string;
  contract_no: string;
  client_name: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE';
  issued_date: string;
  due_date: string;
  paid_date?: string;
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════
// 📊 Database Schema
// ═══════════════════════════════════════

export interface DatabaseSchema {
  // Auth
  users: DBUser;
  roles: DBRole;
  permissionMappings: DBPermissionMapping;
  uiElements: DBUIElement;
  settings: DBSettings;
  
  // Business
  clients: DBClient;
  contracts: DBContract;
  tariffLines: DBTariffLine;
  inspectors: DBInspector;
  inspections: DBInspection;
  ncrs: DBNCR;
  invoices: DBInvoice;
}