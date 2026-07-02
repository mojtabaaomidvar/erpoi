// src/shared/database/DatabaseProvider.ts

import type { DatabaseService } from './DatabaseService';
import { IDBDatabase } from './IDBDatabase';
import { MockDatabase } from './MockDatabase';

export type DatabaseType = 'mock' | 'indexeddb' | 'api' | 'hybrid';

const getDatabaseType = (): DatabaseType => {
  // 🔧 از environment variable بخون
  const envDb = (import.meta as any).env?.VITE_DATABASE_TYPE as DatabaseType;
  
  if (envDb && ['mock', 'indexeddb', 'api', 'hybrid'].includes(envDb)) {
    return envDb;
  }
  
  // Default: mock برای prototype
  return 'mock';
};

class DatabaseProvider {
  private static instance: DatabaseProvider;
  private database: DatabaseService | null = null;
  private databaseType: DatabaseType = 'mock';
  private initPromise: Promise<DatabaseService> | null = null;

  private constructor() {
    this.databaseType = getDatabaseType();
  }

  static getInstance(): DatabaseProvider {
    if (!DatabaseProvider.instance) {
      DatabaseProvider.instance = new DatabaseProvider();
    }
    return DatabaseProvider.instance;
  }

  async getDatabase(): Promise<DatabaseService> {
    if (this.database) return this.database;
    
    // 🎯 جلوگیری از multiple initialization
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.initializeDatabase();
    return this.initPromise;
  }


	private async initializeDatabase(): Promise<DatabaseService> {
	  console.log(`[DatabaseProvider] Initializing ${this.databaseType} database...`);

	  switch (this.databaseType) {
		case 'mock':
		  this.database = new MockDatabase();
		  break;
		
		case 'indexeddb':
		  this.database = new IDBDatabase() as unknown as DatabaseService;  // 🔧 FIX: cast
		  break;
		
		case 'api':
		  throw new Error('API Database not implemented yet. Use "mock" or "indexeddb".');
		
		case 'hybrid':
		  throw new Error('Hybrid Database not implemented yet. Use "mock" or "indexeddb".');
		
		default:
		  this.database = new MockDatabase();
	  }

	  // 🔧 FIX: null check
	  if (!this.database) {
		throw new Error('Failed to initialize database');
	  }

	  await this.database.initialize();
	  
	  console.log(`[DatabaseProvider] ✅ ${this.databaseType} database ready`);
	  
	  return this.database;
	}

  getDatabaseType(): DatabaseType {
    return this.databaseType;
  }

  // 🔄 Switch database type (برای تست)
  async switchDatabase(type: DatabaseType): Promise<void> {
    console.log(`[DatabaseProvider] Switching from ${this.databaseType} to ${type}`);
    this.databaseType = type;
    this.database = null;
    this.initPromise = null;
    await this.getDatabase();
  }
}

export const dbProvider = DatabaseProvider.getInstance();

// 🔧 Helper function برای استفاده آسان
export const getDB = async (): Promise<DatabaseService> => {
  return await dbProvider.getDatabase();
};