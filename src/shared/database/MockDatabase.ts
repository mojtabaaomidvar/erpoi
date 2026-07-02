// src/shared/database/MockDatabase.ts

import type { DatabaseService } from './DatabaseService';
import type { 
  DBUser, DBRole, DBPermissionMapping, DBUIElement, DBSettings,
  DBClient, DBContract, DBTariffLine, DBInspector, DBInspection, DBNCR, DBInvoice
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

/**
 * 🎭 Mock Database Implementation
 * 
 * برای فاز Prototype - از mockData به عنوان seed data استفاده می‌کنه
 * داده‌ها در memory هستن و با refresh پاک میشن
 */

// ═══════════════════════════════════════
// 🗄️ In-Memory Storage
// ═══════════════════════════════════════

let mockUsers: DBUser[] = [
  {
    id: 'user_001', username: 'admin', email: 'admin@ics.com',
    fullName: 'Ali Rezai', password: 'admin123', role: 'admin',
    department: 'it', status: 'active', phone: '+98 912 345 6789',
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date().toISOString(),
    customPermissions: [],
  },
  {
    id: 'user_002', username: 'sara.m', email: 'sara.m@ics.com',
    fullName: 'Sara Mohammadi', password: 'password123', role: 'manager',
    department: 'inspections', status: 'active', phone: '+98 912 234 5678',
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date().toISOString(),
    customPermissions: [],
  },
  {
    id: 'user_003', username: 'reza.h', email: 'reza.h@ics.com',
    fullName: 'Reza Hosseini', password: 'password123', role: 'inspector',
    department: 'field', status: 'active', phone: '+98 912 123 4567',
    createdAt: new Date('2024-02-01').toISOString(),
    updatedAt: new Date().toISOString(),
    customPermissions: [],
  },
  {
    id: 'user_004', username: 'maryam.k', email: 'maryam.k@ics.com',
    fullName: 'Maryam Karimi', password: 'password123', role: 'accountant',
    department: 'finance', status: 'active', phone: '+98 912 987 6543',
    createdAt: new Date('2024-02-15').toISOString(),
    updatedAt: new Date().toISOString(),
    customPermissions: [],
  },
  {
    id: 'user_005', username: 'hassan.t', email: 'hassan.t@ics.com',
    fullName: 'Hassan Tehrani', password: 'password123', role: 'viewer',
    department: 'management', status: 'active',
    createdAt: new Date('2024-03-01').toISOString(),
    updatedAt: new Date().toISOString(),
    customPermissions: [],
  },
];

let mockRoles: DBRole[] = [
  { id: 'role_admin', name: 'admin', displayName: 'Administrator', description: 'Full system access', permissions: ['*:*'], isSystem: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'role_manager', name: 'manager', displayName: 'Manager', description: 'Management access', permissions: ['client:*', 'contract:*', 'invoice:read'], isSystem: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'role_inspector', name: 'inspector', displayName: 'Inspector', description: 'Field inspection access', permissions: ['inspection:*', 'client:read', 'contract:read'], isSystem: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'role_accountant', name: 'accountant', displayName: 'Accountant', description: 'Financial access', permissions: ['invoice:*', 'contract:read', 'client:read'], isSystem: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'role_viewer', name: 'viewer', displayName: 'Viewer', description: 'Read-only access', permissions: ['*:read', '*:view_all'], isSystem: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

let mockPermissionMappings: DBPermissionMapping[] = [];
let mockUIElements: DBUIElement[] = [];
let mockSettings: DBSettings[] = [];

// 🎯 Business Data - از mockData seed میشن
let mockClients: DBClient[] = [];
let mockContracts: DBContract[] = [];
let mockTariffLines: DBTariffLine[] = [];
let mockInspectors: DBInspector[] = [];
let mockInspections: DBInspection[] = [];
let mockNCRs: DBNCR[] = [];
let mockInvoices: DBInvoice[] = [];

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
    return newUser;
  }

  async updateUser(id: string, data: Partial<DBUser>): Promise<DBUser> {
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) throw new Error(`User ${id} not found`);
    mockUsers[index] = { ...mockUsers[index], ...data, updatedAt: new Date().toISOString() };
    return mockUsers[index];
  }

  async deleteUser(id: string): Promise<void> {
    mockUsers = mockUsers.filter(u => u.id !== id);
  }

  async getUser(id: string): Promise<DBUser | null> {
    return mockUsers.find(u => u.id === id) || null;
  }

  async getUserByUsername(username: string): Promise<DBUser | null> {
    return mockUsers.find(u => u.username === username) || null;
  }

  async getUserByEmail(email: string): Promise<DBUser | null> {
    return mockUsers.find(u => u.email === email) || null;
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
    return newRole;
  }

  async updateRole(id: string, data: Partial<DBRole>): Promise<DBRole> {
    const index = mockRoles.findIndex(r => r.id === id);
    if (index === -1) throw new Error(`Role ${id} not found`);
    mockRoles[index] = { ...mockRoles[index], ...data, updatedAt: new Date().toISOString() };
    return mockRoles[index];
  }

  async deleteRole(id: string): Promise<void> {
    mockRoles = mockRoles.filter(r => r.id !== id);
  }

  async getRole(id: string): Promise<DBRole | null> {
    return mockRoles.find(r => r.id === id) || null;
  }

  async getRoleByName(name: string): Promise<DBRole | null> {
    return mockRoles.find(r => r.name === name) || null;
  }

  async getAllRoles(): Promise<DBRole[]> {
    return [...mockRoles];
  }

  // ═══════════════════════════════════════
  // 🔐 Permission Mappings
  // ═══════════════════════════════════════

  async setPermissionMapping(permission: string, allowed: string[], denied: string[] = []): Promise<void> {
    const index = mockPermissionMappings.findIndex(m => m.permission === permission);
    const mapping: DBPermissionMapping = {
      permission, allowedElements: allowed, deniedElements: denied,
      updatedAt: new Date().toISOString(),
    };
    if (index !== -1) mockPermissionMappings[index] = mapping;
    else mockPermissionMappings.push(mapping);
  }

  async getPermissionMapping(permission: string): Promise<DBPermissionMapping | null> {
    return mockPermissionMappings.find(m => m.permission === permission) || null;
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
    return newElement;
  }

  async updateUIElement(id: string, data: Partial<DBUIElement>): Promise<DBUIElement> {
    const index = mockUIElements.findIndex(e => e.id === id);
    if (index === -1) throw new Error(`UI Element ${id} not found`);
    mockUIElements[index] = { ...mockUIElements[index], ...data };
    return mockUIElements[index];
  }

  async deleteUIElement(id: string): Promise<void> {
    mockUIElements = mockUIElements.filter(e => e.id !== id);
  }

  async getUIElement(id: string): Promise<DBUIElement | null> {
    return mockUIElements.find(e => e.id === id) || null;
  }

  async getAllUIElements(): Promise<DBUIElement[]> {
    return [...mockUIElements];
  }

  async getUIElementsByModule(module: string): Promise<DBUIElement[]> {
    return mockUIElements.filter(e => e.module === module);
  }

  async getUIElementsByEntity(entity: string): Promise<DBUIElement[]> {
    return mockUIElements.filter(e => e.entity === entity);
  }

  // ═══════════════════════════════════════
  // ⚙️ Settings
  // ═══════════════════════════════════════

  async setSetting(key: string, value: any): Promise<void> {
    const index = mockSettings.findIndex(s => s.key === key);
    const setting: DBSettings = { key, value, updatedAt: new Date().toISOString() };
    if (index !== -1) mockSettings[index] = setting;
    else mockSettings.push(setting);
  }

  async getSetting(key: string): Promise<any> {
    return mockSettings.find(s => s.key === key)?.value ?? null;
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
    return newClient;
  }

  async updateClient(id: string, data: Partial<DBClient>): Promise<DBClient> {
    const index = mockClients.findIndex(c => c.id === id);
    if (index === -1) throw new Error(`Client ${id} not found`);
    mockClients[index] = { ...mockClients[index], ...data, updatedAt: new Date().toISOString() };
    return mockClients[index];
  }

  async deleteClient(id: string): Promise<void> {
    mockClients = mockClients.filter(c => c.id !== id);
  }

  async getClient(id: string): Promise<DBClient | null> {
    return mockClients.find(c => c.id === id) || null;
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
    return newContract;
  }

  async updateContract(id: string, data: Partial<DBContract>): Promise<DBContract> {
    const index = mockContracts.findIndex(c => c.id === id);
    if (index === -1) throw new Error(`Contract ${id} not found`);
    mockContracts[index] = { ...mockContracts[index], ...data, updatedAt: new Date().toISOString() };
    return mockContracts[index];
  }

  async deleteContract(id: string): Promise<void> {
    mockContracts = mockContracts.filter(c => c.id !== id);
  }

  async getContract(id: string): Promise<DBContract | null> {
    return mockContracts.find(c => c.id === id) || null;
  }

  async getAllContracts(): Promise<DBContract[]> {
    return [...mockContracts];
  }

  async getContractsByClient(clientId: string): Promise<DBContract[]> {
    return mockContracts.filter(c => c.client_id === clientId);
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
    return newTariff;
  }

  async updateTariffLine(id: string, data: Partial<DBTariffLine>): Promise<DBTariffLine> {
    const index = mockTariffLines.findIndex(t => t.id === id);
    if (index === -1) throw new Error(`Tariff ${id} not found`);
    mockTariffLines[index] = { ...mockTariffLines[index], ...data, updatedAt: new Date().toISOString() };
    return mockTariffLines[index];
  }

  async deleteTariffLine(id: string): Promise<void> {
    mockTariffLines = mockTariffLines.filter(t => t.id !== id);
  }

  async getTariffLinesByContract(contractId: string): Promise<DBTariffLine[]> {
    return mockTariffLines.filter(t => t.contract_id === contractId);
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
    return newInspector;
  }

  async updateInspector(id: string, data: Partial<DBInspector>): Promise<DBInspector> {
    const index = mockInspectors.findIndex(i => i.id === id);
    if (index === -1) throw new Error(`Inspector ${id} not found`);
    mockInspectors[index] = { ...mockInspectors[index], ...data, updatedAt: new Date().toISOString() };
    return mockInspectors[index];
  }

  async deleteInspector(id: string): Promise<void> {
    mockInspectors = mockInspectors.filter(i => i.id !== id);
  }

  async getInspector(id: string): Promise<DBInspector | null> {
    return mockInspectors.find(i => i.id === id) || null;
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
    return newInspection;
  }

  async updateInspection(id: string, data: Partial<DBInspection>): Promise<DBInspection> {
    const index = mockInspections.findIndex(i => i.id === id);
    if (index === -1) throw new Error(`Inspection ${id} not found`);
    mockInspections[index] = { ...mockInspections[index], ...data, updatedAt: new Date().toISOString() };
    return mockInspections[index];
  }

  async deleteInspection(id: string): Promise<void> {
    mockInspections = mockInspections.filter(i => i.id !== id);
  }

  async getInspection(id: string): Promise<DBInspection | null> {
    return mockInspections.find(i => i.id === id) || null;
  }

  async getAllInspections(): Promise<DBInspection[]> {
    return [...mockInspections];
  }

  async getInspectionsByContract(contractId: string): Promise<DBInspection[]> {
    return mockInspections.filter(i => i.contract_id === contractId);
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
    return newNCR;
  }

  async updateNCR(id: string, data: Partial<DBNCR>): Promise<DBNCR> {
    const index = mockNCRs.findIndex(n => n.id === id);
    if (index === -1) throw new Error(`NCR ${id} not found`);
    mockNCRs[index] = { ...mockNCRs[index], ...data, updatedAt: new Date().toISOString() };
    return mockNCRs[index];
  }

  async deleteNCR(id: string): Promise<void> {
    mockNCRs = mockNCRs.filter(n => n.id !== id);
  }

  async getNCR(id: string): Promise<DBNCR | null> {
    return mockNCRs.find(n => n.id === id) || null;
  }

  async getAllNCRs(): Promise<DBNCR[]> {
    return [...mockNCRs];
  }

  async getNCRsByInspection(inspectionId: string): Promise<DBNCR[]> {
    return mockNCRs.filter(n => n.inspection_id === inspectionId);
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
    return newInvoice;
  }

  async updateInvoice(id: string, data: Partial<DBInvoice>): Promise<DBInvoice> {
    const index = mockInvoices.findIndex(i => i.id === id);
    if (index === -1) throw new Error(`Invoice ${id} not found`);
    mockInvoices[index] = { ...mockInvoices[index], ...data, updatedAt: new Date().toISOString() };
    return mockInvoices[index];
  }

  async deleteInvoice(id: string): Promise<void> {
    mockInvoices = mockInvoices.filter(i => i.id !== id);
  }

  async getInvoice(id: string): Promise<DBInvoice | null> {
    return mockInvoices.find(i => i.id === id) || null;
  }

  async getAllInvoices(): Promise<DBInvoice[]> {
    return [...mockInvoices];
  }

  async getInvoicesByInspection(inspectionId: string): Promise<DBInvoice[]> {
    return mockInvoices.filter(i => i.inspection_id === inspectionId);
  }

  // ═══════════════════════════════════════
  // 🔄 Bulk Operations
  // ═══════════════════════════════════════

  async initialize(): Promise<void> {
    // 🎯 Seed از mockData
    mockClients = seedClients.map(c => ({
      ...c,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })) as DBClient[];

    mockContracts = seedContracts.map(c => ({
      ...c,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })) as DBContract[];

    mockTariffLines = seedTariffs.map(t => ({
      ...t,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })) as DBTariffLine[];

    mockInspectors = seedInspectors.map(i => ({
      ...i,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })) as DBInspector[];

    mockInspections = seedInspections.map(i => ({
      ...i,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })) as DBInspection[];

    mockNCRs = seedNCRs.map(n => ({
      ...n,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })) as DBNCR[];

    mockInvoices = seedInvoices.map(i => ({
      ...i,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })) as DBInvoice[];

    console.log('[MockDatabase] ✅ Initialized with seed data:');
    console.log(`  - ${mockClients.length} clients`);
    console.log(`  - ${mockContracts.length} contracts`);
    console.log(`  - ${mockTariffLines.length} tariff lines`);
    console.log(`  - ${mockInspectors.length} inspectors`);
    console.log(`  - ${mockInspections.length} inspections`);
    console.log(`  - ${mockNCRs.length} NCRs`);
    console.log(`  - ${mockInvoices.length} invoices`);
    console.log(`  - ${mockUsers.length} users`);
    console.log(`  - ${mockRoles.length} roles`);
  }

  async reset(): Promise<void> {
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
    await this.initialize();
  }

  async isInitialized(): Promise<boolean> {
    return mockClients.length > 0;
  }
}