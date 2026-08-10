-- =============================================================================
-- Migration: Create contracts schema and contracts table (idempotent)
-- Generated: 2026-08-07
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'contracts') THEN
    EXECUTE 'CREATE SCHEMA contracts';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS contracts.contracts (
  id text PRIMARY KEY
);
ALTER TABLE contracts.contracts ADD COLUMN IF NOT EXISTS client_id text;
ALTER TABLE contracts.contracts ADD COLUMN IF NOT EXISTS contract_no text;
ALTER TABLE contracts.contracts ADD COLUMN IF NOT EXISTS contract_title text;
ALTER TABLE contracts.contracts ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE contracts.contracts ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE contracts.contracts ADD COLUMN IF NOT EXISTS total_value numeric;
ALTER TABLE contracts.contracts ADD COLUMN IF NOT EXISTS currency text;
ALTER TABLE contracts.contracts ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE contracts.contracts ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE contracts.contracts ADD COLUMN IF NOT EXISTS financial_terms jsonb;
ALTER TABLE contracts.contracts ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE contracts.contracts ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE contracts.contracts ADD COLUMN IF NOT EXISTS updated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_contracts_contract_no ON contracts.contracts (contract_no);
