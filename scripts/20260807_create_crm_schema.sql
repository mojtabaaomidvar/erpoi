-- =============================================================================
-- Migration: Create crm schema and clients table (idempotent)
-- Generated: 2026-08-07
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'crm') THEN
    EXECUTE 'CREATE SCHEMA crm';
  END IF;
END $$;

-- Clients
CREATE TABLE IF NOT EXISTS crm.clients (
  id text PRIMARY KEY
);
ALTER TABLE crm.clients ADD COLUMN IF NOT EXISTS name_en text;
ALTER TABLE crm.clients ADD COLUMN IF NOT EXISTS name_fa text;
ALTER TABLE crm.clients ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE crm.clients ADD COLUMN IF NOT EXISTS national_id text;
ALTER TABLE crm.clients ADD COLUMN IF NOT EXISTS registration_no text;
ALTER TABLE crm.clients ADD COLUMN IF NOT EXISTS economic_code text;
ALTER TABLE crm.clients ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE crm.clients ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE crm.clients ADD COLUMN IF NOT EXISTS contact_persons jsonb;
ALTER TABLE crm.clients ADD COLUMN IF NOT EXISTS address_en text;
ALTER TABLE crm.clients ADD COLUMN IF NOT EXISTS address_fa text;
ALTER TABLE crm.clients ADD COLUMN IF NOT EXISTS department text[];
ALTER TABLE crm.clients ADD COLUMN IF NOT EXISTS emails text[];
ALTER TABLE crm.clients ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE crm.clients ADD COLUMN IF NOT EXISTS updated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_crm_clients_name_en ON crm.clients (name_en);
