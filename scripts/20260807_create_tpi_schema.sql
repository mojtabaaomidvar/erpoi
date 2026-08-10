-- =============================================================================
-- Migration: Create tpi schema and related tables (idempotent)
-- Generated: 2026-08-07
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'tpi') THEN
    EXECUTE 'CREATE SCHEMA tpi';
  END IF;
END $$;

-- TPI requests
CREATE TABLE IF NOT EXISTS tpi.tpi_requests (
  id text PRIMARY KEY
);
ALTER TABLE tpi.tpi_requests ADD COLUMN IF NOT EXISTS project_id text;
ALTER TABLE tpi.tpi_requests ADD COLUMN IF NOT EXISTS client_id text;
ALTER TABLE tpi.tpi_requests ADD COLUMN IF NOT EXISTS contract_id text;
ALTER TABLE tpi.tpi_requests ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE tpi.tpi_requests ADD COLUMN IF NOT EXISTS tpi_mode text;
ALTER TABLE tpi.tpi_requests ADD COLUMN IF NOT EXISTS disciplines text[];
ALTER TABLE tpi.tpi_requests ADD COLUMN IF NOT EXISTS methods text[];
ALTER TABLE tpi.tpi_requests ADD COLUMN IF NOT EXISTS inspection_date date;
ALTER TABLE tpi.tpi_requests ADD COLUMN IF NOT EXISTS requested_by text;
ALTER TABLE tpi.tpi_requests ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE tpi.tpi_requests ADD COLUMN IF NOT EXISTS priority integer;
ALTER TABLE tpi.tpi_requests ADD COLUMN IF NOT EXISTS stages text[];
ALTER TABLE tpi.tpi_requests ADD COLUMN IF NOT EXISTS equipment_type_id text;
ALTER TABLE tpi.tpi_requests ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- TPI inspection items
CREATE TABLE IF NOT EXISTS tpi.tpi_inspection_items (
  id text PRIMARY KEY
);
ALTER TABLE tpi.tpi_inspection_items ADD COLUMN IF NOT EXISTS tpi_request_id text;
ALTER TABLE tpi.tpi_inspection_items ADD COLUMN IF NOT EXISTS item_name text;
ALTER TABLE tpi.tpi_inspection_items ADD COLUMN IF NOT EXISTS tag_number text;
ALTER TABLE tpi.tpi_inspection_items ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE tpi.tpi_inspection_items ADD COLUMN IF NOT EXISTS quantity numeric;
ALTER TABLE tpi.tpi_inspection_items ADD COLUMN IF NOT EXISTS unit text;
ALTER TABLE tpi.tpi_inspection_items ADD COLUMN IF NOT EXISTS manufacturer text;
ALTER TABLE tpi.tpi_inspection_items ADD COLUMN IF NOT EXISTS model text;
ALTER TABLE tpi.tpi_inspection_items ADD COLUMN IF NOT EXISTS serial_number text;
ALTER TABLE tpi.tpi_inspection_items ADD COLUMN IF NOT EXISTS source_type text;
ALTER TABLE tpi.tpi_inspection_items ADD COLUMN IF NOT EXISTS source_file_url text;
ALTER TABLE tpi.tpi_inspection_items ADD COLUMN IF NOT EXISTS source_file_name text;

-- TPI inspector assignments
CREATE TABLE IF NOT EXISTS tpi.tpi_inspector_assignments (
  id text PRIMARY KEY
);
ALTER TABLE tpi.tpi_inspector_assignments ADD COLUMN IF NOT EXISTS tpi_request_id text;
ALTER TABLE tpi.tpi_inspector_assignments ADD COLUMN IF NOT EXISTS session_id text;
ALTER TABLE tpi.tpi_inspector_assignments ADD COLUMN IF NOT EXISTS inspector_id text;
ALTER TABLE tpi.tpi_inspector_assignments ADD COLUMN IF NOT EXISTS assigned_by text;
ALTER TABLE tpi.tpi_inspector_assignments ADD COLUMN IF NOT EXISTS assigned_at timestamptz;
ALTER TABLE tpi.tpi_inspector_assignments ADD COLUMN IF NOT EXISTS execution_date date;
ALTER TABLE tpi.tpi_inspector_assignments ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE tpi.tpi_inspector_assignments ADD COLUMN IF NOT EXISTS vendor_site text;
ALTER TABLE tpi.tpi_inspector_assignments ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE tpi.tpi_inspector_assignments ADD COLUMN IF NOT EXISTS actual_start_time timestamptz;
ALTER TABLE tpi.tpi_inspector_assignments ADD COLUMN IF NOT EXISTS actual_end_time timestamptz;
ALTER TABLE tpi.tpi_inspector_assignments ADD COLUMN IF NOT EXISTS weather_conditions text;
ALTER TABLE tpi.tpi_inspector_assignments ADD COLUMN IF NOT EXISTS general_remarks text;
ALTER TABLE tpi.tpi_inspector_assignments ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
ALTER TABLE tpi.tpi_inspector_assignments ADD COLUMN IF NOT EXISTS cancelled_by text;
ALTER TABLE tpi.tpi_inspector_assignments ADD COLUMN IF NOT EXISTS cancellation_reason text;
ALTER TABLE tpi.tpi_inspector_assignments ADD COLUMN IF NOT EXISTS cancellation_notes text;
ALTER TABLE tpi.tpi_inspector_assignments ADD COLUMN IF NOT EXISTS related_assignment_id text;
ALTER TABLE tpi.tpi_inspector_assignments ADD COLUMN IF NOT EXISTS new_scheduled_date date;
ALTER TABLE tpi.tpi_inspector_assignments ADD COLUMN IF NOT EXISTS date_is_unknown boolean DEFAULT false;
ALTER TABLE tpi.tpi_inspector_assignments ADD COLUMN IF NOT EXISTS new_scope text[];
ALTER TABLE tpi.tpi_inspector_assignments ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tpi_requests_project ON tpi.tpi_requests (project_id);
