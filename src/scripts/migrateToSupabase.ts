// src/scripts/migrateToSupabase.ts

import { supabase } from "@shared/database/supabase";
import {
  clients as mockClients,
  contracts as mockContracts,
  contractTariffs as mockTariffs,
} from "@data/mockData";

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function clearTable(tableName: string): Promise<void> {
  try {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .neq("created_at", "1970-01-01");

    if (error) {
      if (tableName === "permission_mappings") {
        await supabase.from(tableName).delete().neq("permission", "is.null");
        console.log(`✅ Cleared ${tableName}`);
      } else {
        console.warn(`⚠️ Could not clear ${tableName}:`, error.message);
      }
    } else {
      console.log(`✅ Cleared ${tableName}`);
    }
  } catch (e: any) {
    console.warn(`⚠️ Error clearing ${tableName}: ${e.message}`);
  }
}

async function clearExistingData(): Promise<void> {
  console.log("🧹 Clearing existing data...");

  const tables = [
    "tariff_lines",
    "contracts",
    "clients",
    "permission_mappings",
    "users",
    "roles",
    "departments",
  ];

  for (const table of tables) {
    await clearTable(table);
  }
}

async function seedDepartments(): Promise<void> {
  console.log("🏢 Seeding departments...");

  const departments = [
    { id: "it", name: "IT Department", description: "Information Technology" },
    {
      id: "oi",
      name: "Offshore & Inspection",
      description: "Offshore and Inspection",
    },
    { id: "hr", name: "Human Resources", description: "HR Department" },
    { id: "finance", name: "Finance", description: "Finance Department" },
  ];

  const { error } = await supabase.from('core.departments').insert(departments);
  if (error) {
    console.error("❌ Failed to seed departments:", error);
  } else {
    console.log(`✅ Seeded ${departments.length} departments`);
  }
}

async function seedRoles(): Promise<void> {
  console.log("👑 Seeding roles (Batch Permissions)...");

  const roles = [
    {
      id: "role_admin",
      name: "admin",
      display_name: "Administrator",
      description: "Full system access",
      permissions: ["*:*"],
      is_system: true,
    },
    {
      id: "role_manager",
      name: "manager",
      display_name: "Manager",
      description: "Department manager with client and contract access",
      permissions: [
        "client:read",
        "client:view_own",
        "client:create",
        "client:update",
        "contract:read",
        "contract:view_own",
      ],
      is_system: false,
    },
    {
      id: "role_viewer",
      name: "viewer",
      display_name: "Viewer",
      description: "Read-only access to clients",
      permissions: ["client:read", "client:view_own"],
      is_system: false,
    },
    {
      id: "role_inspector",
      name: "inspector",
      display_name: "Inspector",
      description: "Inspector with limited access",
      permissions: [
        "client:read",
        "client:view_own",
        "contract:read",
        "contract:view_own",
      ],
      is_system: false,
    },
  ];

  const { error } = await supabase.from('core.roles').insert(roles);
  if (error) {
    console.error("❌ Failed to seed roles:", error);
  } else {
    console.log(`✅ Seeded ${roles.length} roles`);
  }
}

async function seedUsers(): Promise<void> {
  console.log("👤 Seeding users...");

  const usersJson = localStorage.getItem("ics_db_users");
  let users: any[] = [];

  if (usersJson) {
    try {
      users = JSON.parse(usersJson);
      console.log(`📦 Found ${users.length} users in localStorage`);
    } catch (e) {
      console.error("❌ Failed to parse users:", e);
    }
  }

  if (users.length === 0) {
    users = [
      {
        id: "user_001",
        username: "admin",
        email: "admin@ics.com",
        fullName: "Administrator",
        password: "admin123",
        role: "admin",
        department: "it",
        status: "active",
        customPermissions: [],
      },
    ];
    console.log("📦 Using default admin user");
  }

  const formattedUsers = users.map((u) => ({
    id: u.id || generateId("user"),
    username: u.username,
    email: u.email,
    full_name: u.fullName || u.full_name || u.username,
    password: u.password || "",
    role: u.role || "viewer",
    department: u.department || null,
    status: u.status || "active",
    custom_permissions: u.customPermissions || u.custom_permissions || [],
  }));

  const { error } = await supabase.from('core.users').insert(formattedUsers);
  if (error) {
    console.error("❌ Failed to seed users:", error);
  } else {
    console.log(`✅ Seeded ${formattedUsers.length} users`);
  }
}

async function seedClients(): Promise<void> {
  console.log("🏢 Seeding clients...");

  const clientsJson = localStorage.getItem("ics_db_clients");
  let clients: any[] = [];

  if (clientsJson) {
    try {
      clients = JSON.parse(clientsJson);
      console.log(`📦 Found ${clients.length} clients in localStorage`);
    } catch (e) {
      console.error("❌ Failed to parse clients:", e);
    }
  }

  if (
    clients.length === 0 &&
    Array.isArray(mockClients) &&
    mockClients.length > 0
  ) {
    clients = [...mockClients];
    console.log(`📦 Using ${clients.length} clients from mockData`);
  }

  if (!Array.isArray(clients)) {
    console.error("❌ clients is not an array");
    clients = [];
  }

  const formattedClients = clients.map((c) => ({
    id: c.id || generateId("c"),
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

  if (formattedClients.length === 0) {
    console.log("⚠️ No clients to seed");
    return;
  }

  const { error } = await supabase.from('crm.clients').insert(formattedClients);
  if (error) {
    console.error("❌ Failed to seed clients:", error);
  } else {
    console.log(`✅ Seeded ${formattedClients.length} clients`);
  }
}

async function seedContracts(): Promise<void> {
  console.log("📄 Seeding contracts...");

  const contractsJson = localStorage.getItem("ics_db_contracts");
  let contracts: any[] = [];

  if (contractsJson) {
    try {
      contracts = JSON.parse(contractsJson);
      console.log(`📦 Found ${contracts.length} contracts in localStorage`);
    } catch (e) {
      console.error("❌ Failed to parse contracts:", e);
    }
  }

  if (
    contracts.length === 0 &&
    Array.isArray(mockContracts) &&
    mockContracts.length > 0
  ) {
    contracts = [...mockContracts];
    console.log(`📦 Using ${contracts.length} contracts from mockData`);
  }

  if (!Array.isArray(contracts)) {
    console.error("❌ contracts is not an array");
    contracts = [];
  }

  const formattedContracts = contracts.map((c) => ({
    id: c.id || generateId("ct"),
    client_id: c.client_id,
    contract_no: c.contract_no || null,
    contract_title: c.contract_title || null,
    type: c.type,
    status: c.status,
    total_value: c.total_value || 0,
    currency: c.currency || "IRR",
    start_date: c.start_date || null,
    end_date: c.end_date || null,
    tariffs: c.tariffs || 0,
  }));

  if (formattedContracts.length === 0) {
    console.log("⚠️ No contracts to seed");
    return;
  }

  const { error } = await supabase.from('contracts.contracts').insert(formattedContracts);
  if (error) {
    console.error("❌ Failed to seed contracts:", error);
  } else {
    console.log(`✅ Seeded ${formattedContracts.length} contracts`);
  }
}

async function seedTariffLines(): Promise<void> {
  console.log("💰 Seeding tariff lines...");

  const tariffsJson = localStorage.getItem("ics_db_tariffLines");
  let tariffs: any[] = [];

  if (tariffsJson) {
    try {
      tariffs = JSON.parse(tariffsJson);
      console.log(`📦 Found ${tariffs.length} tariff lines in localStorage`);
    } catch (e) {
      console.error("❌ Failed to parse tariffs:", e);
    }
  }

  if (
    tariffs.length === 0 &&
    Array.isArray(mockTariffs) &&
    mockTariffs.length > 0
  ) {
    tariffs = [...mockTariffs];
    console.log(`📦 Using ${tariffs.length} tariff lines from mockData`);
  }

  if (!Array.isArray(tariffs)) {
    console.error("❌ tariffs is not an array");
    tariffs = [];
  }

  const formattedTariffs = tariffs.map((t) => ({
    id: t.id || generateId("t"),
    contract_id: t.contract_id,
    description: t.description || null,
    unit: t.unit || null,
    rate: t.rate || 0,
    consumed_quantity: t.consumed_quantity || 0,
    invoiced: t.invoiced || 0,
  }));

  if (formattedTariffs.length === 0) {
    console.log("⚠️ No tariff lines to seed");
    return;
  }

  const { error } = await supabase
    .from('contracts.tariff_lines')
    .insert(formattedTariffs);
  if (error) {
    console.error("❌ Failed to seed tariff lines:", error);
  } else {
    console.log(`✅ Seeded ${formattedTariffs.length} tariff lines`);
  }
}

async function seedPermissionMappings(): Promise<void> {
  console.log("🔐 Seeding permission mappings...");

  const mappings = [
    {
      permission: "client:read",
      allowed_elements: [
        "client_list_item_view",
        "client_list_item_click",
        "client_search_box",
        "client_sort_select",
        "client_filter_type",
        "client_stat_agreements",
        "client_agreements_section",
        "client_agreements_tabs",
        "client_contract_item",
        "client_contract_dates",
      ],
    },
    {
      permission: "client:create",
      allowed_elements: [
        "client_btn_add",
        "client_emails_dropdown",
        "client_contacts_dropdown",
      ],
    },
    {
      permission: "client:update",
      allowed_elements: [
        "client_btn_edit",
        "client_emails_dropdown",
        "client_contacts_dropdown",
      ],
    },
    {
      permission: "client:delete",
      allowed_elements: ["client_btn_delete"],
    },
    {
      permission: "client:export",
      allowed_elements: ["client_btn_export"],
    },
    {
      permission: "client:view_all",
      allowed_elements: [
        "client_list_item_view",
        "client_list_item_click",
        "client_search_box",
        "client_sort_select",
        "client_filter_type",
        "client_stat_agreements",
        "client_agreements_section",
        "client_agreements_tabs",
        "client_contract_item",
        "client_contract_dates",
        "client_total_agreement_badge",
      ],
    },
    {
      permission: "client:view_own",
      allowed_elements: [
        "client_list_item_view",
        "client_list_item_click",
        "client_search_box",
        "client_sort_select",
        "client_filter_type",
        "client_stat_agreements",
        "client_agreements_section",
        "client_agreements_tabs",
        "client_contract_item",
        "client_contract_dates",
      ],
    },
    {
      permission: "contract:read",
      allowed_elements: [
        "client_contract_value",
        "client_contract_progress_work",
        "client_contract_progress_invoice",
        "client_time_remaining",
        "client_tariffs_section",
        "client_tariffs_table",
        "client_tariffs_financial",
        "client_tariffs_totals",
        "client_agreement_value",
        "client_agreement_progress_work",
        "client_agreement_progress_invoice",
        "client_stat_value_agreements",
        "client_stat_invoiced",
        "client_stat_uninvoiced",
        "client_total_agreement_badge",
      ],
    },
    {
      permission: "contract:view_all",
      allowed_elements: [
        "client_contract_value",
        "client_contract_progress_work",
        "client_contract_progress_invoice",
        "client_time_remaining",
        "client_tariffs_section",
        "client_tariffs_table",
        "client_tariffs_financial",
        "client_tariffs_totals",
      ],
    },
    {
      permission: "contract:view_own",
      allowed_elements: [
        "client_contract_value",
        "client_contract_progress_work",
        "client_contract_progress_invoice",
        "client_time_remaining",
        "client_tariffs_section",
        "client_tariffs_table",
        "client_tariffs_financial",
        "client_tariffs_totals",
      ],
    },
  ];

  const { error } = await supabase.from('core.permission_mappings').insert(mappings);
  if (error) {
    console.error("❌ Failed to seed permission mappings:", error);
  } else {
    console.log(`✅ Seeded ${mappings.length} permission mappings`);
  }
}

export async function runMigration(): Promise<void> {
  console.log("🚀 Starting migration to Supabase...");
  console.log("⚠️  This will CLEAR all existing data in Supabase!");

  const confirmed = confirm("Are you sure you want to proceed?");
  if (!confirmed) {
    console.log("❌ Migration cancelled");
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
    console.log("🎉 All data has been transferred to Supabase!");

    alert("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    alert("❌ Migration failed! Check console.");
  }
}

export async function testSupabaseConnection(): Promise<boolean> {
  console.log("🔍 Testing Supabase connection...");

  const { data, error } = await supabase.from('core.users').select("count").limit(1);

  if (error) {
    console.error("❌ Connection failed:", error);
    return false;
  }

  console.log("✅ Connection successful");
  return true;
}

if (typeof window !== "undefined") {
  (window as any).migrateToSupabase = runMigration;
  (window as any).testSupabase = testSupabaseConnection;

  console.log("🔧 Migration tools available:");
  console.log("  - window.migrateToSupabase() - Run migration");
  console.log("  - window.testSupabase() - Test connection");
}
