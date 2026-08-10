-- =============================================================================
-- Migration: Create equipment schema and related tables (idempotent)
-- Generated: 2026-08-07
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'equipment') THEN
    EXECUTE 'CREATE SCHEMA equipment';
  END IF;
END $$;

-- Equipment
CREATE TABLE IF NOT EXISTS equipment.equipment (
  id text PRIMARY KEY
);
ALTER TABLE equipment.equipment ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE equipment.equipment ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE equipment.equipment ADD COLUMN IF NOT EXISTS level integer;
ALTER TABLE equipment.equipment ADD COLUMN IF NOT EXISTS parent_id text;
ALTER TABLE equipment.equipment ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE equipment.equipment ADD COLUMN IF NOT EXISTS discipline text;
ALTER TABLE equipment.equipment ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Checklist templates
CREATE TABLE IF NOT EXISTS equipment.checklist_templates (
  id text PRIMARY KEY
);
ALTER TABLE equipment.checklist_templates ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE equipment.checklist_templates ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE equipment.checklist_templates ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Checklist items
CREATE TABLE IF NOT EXISTS equipment.checklist (
  id text PRIMARY KEY
);
ALTER TABLE equipment.checklist ADD COLUMN IF NOT EXISTS equipment_id text;
ALTER TABLE equipment.checklist ADD COLUMN IF NOT EXISTS template_id text;
ALTER TABLE equipment.checklist ADD COLUMN IF NOT EXISTS inspection_method text;
ALTER TABLE equipment.checklist ADD COLUMN IF NOT EXISTS sequence integer;
ALTER TABLE equipment.checklist ADD COLUMN IF NOT EXISTS checklist_text text;
ALTER TABLE equipment.checklist ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_equipment_checklist_equipment_id ON equipment.checklist (equipment_id);
