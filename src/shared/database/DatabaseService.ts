// src/shared/database/DatabaseService.ts

import type { 
  DBUser, DBRole, DBPermissionMapping, DBUIElement, DBSettings,
  DBClient, DBContract, DBTariffLine, DBInspector, DBInspection, DBNCR, DBInvoice
} from './types';

export interface DatabaseService {
  // ═══════════════════════════════════════
  // 🔐 Auth & Permission
  // ═══════════════════════════════════════
  
  // Users
  createUser(user: Omit<DBUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<DBUser>;
  updateUser(id: string, data: Partial<DBUser>): Promise<DBUser>;
  deleteUser(id: string): Promise<void>;
  getUser(id: string): Promise<DBUser | null>;
  getUserByUsername(username: string): Promise<DBUser | null>;
  getUserByEmail(email: string): Promise<DBUser | null>;
  getAllUsers(): Promise<DBUser[]>;
  
  // Roles
  createRole(role: Omit<DBRole, 'id' | 'createdAt' | 'updatedAt'>): Promise<DBRole>;
  updateRole(id: string, data: Partial<DBRole>): Promise<DBRole>;
  deleteRole(id: string): Promise<void>;
  getRole(id: string): Promise<DBRole | null>;
  getRoleByName(name: string): Promise<DBRole | null>;
  getAllRoles(): Promise<DBRole[]>;
  
  // Permission Mappings
  setPermissionMapping(permission: string, allowed: string[], denied?: string[]): Promise<void>;
  getPermissionMapping(permission: string): Promise<DBPermissionMapping | null>;
  getAllPermissionMappings(): Promise<DBPermissionMapping[]>;
  
  // UI Elements
  createUIElement(element: Omit<DBUIElement, 'id'>): Promise<DBUIElement>;
  updateUIElement(id: string, data: Partial<DBUIElement>): Promise<DBUIElement>;
  deleteUIElement(id: string): Promise<void>;
  getUIElement(id: string): Promise<DBUIElement | null>;
  getAllUIElements(): Promise<DBUIElement[]>;
  getUIElementsByModule(module: string): Promise<DBUIElement[]>;
  getUIElementsByEntity(entity: string): Promise<DBUIElement[]>;
  
  // Settings
  setSetting(key: string, value: any): Promise<void>;
  getSetting(key: string): Promise<any>;
  getAllSettings(): Promise<DBSettings[]>;
  
  // ═══════════════════════════════════════
  // 🏢 Business Entities
  // ═══════════════════════════════════════
  
  // Clients
  createClient(client: Omit<DBClient, 'id' | 'createdAt' | 'updatedAt'>): Promise<DBClient>;
  updateClient(id: string, data: Partial<DBClient>): Promise<DBClient>;
  deleteClient(id: string): Promise<void>;
  getClient(id: string): Promise<DBClient | null>;
  getAllClients(): Promise<DBClient[]>;
  
  // Contracts
  createContract(contract: Omit<DBContract, 'id' | 'createdAt' | 'updatedAt'>): Promise<DBContract>;
  updateContract(id: string, data: Partial<DBContract>): Promise<DBContract>;
  deleteContract(id: string): Promise<void>;
  getContract(id: string): Promise<DBContract | null>;
  getAllContracts(): Promise<DBContract[]>;
  getContractsByClient(clientId: string): Promise<DBContract[]>;
  
  // Tariff Lines
  createTariffLine(tariff: Omit<DBTariffLine, 'id' | 'createdAt' | 'updatedAt'>): Promise<DBTariffLine>;
  updateTariffLine(id: string, data: Partial<DBTariffLine>): Promise<DBTariffLine>;
  deleteTariffLine(id: string): Promise<void>;
  getTariffLinesByContract(contractId: string): Promise<DBTariffLine[]>;
  getAllTariffLines(): Promise<DBTariffLine[]>;
  
  // Inspectors
  createInspector(inspector: Omit<DBInspector, 'id' | 'createdAt' | 'updatedAt'>): Promise<DBInspector>;
  updateInspector(id: string, data: Partial<DBInspector>): Promise<DBInspector>;
  deleteInspector(id: string): Promise<void>;
  getInspector(id: string): Promise<DBInspector | null>;
  getAllInspectors(): Promise<DBInspector[]>;
  
  // Inspections
  createInspection(inspection: Omit<DBInspection, 'id' | 'createdAt' | 'updatedAt'>): Promise<DBInspection>;
  updateInspection(id: string, data: Partial<DBInspection>): Promise<DBInspection>;
  deleteInspection(id: string): Promise<void>;
  getInspection(id: string): Promise<DBInspection | null>;
  getAllInspections(): Promise<DBInspection[]>;
  getInspectionsByContract(contractId: string): Promise<DBInspection[]>;
  
  // NCRs
  createNCR(ncr: Omit<DBNCR, 'id' | 'createdAt' | 'updatedAt'>): Promise<DBNCR>;
  updateNCR(id: string, data: Partial<DBNCR>): Promise<DBNCR>;
  deleteNCR(id: string): Promise<void>;
  getNCR(id: string): Promise<DBNCR | null>;
  getAllNCRs(): Promise<DBNCR[]>;
  getNCRsByInspection(inspectionId: string): Promise<DBNCR[]>;
  
  // Invoices
  createInvoice(invoice: Omit<DBInvoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<DBInvoice>;
  updateInvoice(id: string, data: Partial<DBInvoice>): Promise<DBInvoice>;
  deleteInvoice(id: string): Promise<void>;
  getInvoice(id: string): Promise<DBInvoice | null>;
  getAllInvoices(): Promise<DBInvoice[]>;
  getInvoicesByInspection(inspectionId: string): Promise<DBInvoice[]>;
  
  // ═══════════════════════════════════════
  // 🔄 Bulk Operations
  // ═══════════════════════════════════════
  
  initialize(): Promise<void>;
  reset(): Promise<void>;
  isInitialized(): Promise<boolean>;
}