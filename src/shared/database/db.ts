// src/shared/database/db.ts

import { MockDatabase } from './MockDatabase';
import type { DatabaseService } from './DatabaseService';

class DatabaseSingleton {
  private instance: DatabaseService | null = null;
  private initialized = false;

  getInstance(): DatabaseService {
    if (!this.instance) {
      this.instance = new MockDatabase();
    }
    return this.instance;
  }

  async initialize(): Promise<DatabaseService> {
    const db = this.getInstance();
    if (!this.initialized) {
      await db.initialize();
      this.initialized = true;
    }
    return db;
  }

  isReady(): boolean {
    return this.initialized;
  }
}

export const database = new DatabaseSingleton();

export async function getDB(): Promise<DatabaseService> {
  return database.initialize();
}

export function getDBSync(): DatabaseService | null {
  if (!database.isReady()) {
    console.warn('[getDBSync] ❌ Database not initialized yet');
    return null;
  }
  
  return database.getInstance();
}