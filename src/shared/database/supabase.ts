// src/shared/database/supabase.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ═══════════════════════════════════════
// 🎯 Helper Types
// ═══════════════════════════════════════

export type DBUser = {
  id: string;
  username: string;
  email: string;
  full_name: string;
  password: string;
  role: string;
  department: string | null;
  status: string;
  custom_permissions: string[];
  created_at: string;
  updated_at: string;
};

export type DBClient = {
  id: string;
  name_en: string;
  name_fa: string | null;
  type: string;
  national_id: string | null;
  registration_no: string | null;
  economic_code: string | null;
  abbreviated_name: string | null;
  phone: string | null;
  email: string | null;
  emails: string[];
  departments: string[];
  contact_persons: any[];
  logo_color: string | null;
  created_at: string;
  updated_at: string;
};

export type DBContract = {
  id: string;
  client_id: string;
  contract_no: string | null;
  contract_title: string | null;
  type: string;
  status: string;
  total_value: number;
  currency: string;
  start_date: string | null;
  end_date: string | null;
  tariffs: number;
  created_at: string;
  updated_at: string;
};