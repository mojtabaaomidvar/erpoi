-- =============================================================================
-- Migration: Create enums and misc helpers (idempotent)
-- Generated: 2026-08-07
-- =============================================================================

-- Helper to create enum type if not exists
CREATE OR REPLACE FUNCTION create_enum_if_not_exists(type_name text, enum_vals text[]) RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = type_name) THEN
    EXECUTE format('CREATE TYPE %I AS ENUM (%s)', type_name, array_to_string(ARRAY(SELECT quote_literal(v) FROM unnest(enum_vals) v), ','));
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Example enums (adjust values if DATABASE_SCHEMA.md specifies differently)
SELECT create_enum_if_not_exists('ncr_severity', ARRAY['low','medium','high']);
SELECT create_enum_if_not_exists('ncr_status', ARRAY['open','in_progress','closed']);
SELECT create_enum_if_not_exists('report_type', ARRAY['pdf','xlsx','doc']);
SELECT create_enum_if_not_exists('document_type', ARRAY['drawing','spec','certificate']);
SELECT create_enum_if_not_exists('checklist_category', ARRAY['general','mechanical','electrical']);
SELECT create_enum_if_not_exists('inspection_status', ARRAY['draft','scheduled','done','cancelled']);

-- Clean up helper (no-op if you want to keep it)
-- DROP FUNCTION create_enum_if_not_exists(type_name text, enum_vals text[]);
