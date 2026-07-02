// src/shared/database/index.ts

export * from './types';
export * from './DatabaseService';
export { IDBDatabase, db } from './IDBDatabase';  // ✅ حالا exported هست
export { MockDatabase } from './MockDatabase';
export { dbProvider, getDB, type DatabaseType } from './DatabaseProvider';