// src/shared/database/DatabaseProvider.ts

import { supabase } from "./supabase";

export type DatabaseType = "supabase";

class DatabaseProvider {
  private static instance: DatabaseProvider;
  private initialized = false;

  private constructor() {}

  static getInstance(): DatabaseProvider {
    if (!DatabaseProvider.instance) {
      DatabaseProvider.instance = new DatabaseProvider();
    }
    return DatabaseProvider.instance;
  }

  async getDatabase() {
    if (!this.initialized) {
      await this.initializeDatabase();
    }
    return supabase;
  }

  private async initializeDatabase(): Promise<void> {
    console.log("[DatabaseProvider] Initializing Supabase connection...");

    // 🔧 تست اتصال به Supabase
    const { error } = await supabase
      .schema("crm")
      .from("clients")
      .select("id")
      .limit(1);

    if (error) {
      console.error(
        "[DatabaseProvider] ❌ Failed to connect to Supabase:",
        error,
      );
      throw new Error(`Supabase connection failed: ${error.message}`);
    }

    this.initialized = true;
    console.log("[DatabaseProvider] ✅ Supabase database ready");
  }

  getDatabaseType(): DatabaseType {
    return "supabase";
  }

  isReady(): boolean {
    return this.initialized;
  }
}

export const dbProvider = DatabaseProvider.getInstance();

// 🔧 Helper function برای استفاده آسان
export const getDB = async () => {
  return await dbProvider.getDatabase();
};
