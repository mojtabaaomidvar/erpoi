// src/shared/database/index.ts

export * from './types';
export * from './DatabaseService';
export { MockDatabase } from './MockDatabase';
export { database, getDB, getDBSync } from './db';