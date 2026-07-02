// src/config/views.ts

import type { ViewKey } from '@widgets/layout/Sidebar';

export interface ViewMeta {
  title: string;
  subtitle: string;
}

export const views: Record<ViewKey, ViewMeta> = {
  dashboard: { title: "Operations Dashboard", subtitle: "Live overview of inspections, revenue, and inspector workload" },
  clients: { title: "Client Registry", subtitle: "Legal entities and individuals under management" },
  contracts: { title: "Contracts & Tariffs", subtitle: "Master service agreements and work orders" },
  inspectors: { title: "Inspector Roster", subtitle: "Certified engineers, specialties, and availability" },
  inspections: { title: "Inspection Workflow", subtitle: "5-step pipeline from request to completion" },
  billing: { title: "Billing & Invoices", subtitle: "Financial records tied to completed inspections" },
  reports: { title: "Reports & Analytics", subtitle: "Performance, quality, and financial intelligence" },
  audit: { title: "Audit Log", subtitle: "System activity tracking and compliance records" },
  settings: { title: "Settings", subtitle: "Application preferences and configuration" },
  'user-management': { title: "User Management", subtitle: "Manage users, roles, departments, and permissions" },
};