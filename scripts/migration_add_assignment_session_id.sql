-- =============================================================================
-- Migration: Link inspector assignments to inspection sessions (session_id)
-- -----------------------------------------------------------------------------
-- Run this in the Supabase SQL editor (or via psql) against the project database.
--
-- Background:
--   Assignments used to be linked to a session only implicitly via the
--   execution_date === session.session_date heuristic. This adds a real
--   session_id column so assignments belong to the session that created them.
--
-- The app writes session_id on every new assignment and falls back gracefully
-- if this migration has not been applied yet, so deploying the code before
-- running this script is safe.
--
-- IMPORTANT:
--   * inspection.inspection_sessions.id is TEXT (the app generates ids like
--     `ses_<timestamp>_<rand>`), so session_id MUST be TEXT. A uuid column
--     fails with: 42804 foreign key constraint cannot be implemented
--     (Key columns "session_id" and "id" are of incompatible types: uuid and text)
--   * The MWS module is Phase 2 — the `mws` schema may not exist yet. Every
--     mws statement below is guarded and simply skipped when the schema is
--     absent (previously failed with: 3F000 schema "mws" does not exist).
-- =============================================================================

-- 0) Clean up any wrongly-typed column left behind by a failed earlier run
--    (the whole previous ALTER statement rolled back atomically, so this is
--    only needed if the column was created by a partial/manual attempt).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'tpi' AND table_name = 'tpi_inspector_assignments'
      AND column_name = 'session_id' AND data_type <> 'text'
  ) THEN
    ALTER TABLE tpi.tpi_inspector_assignments DROP COLUMN session_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'mws')
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'mws' AND table_name = 'mws_inspector_assignments'
         AND column_name = 'session_id' AND data_type <> 'text'
     )
  THEN
    ALTER TABLE mws.mws_inspector_assignments DROP COLUMN session_id;
  END IF;
END $$;

-- 1) Add the session_id column (text) — TPI (always present)
ALTER TABLE tpi.tpi_inspector_assignments
  ADD COLUMN IF NOT EXISTS session_id text;

-- 1b) MWS (only if the schema exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'mws') THEN
    ALTER TABLE mws.mws_inspector_assignments
      ADD COLUMN IF NOT EXISTS session_id text;
  END IF;
END $$;

-- 2) Foreign keys (guarded so re-runs are safe and a text column that exists
--    without its FK — e.g. from a manual partial attempt — still gets linked)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tpi_inspector_assignments_session_id_fkey'
  ) THEN
    ALTER TABLE tpi.tpi_inspector_assignments
      ADD CONSTRAINT tpi_inspector_assignments_session_id_fkey
      FOREIGN KEY (session_id)
      REFERENCES inspection.inspection_sessions (id)
      ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'mws')
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'mws_inspector_assignments_session_id_fkey'
     )
  THEN
    ALTER TABLE mws.mws_inspector_assignments
      ADD CONSTRAINT mws_inspector_assignments_session_id_fkey
      FOREIGN KEY (session_id)
      REFERENCES inspection.inspection_sessions (id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- 3) Backfill legacy rows: link an assignment to the session of the same
--    request whose session_date matches the assignment's execution_date.
--    NOTE: execution_date is a `date` column while session_date is `text`
--    (e.g. "1403-08-15"), so we compare execution_date::text to mirror
--    exactly the app's runtime heuristic
--    (execution_date === session.session_date, both arrive as "YYYY-MM-DD").
UPDATE tpi.tpi_inspector_assignments a
SET session_id = s.id
FROM inspection.inspection_sessions s
WHERE a.session_id IS NULL
  AND a.execution_date IS NOT NULL
  AND s.tpi_request_id = a.tpi_request_id
  AND a.execution_date::text = s.session_date;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'mws') THEN
    UPDATE mws.mws_inspector_assignments a
    SET session_id = s.id
    FROM inspection.inspection_sessions s
    WHERE a.session_id IS NULL
      AND a.execution_date IS NOT NULL
      AND s.tpi_request_id = a.tpi_request_id
      AND a.execution_date::text = s.session_date;
  END IF;
END $$;

-- 4) Indexes for fast per-session filtering
CREATE INDEX IF NOT EXISTS idx_tpi_assignments_session
  ON tpi.tpi_inspector_assignments (session_id);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'mws') THEN
    CREATE INDEX IF NOT EXISTS idx_mws_assignments_session
      ON mws.mws_inspector_assignments (session_id);
  END IF;
END $$;

-- =============================================================================
-- Verification query:
--   SELECT a.id, a.execution_date, a.session_id, s.session_number
--   FROM tpi.tpi_inspector_assignments a
--   LEFT JOIN inspection.inspection_sessions s ON s.id = a.session_id
--   ORDER BY a.created_at DESC
--   LIMIT 20;
-- =============================================================================
