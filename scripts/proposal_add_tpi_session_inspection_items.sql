-- PROPOSAL ONLY - do not run until the Overview session-item model is approved.
--
-- A TPI inspection item can participate in more than one inspection session.
-- This junction table preserves that history and lets the Overview tab display
-- every related session number without adding a lossy single session_id column
-- to tpi.tpi_inspection_items.

BEGIN;

-- Composite keys let PostgreSQL enforce that a session and item linked below
-- belong to the same TPI request.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'inspection_sessions_id_request_key'
      AND conrelid = 'inspection.inspection_sessions'::regclass
  ) THEN
    ALTER TABLE inspection.inspection_sessions
      ADD CONSTRAINT inspection_sessions_id_request_key
      UNIQUE (id, tpi_request_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tpi_inspection_items_id_request_key'
      AND conrelid = 'tpi.tpi_inspection_items'::regclass
  ) THEN
    ALTER TABLE tpi.tpi_inspection_items
      ADD CONSTRAINT tpi_inspection_items_id_request_key
      UNIQUE (id, tpi_request_id);
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS tpi.tpi_session_inspection_items (
  session_id text NOT NULL,
  inspection_item_id text NOT NULL,
  tpi_request_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, inspection_item_id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tpi_session_items_session_request_fkey'
      AND conrelid = 'tpi.tpi_session_inspection_items'::regclass
  ) THEN
    ALTER TABLE tpi.tpi_session_inspection_items
      ADD CONSTRAINT tpi_session_items_session_request_fkey
      FOREIGN KEY (session_id, tpi_request_id)
      REFERENCES inspection.inspection_sessions (id, tpi_request_id)
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tpi_session_items_item_request_fkey'
      AND conrelid = 'tpi.tpi_session_inspection_items'::regclass
  ) THEN
    ALTER TABLE tpi.tpi_session_inspection_items
      ADD CONSTRAINT tpi_session_items_item_request_fkey
      FOREIGN KEY (inspection_item_id, tpi_request_id)
      REFERENCES tpi.tpi_inspection_items (id, tpi_request_id)
      ON DELETE CASCADE;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_tpi_session_items_request_item
  ON tpi.tpi_session_inspection_items (tpi_request_id, inspection_item_id);

CREATE INDEX IF NOT EXISTS idx_tpi_session_items_request_session
  ON tpi.tpi_session_inspection_items (tpi_request_id, session_id);

-- Existing items predate explicit session ownership. Based on the current
-- workflow, assign each legacy item to the request's earliest session. Review
-- this policy before applying the migration if historical data was entered by
-- another workflow.
INSERT INTO tpi.tpi_session_inspection_items (
  session_id,
  inspection_item_id,
  tpi_request_id
)
SELECT
  first_session.id,
  item.id,
  item.tpi_request_id
FROM tpi.tpi_inspection_items AS item
JOIN LATERAL (
  SELECT session.id
  FROM inspection.inspection_sessions AS session
  WHERE session.tpi_request_id = item.tpi_request_id
  ORDER BY session.session_number ASC, session.created_at ASC, session.id ASC
  LIMIT 1
) AS first_session ON true
ON CONFLICT (session_id, inspection_item_id) DO NOTHING;

COMMIT;

-- Verification query (run after migration if approved):
-- SELECT
--   link.tpi_request_id,
--   link.inspection_item_id,
--   array_agg(session.session_number ORDER BY session.session_number) AS sessions
-- FROM tpi.tpi_session_inspection_items AS link
-- JOIN inspection.inspection_sessions AS session ON session.id = link.session_id
-- GROUP BY link.tpi_request_id, link.inspection_item_id
-- ORDER BY link.tpi_request_id, link.inspection_item_id;