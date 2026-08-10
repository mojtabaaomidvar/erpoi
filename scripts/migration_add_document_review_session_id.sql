-- Adds immutable session ownership to inspection documents.
-- Existing rows remain NULL and are shown as legacy/unassigned documents.

BEGIN;

ALTER TABLE inspection.document_reviews
  ADD COLUMN IF NOT EXISTS session_id text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'document_reviews_session_id_fkey'
      AND conrelid = 'inspection.document_reviews'::regclass
  ) THEN
    ALTER TABLE inspection.document_reviews
      ADD CONSTRAINT document_reviews_session_id_fkey
      FOREIGN KEY (session_id)
      REFERENCES inspection.inspection_sessions (id)
      ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_document_reviews_session
  ON inspection.document_reviews (session_id);

CREATE INDEX IF NOT EXISTS idx_document_reviews_request_session_created
  ON inspection.document_reviews (
    inspection_request_id,
    session_id,
    created_at DESC
  );

COMMIT;