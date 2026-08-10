-- =============================================================================
-- Migration: Create projects schema and projects table (idempotent)
-- Generated: 2026-08-07
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'projects') THEN
    EXECUTE 'CREATE SCHEMA projects';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS projects.projects (
  id text PRIMARY KEY
);
ALTER TABLE projects.projects ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE projects.projects ADD COLUMN IF NOT EXISTS contract_id text;
ALTER TABLE projects.projects ADD COLUMN IF NOT EXISTS client_id text;
ALTER TABLE projects.projects ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE projects.projects ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE projects.projects ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE projects.projects ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE projects.projects ADD COLUMN IF NOT EXISTS service_types text[];
ALTER TABLE projects.projects ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE projects.projects ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE projects.projects ADD COLUMN IF NOT EXISTS updated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_projects_name ON projects.projects (name);
