// src/shared/database/MockDatabase.ts

import type { DatabaseService } from './DatabaseService';
import type { 
  DBUser, DBRole, DBPermissionMapping, DBUIElement, DBSettings,
  DBClient, DBContract, DBTariffLine, DBInspector, DBInspection, DBNCR, DBInvoice,
  DBDepartment
} from './types';
import { 
  clients as seedClients, 
  contracts as seedContracts,
  contractTariffs as seedTariffs,
  inspectors as seedInspectors,
  inspections as seedInspections,
  ncrs as seedNCRs,
  invoices as seedInvoices,
} from '@data/mockData';

// ═══════════════════════════════════════
// 💾 Storage Keys
// ═══════════════════════════════════════

const STORAGE_KEYS = {
  users: 'ics_db_users',
  roles: 'ics_db_roles',
  permissionMappings: 'ics_db_permissionMappings',
  uiElements: 'ics_db_uiElements',
  settings: 'ics_db_settings',
  clients: 'ics_db_clients',
  contracts: 'ics_db_contracts',
  tariffLines: 'ics_db_tariffLines',
  inspectors: 'ics_db_inspectors',
  inspections: 'ics_db_inspections',
  ncrs: 'ics_db_ncrs',
  invoices: 'ics_db_invoices',
  departments: 'ics_db_departments',
  initialized: 'ics_db_initialized',
};

// ═══════════════════════════════════════
// 🗄️ In-Memory Storage
// ═══════════════════════════════════════

let mockUsers: DBUser[] = [];
let mockRoles: DBRole[] = [];
let mockPermissionMappings: DBPermissionMapping[] = [];
let mockUIElements: DBUIElement[] = [];
let mockSettings: DBSettings[] = [];
let mockClients: DBClient[] = [];
let mockContracts: DBContract[] = [];
let mockTariffLines: DBTariffLine[] = [];
let mockInspectors: DBInspector[] = [];
let mockInspections: DBInspection[] = [];
let mockNCRs: DBNCR[] = [];
let mockInvoices: DBInvoice[] = [];
let mockDepartments: DBDepartment[] = [];
let isInitialized = false;

// ═══════════════════════════════════════
// 💾 Persistence Helpers
// ═══════════════════════════════════════

function saveToStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`[MockDatabase] Failed to save ${key}:`, e);
  }
}

function loadFromStorage<T>(key: string): T[] | null {
  try {
    const data = localStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data) as T[];
  } catch (e) {
    console.error(`[MockDatabase] Failed to load ${key}:`, e);
    return null;
  }
}

// ═══════════════════════════════════════
// 🎭 MockDatabase Class
// ═══════════════════════════════════════

export class MockDatabase implements DatabaseService {
  
  // ═══════════════════════════════════════
  // 🔐 Users
  // ═══════════════════════════════════════

  async createUser(user: Omit<DBUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<DBUser> {
    const now = new Date().toISOString();
    const newUser: DBUser = {
      ...user,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };
    mockUsers.push(newUser);
    saveToStorage(STORAGE_KEYS.users, mockUsers);
    return newUser;
  }

  async updateUser(id: string, data: Partial<DBUser>): Promise<DBUser> {
    const index = mockUsers.findIndex((u: DBUser) => u.id === id);
    if (index === -1) throw new Error(`User ${id} not found`);
    mockUsers[index] = { ...mockUsers[index], ...data, updatedAt: new Date().toISOString() };
    saveToStorage(STORAGE_KEYS.users, mockUsers);
    return mockUsers[index];
  }

  async deleteUser(id: string): Promise<void> {
    mockUsers = mockUsers.filter((u: DBUser) => u.id !== id);
    saveToStorage(STORAGE_KEYS.users, mockUsers);
  }

  async getUser(id: string): Promise<DBUser | null> {
    return mockUsers.find((u: DBUser) => u.id === id) || null;
  }

  async getUserByUsername(username: string): Promise<DBUser | null> {
    return mockUsers.find((u: DBUser) => u.username === username) || null;
  }

  async getUserByEmail(email: string): Promise<DBUser | null> {
    return mockUsers.find((u: DBUser) => u.email === email) || null;
  }

  async getAllUsers(): Promise<DBUser[]> {
    return [...mockUsers];
  }

  // ═══════════════════════════════════════
  // 🎭 Roles
  // ═══════════════════════════════════════

  async createRole(role: Omit<DBRole, 'id' | 'createdAt' | 'updatedAt'>): Promise<DBRole> {
    const now = new Date().toISOString();
    const newRole: DBRole = {
      ...role,
      id: `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };
    mockRoles.push(newRole);
    saveToStorage(STORAGE_KEYS.roles, mockRoles);
    return newRole;
  }

  async updateRole(id: string, data: Partial<DBRole>): Promise<DBRole> {
    const index = mockRoles.findIndex((r: DBRole) => r.id === id);
    if (index === -1) throw new Error(`Role ${id} not found`);
    mockRoles[index] = { ...mockRoles[index], ...data, updatedAt: new Date().toISOString() };
    saveToStorage(STORAGE_KEYS.roles, mockRoles);
    return mockRoles[index];
  }

  async deleteRole(id: string): Promise<void> {
    mockRoles = mockRoles.filter((r: DBRole) => r.id !== id);
    saveToStorage(STORAGE_KEYS.roles, mockRoles);
  }

  async getRole(id: string): Promise<DBRole | null> {
    return mockRoles.find((r: DBRole) => r.id === id) || null;
  }

  async getRoleByName(name: string): Promise<DBRole | null> {
    return mockRoles.find((r: DBRole) => r.name === name) || null;
  }

  async getAllRoles(): Promise<DBRole[]> {
    return [...mockRoles];
  }

  // ═══════════════════════════════════════
  // 🔐 Permission Mappings
  // ═══════════════════════════════════════

  async setPermissionMapping(permission: string, allowed: string[], denied: string[] = []): Promise<void> {
    const index = mockPermissionMappings.findIndex((m: DBPermissionMapping) => m.permission === permission);
    const mapping: DBPermissionMapping = {
      permission, allowedElements: allowed, deniedElements: denied,
      updatedAt: new Date().toISOString(),
    };
    if (index !== -1) mockPermissionMappings[index] = mapping;
    else mockPermissionMappings.push(mapping);
    saveToStorage(STORAGE_KEYS.permissionMappings, mockPermissionMappings);
  }

  async deletePermissionMapping(permission: string): Promise<void> {
    mockPermissionMappings = mockPermissionMappings.filter((m: DBPermissionMapping) => m.permission !== permission);
    saveToStorage(STORAGE_KEYS.permissionMappings, mockPermissionMappings);
  }

  async getPermissionMapping(permission: string): Promise<DBPermissionMapping | null> {
    return mockPermissionMappings.find((m: DBPermissionMapping) => m.permission === permission) || null;
  }

  async getAllPermissionMappings(): Promise<DBPermissionMapping[]> {
    return [...mockPermissionMappings];
  }

  // ═══════════════════════════════════════
  // 🎨 UI Elements
  // ═══════════════════════════════════════

  async createUIElement(element: Omit<DBUIElement, 'id'>): Promise<DBUIElement> {
    const newElement: DBUIElement = {
      ...element,
      id: `ui_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    mockUIElements.push(newElement);
    saveToStorage(STORAGE_KEYS.uiElements, mockUIElements);
    return newElement;
  }

  async updateUIElement(id: string, data: Partial<DBUIElement>): Promise<DBUIElement> {
    const index = mockUIElements.findIndex((e: DBUIElement) => e.id === id);
    if (index === -1) throw new Error(`UI Element ${id} not found`);
    mockUIElements[index] = { ...mockUIElements[index], ...data };
    saveToStorage(STORAGE_KEYS.uiElements, mockUIElements);
    return mockUIElements[index];
  }

  async deleteUIElement(id: string): Promise<void> {
    mockUIElements = mockUIElements.filter((e: DBUIElement) => e.id !== id);
    saveToStorage(STORAGE_KEYS.uiElements, mockUIElements);
  }

  async getUIElement(id: string): Promise<DBUIElement | null> {
    return mockUIElements.find((e: DBUIElement) => e.id === id) || null;
  }

  async getAllUIElements(): Promise<DBUIElement[]> {
    return [...mockUIElements];
  }

  async getUIElementsByModule(module: string): Promise<DBUIElement[]> {
    return mockUIElements.filter((e: DBUIElement) => e.module === module);
  }

  async getUIElementsByEntity(entity: string): Promise<DBUIElement[]> {
    return mockUIElements.filter((e: DBUIElement) => e.entity === entity);
  }

  // ═══════════════════════════════════════
  // ⚙️ Settings
  // ═══════════════════════════════════════

  async setSetting(key: string, value: any): Promise<void> {
    const index = mockSettings.findIndex((s: DBSettings) => s.key === key);
    const setting: DBSettings = { key, value, updatedAt: new Date().toISOString() };
    if (index !== -1) mockSettings[index] = setting;
    else mockSettings.push(setting);
    saveToStorage(STORAGE_KEYS.settings, mockSettings);
  }

  async getSetting(key: string): Promise<any> {
    return mockSettings.find((s: DBSettings) => s.key === key)?.value ?? null;
  }

  async getAllSettings(): Promise<DBSettings[]> {
    return [...mockSettings];
  }

  // ═══════════════════════════════════════
  // 🏢 Clients
  // ═══════════════════════════════════════

  async createClient(client: Omit<DBClient, 'id' | 'createdAt' | 'updatedAt'>): Promise<DBClient> {
    const now = new Date().toISOString();
    const newClient: DBClient = {
      ...client,
      id: `c_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };
    mockClients.push(newClient);
    saveToStorage(STORAGE_KEYS.clients, mockClients);
    return newClient;
  }

  async updateClient(id: string, data: Partial<DBClient>): Promise<DBClient> {
    const index = mockClients.findIndex((c: DBClient) => c.id === id);
    if (index === -1) throw new Error(`Client ${id} not found`);
    mockClients[index] = { ...mockClients[index], ...data, updatedAt: new Date().toISOString() };
    saveToStorage(STORAGE_KEYS.clients, mockClients);
    return mockClients[index];
  }

  async deleteClient(id: string): Promise<void> {
    mockClients = mockClients.filter((c: DBClient) => c.id !== id);
    saveToStorage(STORAGE_KEYS.clients, mockClients);
  }

  async getClient(id: string): Promise<DBClient | null> {
    return mockClients.find((c: DBClient) => c.id === id) || null;
  }

  async getAllClients(): Promise<DBClient[]> {
    return [...mockClients];
  }

  // ═══════════════════════════════════════
  // 📄 Contracts
  // ═══════════════════════════════════════

  async createContract(contract: Omit<DBContract, 'id' | 'createdAt' | 'updatedAt'>): Promise<DBContract> {
    const now = new Date().toISOString();
    const newContract: DBContract = {
      ...contract,
      id: `ct_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };
    mockContracts.push(newContract);
    saveToStorage(STORAGE_KEYS.contracts, mockContracts);
    return newContract;
  }

  async updateContract(id: string, data: Partial<DBContract>): Promise<DBContract> {
    const index = mockContracts.findIndex((c: DBContract) => c.id === id);
    if (index === -1) throw new Error(`Contract ${id} not found`);
    mockContracts[index] = { ...mockContracts[index], ...data, updatedAt: new Date().toISOString() };
    saveToStorage(STORAGE_KEYS.contracts, mockContracts);
    return mockContracts[index];
  }

  async deleteContract(id: string): Promise<void> {
    mockContracts = mockContracts.filter((c: DBContract) => c.id !== id);
    saveToStorage(STORAGE_KEYS.contracts, mockContracts);
  }

  async getContract(id: string): Promise<DBContract | null> {
    return mockContracts.find((c: DBContract) => c.id === id) || null;
  }

  async getAllContracts(): Promise<DBContract[]> {
    return [...mockContracts];
  }

  async getContractsByClient(clientId: string): Promise<DBContract[]> {
    return mockContracts.filter((c: DBContract) => c.client_id === clientId);
  }

  // ═══════════════════════════════════════
  // 💰 Tariff Lines
  // ═══════════════════════════════════════

  async createTariffLine(tariff: Omit<DBTariffLine, 'id' | 'createdAt' | 'updatedAt'>): Promise<DBTariffLine> {
    const now = new Date().toISOString();
    const newTariff: DBTariffLine = {
      ...tariff,
      id: `t_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };
    mockTariffLines.push(newTariff);
    saveToStorage(STORAGE_KEYS.tariffLines, mockTariffLines);
    return newTariff;
  }

  async updateTariffLine(id: string, data: Partial<DBTariffLine>): Promise<DBTariffLine> {
    const index = mockTariffLines.findIndex((t: DBTariffLine) => t.id === id);
    if (index === -1) throw new Error(`Tariff ${id} not found`);
    mockTariffLines[index] = { ...mockTariffLines[index], ...data, updatedAt: new Date().toISOString() };
    saveToStorage(STORAGE_KEYS.tariffLines, mockTariffLines);
    return mockTariffLines[index];
  }

  async deleteTariffLine(id: string): Promise<void> {
    mockTariffLines = mockTariffLines.filter((t: DBTariffLine) => t.id !== id);
    saveToStorage(STORAGE_KEYS.tariffLines, mockTariffLines);
  }

  async getTariffLinesByContract(contractId: string): Promise<DBTariffLine[]> {
    return mockTariffLines.filter((t: DBTariffLine) => t.contract_id === contractId);
  }

  async getAllTariffLines(): Promise<DBTariffLine[]> {
    return [...mockTariffLines];
  }

  // ═══════════════════════════════════════
  // 👷 Inspectors
  // ═══════════════════════════════════════

  async createInspector(inspector: Omit<DBInspector, 'id' | 'createdAt' | 'updatedAt'>): Promise<DBInspector> {
    const now = new Date().toISOString();
    const newInspector: DBInspector = {
      ...inspector,
      id: `i_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };
    mockInspectors.push(newInspector);
    saveToStorage(STORAGE_KEYS.inspectors, mockInspectors);
    return newInspector;
  }

  async updateInspector(id: string, data: Partial<DBInspector>): Promise<DBInspector> {
    const index = mockInspectors.findIndex((i: DBInspector) => i.id === id);
    if (index === -1) throw new Error(`Inspector ${id} not found`);
    mockInspectors[index] = { ...mockInspectors[index], ...data, updatedAt: new Date().toISOString() };
    saveToStorage(STORAGE_KEYS.inspectors, mockInspectors);
    return mockInspectors[index];
  }

  async deleteInspector(id: string): Promise<void> {
    mockInspectors = mockInspectors.filter((i: DBInspector) => i.id !== id);
    saveToStorage(STORAGE_KEYS.inspectors, mockInspectors);
  }

  async getInspector(id: string): Promise<DBInspector | null> {
    return mockInspectors.find((i: DBInspector) => i.id === id) || null;
  }

  async getAllInspectors(): Promise<DBInspector[]> {
    return [...mockInspectors];
  }

  // ═══════════════════════════════════════
  // 🔍 Inspections
  // ═══════════════════════════════════════

  async createInspection(inspection: Omit<DBInspection, 'id' | 'createdAt' | 'updatedAt'>): Promise<DBInspection> {
    const now = new Date().toISOString();
    const newInspection: DBInspection = {
      ...inspection,
      id: `in_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };
    mockInspections.push(newInspection);
    saveToStorage(STORAGE_KEYS.inspections, mockInspections);
    return newInspection;
  }

  async updateInspection(id: string, data: Partial<DBInspection>): Promise<DBInspection> {
    const index = mockInspections.findIndex((i: DBInspection) => i.id === id);
    if (index === -1) throw new Error(`Inspection ${id} not found`);
    mockInspections[index] = { ...mockInspections[index], ...data, updatedAt: new Date().toISOString() };
    saveToStorage(STORAGE_KEYS.inspections, mockInspections);
    return mockInspections[index];
  }

  async deleteInspection(id: string): Promise<void> {
    mockInspections = mockInspections.filter((i: DBInspection) => i.id !== id);
    saveToStorage(STORAGE_KEYS.inspections, mockInspections);
  }

  async getInspection(id: string): Promise<DBInspection | null> {
    return mockInspections.find((i: DBInspection) => i.id === id) || null;
  }

  async getAllInspections(): Promise<DBInspection[]> {
    return [...mockInspections];
  }

  async getInspectionsByContract(contractId: string): Promise<DBInspection[]> {
    return mockInspections.filter((i: DBInspection) => i.contract_id === contractId);
  }

  // ═══════════════════════════════════════
  // ⚠️ NCRs
  // ═══════════════════════════════════════

  async createNCR(ncr: Omit<DBNCR, 'id' | 'createdAt' | 'updatedAt'>): Promise<DBNCR> {
    const now = new Date().toISOString();
    const newNCR: DBNCR = {
      ...ncr,
      id: `ncr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };
    mockNCRs.push(newNCR);
    saveToStorage(STORAGE_KEYS.ncrs, mockNCRs);
    return newNCR;
  }

  async updateNCR(id: string, data: Partial<DBNCR>): Promise<DBNCR> {
    const index = mockNCRs.findIndex((n: DBNCR) => n.id === id);
    if (index === -1) throw new Error(`NCR ${id} not found`);
    mockNCRs[index] = { ...mockNCRs[index], ...data, updatedAt: new Date().toISOString() };
    saveToStorage(STORAGE_KEYS.ncrs, mockNCRs);
    return mockNCRs[index];
  }

  async deleteNCR(id: string): Promise<void> {
    mockNCRs = mockNCRs.filter((n: DBNCR) => n.id !== id);
    saveToStorage(STORAGE_KEYS.ncrs, mockNCRs);
  }

  async getNCR(id: string): Promise<DBNCR | null> {
    return mockNCRs.find((n: DBNCR) => n.id === id) || null;
  }

  async getAllNCRs(): Promise<DBNCR[]> {
    return [...mockNCRs];
  }

  async getNCRsByInspection(inspectionId: string): Promise<DBNCR[]> {
    return mockNCRs.filter((n: DBNCR) => n.inspection_id === inspectionId);
  }

  // ═══════════════════════════════════════
  // 💵 Invoices
  // ═══════════════════════════════════════

  async createInvoice(invoice: Omit<DBInvoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<DBInvoice> {
    const now = new Date().toISOString();
    const newInvoice: DBInvoice = {
      ...invoice,
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };
    mockInvoices.push(newInvoice);
    saveToStorage(STORAGE_KEYS.invoices, mockInvoices);
    return newInvoice;
  }

  async updateInvoice(id: string, data: Partial<DBInvoice>): Promise<DBInvoice> {
    const index = mockInvoices.findIndex((i: DBInvoice) => i.id === id);
    if (index === -1) throw new Error(`Invoice ${id} not found`);
    mockInvoices[index] = { ...mockInvoices[index], ...data, updatedAt: new Date().toISOString() };
    saveToStorage(STORAGE_KEYS.invoices, mockInvoices);
    return mockInvoices[index];
  }

  async deleteInvoice(id: string): Promise<void> {
    mockInvoices = mockInvoices.filter((i: DBInvoice) => i.id !== id);
    saveToStorage(STORAGE_KEYS.invoices, mockInvoices);
  }

  async getInvoice(id: string): Promise<DBInvoice | null> {
    return mockInvoices.find((i: DBInvoice) => i.id === id) || null;
  }

  async getAllInvoices(): Promise<DBInvoice[]> {
    return [...mockInvoices];
  }

  async getInvoicesByInspection(inspectionId: string): Promise<DBInvoice[]> {
    return mockInvoices.filter((i: DBInvoice) => i.inspection_id === inspectionId);
  }

  // ═══════════════════════════════════════
  // 🏢 Departments
  // ═══════════════════════════════════════

  async createDepartment(department: Omit<DBDepartment, 'id' | 'createdAt' | 'updatedAt'>): Promise<DBDepartment> {
    const now = new Date().toISOString();
    const newDepartment: DBDepartment = {
      ...department,
      id: `dept_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };
    mockDepartments.push(newDepartment);
    saveToStorage(STORAGE_KEYS.departments, mockDepartments);
    return newDepartment;
  }

  async updateDepartment(id: string, data: Partial<DBDepartment>): Promise<DBDepartment> {
    const index = mockDepartments.findIndex((d: DBDepartment) => d.id === id);
    if (index === -1) throw new Error(`Department ${id} not found`);
    mockDepartments[index] = { ...mockDepartments[index], ...data, updatedAt: new Date().toISOString() };
    saveToStorage(STORAGE_KEYS.departments, mockDepartments);
    return mockDepartments[index];
  }

  async deleteDepartment(id: string): Promise<void> {
    mockDepartments = mockDepartments.filter((d: DBDepartment) => d.id !== id);
    saveToStorage(STORAGE_KEYS.departments, mockDepartments);
  }

  async getDepartment(id: string): Promise<DBDepartment | null> {
    return mockDepartments.find((d: DBDepartment) => d.id === id) || null;
  }

  async getAllDepartments(): Promise<DBDepartment[]> {
    return [...mockDepartments];
  }

  // ═══════════════════════════════════════
  // 🔧 SYNC Methods (برای hooks)
  // ═══════════════════════════════════════

  getRoleByNameSync(name: string): DBRole | null {
    return mockRoles.find((r: DBRole) => r.name === name) || null;
  }

  getUserSync(id: string): DBUser | null {
    return mockUsers.find((u: DBUser) => u.id === id) || null;
  }

  getAllDepartmentsSync(): DBDepartment[] {
    return [...mockDepartments];
  }

  getAllRolesSync(): DBRole[] {
    return [...mockRoles];
  }

  // ═══════════════════════════════════════
  // 🔄 Bulk Operations
  // ═══════════════════════════════════════

  async initialize(): Promise<void> {
    if (isInitialized) {
      console.log('[MockDatabase] ✅ Already initialized, skipping...');
      return;
    }

    // 🔧 FIX: اول تلاش کن از localStorage بخونی
    const savedUsers = loadFromStorage<DBUser>(STORAGE_KEYS.users);
    const savedRoles = loadFromStorage<DBRole>(STORAGE_KEYS.roles);
    const savedMappings = loadFromStorage<DBPermissionMapping>(STORAGE_KEYS.permissionMappings);
    const savedUIElements = loadFromStorage<DBUIElement>(STORAGE_KEYS.uiElements);
    const savedSettings = loadFromStorage<DBSettings>(STORAGE_KEYS.settings);
    const savedClients = loadFromStorage<DBClient>(STORAGE_KEYS.clients);
    const savedContracts = loadFromStorage<DBContract>(STORAGE_KEYS.contracts);
    const savedTariffLines = loadFromStorage<DBTariffLine>(STORAGE_KEYS.tariffLines);
    const savedInspectors = loadFromStorage<DBInspector>(STORAGE_KEYS.inspectors);
    const savedInspections = loadFromStorage<DBInspection>(STORAGE_KEYS.inspections);
    const savedNCRs = loadFromStorage<DBNCR>(STORAGE_KEYS.ncrs);
    const savedInvoices = loadFromStorage<DBInvoice>(STORAGE_KEYS.invoices);
    const savedDepartments = loadFromStorage<DBDepartment>(STORAGE_KEYS.departments);

    // 🔧 FIX: اگه داده‌های ذخیره شده هست، از اونا استفاده کن
    if (savedUsers && savedUsers.length > 0) {
      mockUsers = savedUsers;
      mockRoles = savedRoles || [];
      mockPermissionMappings = savedMappings || [];
      mockUIElements = savedUIElements || [];
      mockSettings = savedSettings || [];
      mockClients = savedClients || [];
      mockContracts = savedContracts || [];
      mockTariffLines = savedTariffLines || [];
      mockInspectors = savedInspectors || [];
      mockInspections = savedInspections || [];
      mockNCRs = savedNCRs || [];
      mockInvoices = savedInvoices || [];
      
      // 🔧 FIX: departments از localStorage یا seed از DEPARTMENTS
      if (savedDepartments && savedDepartments.length > 0) {
        mockDepartments = savedDepartments;
      } else {
        const { DEPARTMENTS } = await import('@shared/authorization/departments');
        const now = new Date().toISOString();
        mockDepartments = DEPARTMENTS.map(d => ({
          id: d.id,
          name: d.name,
          description: d.description,
          createdAt: now,
          updatedAt: now,
        }));
        saveToStorage(STORAGE_KEYS.departments, mockDepartments);
        console.log(`[MockDatabase] ✅ Seeded ${mockDepartments.length} departments from DEPARTMENTS`);
      }
      
      isInitialized = true;
      
      console.log('[MockDatabase] ✅ Loaded from localStorage:');
      console.log(`  - ${mockUsers.length} users`);
      console.log(`  - ${mockRoles.length} roles`);
      console.log(`  - ${mockDepartments.length} departments`);
      console.log(`  - ${mockPermissionMappings.length} permission mappings`);
      return;
    }

    // 🔧 FIX: اگه داده‌ای نبود، از seed data استفاده کن
    const now = new Date().toISOString();
    
    mockClients = seedClients.map(c => ({
      ...c,
      createdAt: now,
      updatedAt: now,
    })) as DBClient[];

    mockContracts = seedContracts.map(c => ({
      ...c,
      createdAt: now,
      updatedAt: now,
    })) as DBContract[];

    mockTariffLines = seedTariffs.map(t => ({
      ...t,
      createdAt: now,
      updatedAt: now,
    })) as DBTariffLine[];

    mockInspectors = seedInspectors.map(i => ({
      ...i,
      createdAt: now,
      updatedAt: now,
    })) as DBInspector[];

    mockInspections = seedInspections.map(i => ({
      ...i,
      createdAt: now,
      updatedAt: now,
    })) as DBInspection[];

    mockNCRs = seedNCRs.map(n => ({
      ...n,
      createdAt: now,
      updatedAt: now,
    })) as DBNCR[];

    mockInvoices = seedInvoices.map(i => ({
      ...i,
      createdAt: now,
      updatedAt: now,
    })) as DBInvoice[];

    // 🔧 FIX: فقط admin user
    mockUsers = [
      {
        id: 'user_001',
        username: 'admin',
        email: 'admin@ics.com',
        fullName: 'Administrator',
        password: 'admin123',
        role: 'admin',
        department: 'it',
        status: 'active',
        createdAt: now,
        updatedAt: now,
        customPermissions: [],
      },
    ];

    // 🔧 FIX: فقط admin role با *:*
    mockRoles = [
      {
        id: 'role_admin',
        name: 'admin',
        displayName: 'Administrator',
        description: 'Full system access - cannot be deleted',
        permissions: ['*:*'],
        isSystem: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    // 🔧 FIX: Seed departments از DEPARTMENTS موجود
    const { DEPARTMENTS } = await import('@shared/authorization/departments');
    mockDepartments = DEPARTMENTS.map(d => ({
      id: d.id,
      name: d.name,
      description: d.description,
      createdAt: now,
      updatedAt: now,
    }));

    mockPermissionMappings = [];
    mockUIElements = [];
    mockSettings = [];

    // 🔧 FIX: ذخیره اولیه در localStorage
    saveToStorage(STORAGE_KEYS.users, mockUsers);
    saveToStorage(STORAGE_KEYS.roles, mockRoles);
    saveToStorage(STORAGE_KEYS.permissionMappings, mockPermissionMappings);
    saveToStorage(STORAGE_KEYS.uiElements, mockUIElements);
    saveToStorage(STORAGE_KEYS.settings, mockSettings);
    saveToStorage(STORAGE_KEYS.clients, mockClients);
    saveToStorage(STORAGE_KEYS.contracts, mockContracts);
    saveToStorage(STORAGE_KEYS.tariffLines, mockTariffLines);
    saveToStorage(STORAGE_KEYS.inspectors, mockInspectors);
    saveToStorage(STORAGE_KEYS.inspections, mockInspections);
    saveToStorage(STORAGE_KEYS.ncrs, mockNCRs);
    saveToStorage(STORAGE_KEYS.invoices, mockInvoices);
    saveToStorage(STORAGE_KEYS.departments, mockDepartments);

    isInitialized = true;

    console.log('[MockDatabase] ✅ Initialized from seed data:');
    console.log(`  - ${mockClients.length} clients (from seed)`);
    console.log(`  - ${mockContracts.length} contracts (from seed)`);
    console.log(`  - ${mockTariffLines.length} tariff lines (from seed)`);
    console.log(`  - ${mockInspectors.length} inspectors (from seed)`);
    console.log(`  - ${mockInspections.length} inspections (from seed)`);
    console.log(`  - ${mockNCRs.length} NCRs (from seed)`);
    console.log(`  - ${mockInvoices.length} invoices (from seed)`);
    console.log(`  - ${mockDepartments.length} departments (from DEPARTMENTS)`);
    console.log(`  - ${mockUsers.length} user (admin only)`);
    console.log(`  - ${mockRoles.length} role (admin only with *:*)`);
    console.log(`  - 0 permission mappings (user-defined)`);
  }

  async reset(): Promise<void> {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    mockUsers = [];
    mockRoles = [];
    mockPermissionMappings = [];
    mockUIElements = [];
    mockSettings = [];
    mockClients = [];
    mockContracts = [];
    mockTariffLines = [];
    mockInspectors = [];
    mockInspections = [];
    mockNCRs = [];
    mockInvoices = [];
    mockDepartments = [];
    
    isInitialized = false;
    
    await this.initialize();
  }

  async isInitialized(): Promise<boolean> {
    return isInitialized;
  }
}