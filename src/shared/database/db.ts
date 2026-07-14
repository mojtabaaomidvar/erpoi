// src/shared/database/db.ts

import { supabase } from "./supabase";
import { dbProvider } from "./DatabaseProvider";

class DatabaseSingleton {
  private initialized = false;

  async initialize() {
    if (!this.initialized) {
      await dbProvider.getDatabase();
      this.initialized = true;
    }
    return supabase;
  }

  isReady(): boolean {
    return dbProvider.isReady();
  }

  getSupabase() {
    return supabase;
  }
}

export const database = new DatabaseSingleton();

export async function getDB() {
  return database.initialize();
}

export function getDBSync() {
  if (!database.isReady()) {
    console.warn("[getDBSync] ❌ Database not initialized yet");
    return null;
  }

  return supabase;
}

// 🔧 NEW: دسترسی مستقیم به Supabase
export { supabase };
