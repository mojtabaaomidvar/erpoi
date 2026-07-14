// src/shared/database/index.ts

export * from "./types";

export { supabase } from "./supabase";
export { database, getDB, getDBSync } from "./db";
export { dbProvider } from "./DatabaseProvider";
