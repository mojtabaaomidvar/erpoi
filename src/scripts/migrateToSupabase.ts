// src/scripts/migrateToSupabase.ts

import { supabase } from '@shared/database/supabase';
import {
  clients as mockClients,
  contracts as mockContracts,
  contractTariffs as mockTariffs,
} from '@data/mockData';

// ═══════════════════════════════════════
// 🎯 Helper Functions
// ═══════════════════════════════════════

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function clearTable(tableName: string): Promise<void> {
  const { error } = await supabase.from(tableName).delete().neq('created_at', '1970-01-01');
  if (error) {
    console.error(`❌ Failed to clear ${tableName}:`, error);
  } else {
    console.log(`✅ Cleared ${tableName}`);
  }
}

async function clearExistingData(): Promise<void> {
  console.log('🧹 Clearing existing data...');
  
  const tables = [
    'invoices', 'ncrs', 'inspections', 'tariff_lines', 'contracts', 'clients',
    'inspectors', 'permission_mappings', 'roles', 'users', 'departments', 'settings'
  ];

  for (const table of tables) {
    await clearTable(table);
  }
}

// ═══════════════════════════════════════
// 🌱 Seed Functions
// ═══════════════════════════════════════

async function seedDepartments(): Promise<void> {
  console.log('🏢 Seeding departments...');
  
  const departments = [
    { id: 'it', name: 'IT Department', description: 'Information Technology' },
    { id: 'oi', name: 'Offshore & Inspection', description: 'Offshore and Inspection Department' },
    { id: 'hr', name: 'Human Resources', description: 'HR Department' },
    { id: 'finance', name: 'Finance', description: 'Finance Department' },
  ];

  const { error } = await supabase.from('departments').insert(departments);
  if (error) {
    console.error('❌ Failed to seed departments:', error);
  } else {
    console.log(`✅ Seeded ${departments.length} departments`);
  }
}

async function seedRoles(): Promise<void> {
  console.log('👑 Seeding roles...');
  
  const roles = [
    {
      id: 'role_admin',
      name: 'admin',
      display_name: 'Administrator',
      description: 'Full system access - cannot be deleted',
      permissions: ['*:*'],
      is_system: true,
    },
    {
      id: 'role_manager',
      name: 'manager',
      display_name: 'Manager',
      description: 'Department manager with limited access',
      permissions: [],
      is_system: false,
    },
    {
      id: 'role_viewer',
      name: 'viewer',
      display_name: 'Viewer',
      description: 'Read-only access',
      permissions: [],
      is_system: false,
    },
  ];

  const { error } = await supabase.from('roles').insert(roles);
  if (error) {
    console.error('❌ Failed to seed roles:', error);
  } else {
    console.log(`✅ Seeded ${roles.length} roles`);
  }
}

async function seedUsers(): Promise<void> {
  console.log('👤 Seeding users...');
  
  const usersJson = localStorage.getItem('ics_db_users');
  let users: any[] = [];
  
  if (usersJson) {
    try {
      users = JSON.parse(usersJson);
      console.log(`📦 Found ${users.length} users in localStorage`);
    } catch (e) {
      console.error('❌ Failed to parse users:', e);
    }
  }

  if (users.length === 0) {
    users = [{
      id: 'user_001',
      username: 'admin',
      email: 'admin@ics.com',
      fullName: 'Administrator',
      password: 'admin123',
      role: 'admin',
      department: 'it',
      status: 'active',
      customPermissions: [],
    }];
    console.log('📦 Using default admin user');
  }

  const formattedUsers = users.map(u => ({
    id: u.id || generateId('user'),
    username: u.username,
    email: u.email,
    full_name: u.fullName || u.full_name || u.username,
    password: u.password || '',
    role: u.role || 'viewer',
    department: u.department || null,
    status: u.status || 'active',
    custom_permissions: u.customPermissions || u.custom_permissions || [],
  }));

  const { error } = await supabase.from('users').insert(formattedUsers);
  if (error) {
    console.error('❌ Failed to seed users:', error);
  } else {
    console.log(`✅ Seeded ${formattedUsers.length} users`);
  }
}

async function seedClients(): Promise<void> {
  console.log('🏢 Seeding clients...');
  
  const clientsJson = localStorage.getItem('ics_db_clients');
  let clients: any[] = [];
  
  if (clientsJson) {
    try {
      clients = JSON.parse(clientsJson);
      console.log(`📦 Found ${clients.length} clients in localStorage`);
    } catch (e) {
      console.error('❌ Failed to parse clients:', e);
    }
  }

  if (clients.length === 0) {
    clients = mockClients;
    console.log(`📦 Using ${clients.length} clients from mockData`);
  }

  const formattedClients = clients.map(c => ({
    id: c.id || generateId('c'),
    name_en: c.name_en,
    name_fa: c.name_fa || null,
    type: c.type,
    national_id: c.national_id || null,
    registration_no: c.registration_no || null,
    economic_code: c.economic_code || null,
    abbreviated_name: c.abbreviated_name || null,
    phone: c.phone || null,
    email: c.email || null,
    emails: c.emails || [],
    departments: c.departments || [],
    contact_persons: c.contactPersons || c.contact_persons || [],
    logo_color: c.logoColor || c.logo_color || null,
  }));

  const { error } = await supabase.from('clients').insert(formattedClients);
  if (error) {
    console.error('❌ Failed to seed clients:', error);
  } else {
    console.log(`✅ Seeded ${formattedClients.length} clients`);
  }
}

async function seedContracts(): Promise<void> {
  console.log('📄 Seeding contracts...');
  
  const contractsJson = localStorage.getItem('ics_db_contracts');
  let contracts: any[] = [];
  
  if (contractsJson) {
    try {
      contracts = JSON.parse(contractsJson);
      console.log(`📦 Found ${contracts.length} contracts in localStorage`);
    } catch (e) {
      console.error('❌ Failed to parse contracts:', e);
    }
  }

  if (contracts.length === 0) {
    contracts = mockContracts;
    console.log(`📦 Using ${contracts.length} contracts from mockData`);
  }

  const formattedContracts = contracts.map(c => ({
    id: c.id || generateId('ct'),
    client_id: c.client_id,
    contract_no: c.contract_no || null,
    contract_title: c.contract_title || null,
    type: c.type,
    status: c.status,
    total_value: c.total_value || 0,
    currency: c.currency || 'IRR',
    start_date: c.start_date || null,
    end_date: c.end_date || null,
    tariffs: c.tariffs || 0,
  }));

  const { error } = await supabase.from('contracts').insert(formattedContracts);
  if (error) {
    console.error('❌ Failed to seed contracts:', error);
  } else {
    console.log(`✅ Seeded ${formattedContracts.length} contracts`);
  }
}

async function seedTariffLines(): Promise<void> {
  console.log('💰 Seeding tariff lines...');
  
  const tariffsJson = localStorage.getItem('ics_db_tariffLines');
  let tariffs: any[] = [];
  
  if (tariffsJson) {
    try {
      tariffs = JSON.parse(tariffsJson);
      console.log(`📦 Found ${tariffs.length} tariff lines in localStorage`);
    } catch (e) {
      console.error('❌ Failed to parse tariffs:', e);
    }
  }

  if (tariffs.length === 0) {
    tariffs = mockTariffs;
    console.log(`📦 Using ${tariffs.length} tariff lines from mockData`);
  }

  const formattedTariffs = tariffs.map(t => ({
    id: t.id || generateId('t'),
    contract_id: t.contract_id,
    description: t.description || null,
    unit: t.unit || null,
    rate: t.rate || 0,
    consumed_quantity: t.consumed_quantity || 0,
    invoiced: t.invoiced || 0,
  }));

  const { error } = await supabase.from('tariff_lines').insert(formattedTariffs);
  if (error) {
    console.error('❌ Failed to seed tariff lines:', error);
  } else {
    console.log(`✅ Seeded ${formattedTariffs.length} tariff lines`);
  }
}

async function seedPermissionMappings(): Promise<void> {
  console.log('🔐 Seeding permission mappings...');
  
  const mappingsJson = localStorage.getItem('ics_db_permissionMappings');
  if (!mappingsJson) {
    console.log('📦 No permission mappings in localStorage, skipping');
    return;
  }

  let mappings: any[] = [];
  try {
    mappings = JSON.parse(mappingsJson);
    console.log(`📦 Found ${mappings.length} permission mappings`);
  } catch (e) {
    console.error('❌ Failed to parse mappings:', e);
    return;
  }

  const formattedMappings = mappings.map(m => ({
    permission: m.permission,
    allowed_elements: m.allowedElements || m.allowed_elements || [],
    denied_elements: m.deniedElements || m.denied_elements || [],
  }));

  const { error } = await supabase.from('permission_mappings').insert(formattedMappings);
  if (error) {
    console.error('❌ Failed to seed permission mappings:', error);
  } else {
    console.log(`✅ Seeded ${formattedMappings.length} permission mappings`);
  }
}

// ═══════════════════════════════════════
// 🚀 Main Migration Function
// ═══════════════════════════════════════

export async function runMigration(): Promise<void> {
  console.log('🚀 Starting migration to Supabase...');
  console.log('⚠️  This will CLEAR all existing data in Supabase!');
  
  const confirmed = confirm('Are you sure you want to proceed? This cannot be undone!');
  if (!confirmed) {
    console.log('❌ Migration cancelled');
    return;
  }

  const startTime = Date.now();

  try {
    await clearExistingData();
    await seedDepartments();
    await seedRoles();
    await seedUsers();
    await seedClients();
    await seedContracts();
    await seedTariffLines();
    await seedPermissionMappings();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Migration completed in ${duration}s`);
    console.log('🎉 All data has been transferred to Supabase!');
    
    alert('✅ Migration completed successfully! Check console for details.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    alert('❌ Migration failed! Check console for details.');
  }
}

// ═══════════════════════════════════════
// 🧪 Test Connection
// ═══════════════════════════════════════

export async function testSupabaseConnection(): Promise<boolean> {
  console.log('🔍 Testing Supabase connection...');
  
  const { data, error } = await supabase.from('users').select('count').limit(1);
  
  if (error) {
    console.error('❌ Connection failed:', error);
    return false;
  }
  
  console.log('✅ Connection successful');
  return true;
}

// ═══════════════════════════════════════
// 📊 Export for Console
// ═══════════════════════════════════════

if (typeof window !== 'undefined') {
  (window as any).migrateToSupabase = runMigration;
  (window as any).testSupabase = testSupabaseConnection;
  
  console.log('🔧 Migration tools available:');
  console.log('  - window.migrateToSupabase() - Run full migration');
  console.log('  - window.testSupabase() - Test connection');
}