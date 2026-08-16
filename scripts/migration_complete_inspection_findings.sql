-- Complete the NCR/Observation workflow defined by Non Conformity Report TPI.docx.
-- This migration is additive and idempotent. It preserves both existing finding
-- tables and exposes them through one application/domain model.

CREATE SCHEMA IF NOT EXISTS inspection;

CREATE TABLE IF NOT EXISTS inspection.non_conformities (id text PRIMARY KEY);
CREATE TABLE IF NOT EXISTS inspection.observations (id text PRIMARY KEY);

ALTER TABLE inspection.non_conformities
  ADD COLUMN IF NOT EXISTS request_id text,
  ADD COLUMN IF NOT EXISTS session_id text,
  ADD COLUMN IF NOT EXISTS equipment_id text,
  ADD COLUMN IF NOT EXISTS inspection_method text,
  ADD COLUMN IF NOT EXISTS checklist_item_id text,
  ADD COLUMN IF NOT EXISTS checklist_text text,
  ADD COLUMN IF NOT EXISTS revision text NOT NULL DEFAULT '0',
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS evidence text,
  ADD COLUMN IF NOT EXISTS document_references jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS immediate_containment text,
  ADD COLUMN IF NOT EXISTS target_completion_date date,
  ADD COLUMN IF NOT EXISTS responsible_person text,
  ADD COLUMN IF NOT EXISTS verification text,
  ADD COLUMN IF NOT EXISTS closeout_decision text,
  ADD COLUMN IF NOT EXISTS closeout_note text,
  ADD COLUMN IF NOT EXISTS closeout_date date,
  ADD COLUMN IF NOT EXISTS closed_by text,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_by text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE inspection.observations
  ADD COLUMN IF NOT EXISTS session_id text,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS revision text NOT NULL DEFAULT '0',
  ADD COLUMN IF NOT EXISTS classification text NOT NULL DEFAULT 'OBSERVATION',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'OPEN',
  ADD COLUMN IF NOT EXISTS location_found text,
  ADD COLUMN IF NOT EXISTS evidence text,
  ADD COLUMN IF NOT EXISTS photos text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS document_references jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS immediate_containment text,
  ADD COLUMN IF NOT EXISTS corrective_action text,
  ADD COLUMN IF NOT EXISTS target_completion_date date,
  ADD COLUMN IF NOT EXISTS responsible_person text,
  ADD COLUMN IF NOT EXISTS verification text,
  ADD COLUMN IF NOT EXISTS closeout_decision text,
  ADD COLUMN IF NOT EXISTS closeout_note text,
  ADD COLUMN IF NOT EXISTS closeout_date date,
  ADD COLUMN IF NOT EXISTS closed_by text,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_by text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE inspection.non_conformities
SET request_id = inspection_id
WHERE request_id IS NULL AND inspection_id IS NOT NULL;

UPDATE inspection.observations
SET title = COALESCE(title, category, 'Observation')
WHERE title IS NULL;

CREATE INDEX IF NOT EXISTS idx_non_conformities_request
  ON inspection.non_conformities (request_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_non_conformities_session
  ON inspection.non_conformities (session_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_non_conformities_number
  ON inspection.non_conformities (ncr_number)
  WHERE ncr_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_non_conformities_checklist_source
  ON inspection.non_conformities (
    request_id,
    COALESCE(session_id, ''),
    equipment_id,
    inspection_method,
    checklist_item_id
  )
  WHERE checklist_item_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_observations_request
  ON inspection.observations (request_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_observations_session
  ON inspection.observations (session_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_observations_checklist_source
  ON inspection.observations (
    request_id,
    COALESCE(session_id, ''),
    equipment_id,
    inspection_method,
    checklist_item_id
  )
  WHERE checklist_item_id IS NOT NULL;

-- The NCR status column is backed by the lowercase ncr_status enum in the live
-- database. Convert it to text first, normalize legacy values, and only then
-- enforce the canonical uppercase lifecycle.
ALTER TABLE inspection.non_conformities
  ALTER COLUMN status TYPE text USING status::text;
UPDATE inspection.non_conformities
   SET status = CASE lower(status)
     WHEN 'open' THEN 'OPEN'
     WHEN 'in_progress' THEN 'CORRECTIVE_ACTION'
     WHEN 'corrective_action' THEN 'CORRECTIVE_ACTION'
     WHEN 'verification' THEN 'VERIFICATION'
     WHEN 'closed' THEN 'CLOSED'
     WHEN 'rejected' THEN 'REJECTED'
     ELSE 'OPEN'
   END
 WHERE status IS NOT NULL;
ALTER TABLE inspection.non_conformities
  ALTER COLUMN status SET DEFAULT 'OPEN';

ALTER TABLE inspection.observations
  ALTER COLUMN status TYPE text USING status::text;
UPDATE inspection.observations
   SET status = CASE lower(status)
     WHEN 'open' THEN 'OPEN'
     WHEN 'in_progress' THEN 'CORRECTIVE_ACTION'
     WHEN 'corrective_action' THEN 'CORRECTIVE_ACTION'
     WHEN 'verification' THEN 'VERIFICATION'
     WHEN 'closed' THEN 'CLOSED'
     WHEN 'rejected' THEN 'REJECTED'
     ELSE 'OPEN'
   END
 WHERE status IS NOT NULL;
ALTER TABLE inspection.observations
  ALTER COLUMN status SET DEFAULT 'OPEN';

ALTER TABLE inspection.non_conformities
  DROP CONSTRAINT IF EXISTS non_conformities_status_check;
ALTER TABLE inspection.non_conformities
  ADD CONSTRAINT non_conformities_status_check
  CHECK (status IN ('OPEN', 'CORRECTIVE_ACTION', 'VERIFICATION', 'CLOSED', 'REJECTED'));

ALTER TABLE inspection.observations
  DROP CONSTRAINT IF EXISTS observations_status_check;
ALTER TABLE inspection.observations
  ADD CONSTRAINT observations_status_check
  CHECK (status IN ('OPEN', 'CORRECTIVE_ACTION', 'VERIFICATION', 'CLOSED', 'REJECTED'));
