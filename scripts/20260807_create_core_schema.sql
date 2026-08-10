-- =============================================================================
-- Migration: Create core schema and core tables (idempotent)
-- Generated: 2026-08-07
-- Safe to run multiple times; attempts to create schemas/tables/columns only if missing.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'core') THEN
    EXECUTE 'CREATE SCHEMA core';
  END IF;
END $$;

-- Departments
CREATE TABLE IF NOT EXISTS core.departments (
  id text PRIMARY KEY
);
ALTER TABLE core.departments ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE core.departments ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE core.departments ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE core.departments ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- Notifications
CREATE TABLE IF NOT EXISTS core.notifications (
  id text PRIMARY KEY
);
ALTER TABLE core.notifications ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE core.notifications ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE core.notifications ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE core.notifications ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE core.notifications ADD COLUMN IF NOT EXISTS action_url text;
ALTER TABLE core.notifications ADD COLUMN IF NOT EXISTS metadata jsonb;
ALTER TABLE core.notifications ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;
ALTER TABLE core.notifications ADD COLUMN IF NOT EXISTS timestamp timestamptz DEFAULT now();
ALTER TABLE core.notifications ADD COLUMN IF NOT EXISTS created_by text;
ALTER TABLE core.notifications ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- Permission mappings
CREATE TABLE IF NOT EXISTS core.permission_mappings (
  id text PRIMARY KEY
);
ALTER TABLE core.permission_mappings ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE core.permission_mappings ADD COLUMN IF NOT EXISTS permission text;
ALTER TABLE core.permission_mappings ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Roles
CREATE TABLE IF NOT EXISTS core.roles (
  id text PRIMARY KEY
);
ALTER TABLE core.roles ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE core.roles ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE core.roles ADD COLUMN IF NOT EXISTS permissions text[];

-- Users
CREATE TABLE IF NOT EXISTS core.users (
  id text PRIMARY KEY
);
ALTER TABLE core.users ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE core.users ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE core.users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE core.users ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE core.users ADD COLUMN IF NOT EXISTS role_id text;
ALTER TABLE core.users ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE core.users ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE core.users ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_core_notifications_timestamp ON core.notifications (timestamp);
CREATE INDEX IF NOT EXISTS idx_core_users_email ON core.users (email);

-- Foreign key examples (guarded to avoid errors if related tables do not exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'core' AND table_name = 'users')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'core' AND table_name = 'roles')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_id_fkey')
  THEN
    ALTER TABLE core.users
      ADD CONSTRAINT users_role_id_fkey
      FOREIGN KEY (role_id)
      REFERENCES core.roles (id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Verification examples:
-- SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema = 'core';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'core' AND table_name = 'users';
