-- =============================================================================
-- Migration: Add missing columns to inspection.inspection_sessions
-- -----------------------------------------------------------------------------
-- Run this in the Supabase SQL editor (or via psql) against the project database.
--
-- Fixes:
--   1. Adds `session_number` (auto-increment per request, 1, 2, 3 ...)
--   2. Adds `sub_vendor` (optional; empty by default)
--   3. Back-fills session_number for any existing rows that lack it
-- =============================================================================

-- 1) Add session_number column (integer, nullable for back-fill)
ALTER TABLE inspection.inspection_sessions
  ADD COLUMN IF NOT EXISTS session_number integer;

-- 2) Add sub_vendor column (text, nullable; empty by default)
ALTER TABLE inspection.inspection_sessions
  ADD COLUMN IF NOT EXISTS sub_vendor text;

-- 3) Back-fill session_number for existing rows that are NULL,
--    ordered by created_at per request
DO $$
DECLARE
  r RECORD;
  counter int;
  current_request text := '';
BEGIN
  FOR r IN
    SELECT id, tpi_request_id
    FROM inspection.inspection_sessions
    WHERE session_number IS NULL
    ORDER BY tpi_request_id, created_at ASC, id ASC
  LOOP
    IF current_request IS DISTINCT FROM r.tpi_request_id THEN
      current_request := r.tpi_request_id;
      counter := 0;
    END IF;
    counter := counter + 1;
    UPDATE inspection.inspection_sessions
       SET session_number = counter
     WHERE id = r.id;
  END LOOP;
END $$;

-- 4) Make session_number NOT NULL after back-fill
ALTER TABLE inspection.inspection_sessions
  ALTER COLUMN session_number SET NOT NULL;

-- 5) Index for fast per-request lookup + ordering
CREATE INDEX IF NOT EXISTS idx_inspection_sessions_request_number
  ON inspection.inspection_sessions (tpi_request_id, session_number);

-- =============================================================================
-- Verification query:
--   SELECT tpi_request_id, session_number, session_date, status
--   FROM inspection.inspection_sessions
--   ORDER BY tpi_request_id, session_number;
-- =============================================================================
