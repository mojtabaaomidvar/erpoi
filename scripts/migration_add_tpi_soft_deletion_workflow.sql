-- TPI package/session soft deletion and package deletion approval workflow.
-- Run after the base TPI, inspection, and master_data schemas exist.

BEGIN;

ALTER TABLE inspection.inspection_sessions
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by text,
  ADD COLUMN IF NOT EXISTS deletion_reason text;

ALTER TABLE tpi.tpi_requests
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by text,
  ADD COLUMN IF NOT EXISTS deletion_reason text,
  ADD COLUMN IF NOT EXISTS deletion_approval_id text;

ALTER TABLE master_data.pending_approvals
  ADD COLUMN IF NOT EXISTS request_type text NOT NULL DEFAULT 'MASTER_DATA_VALUE',
  ADD COLUMN IF NOT EXISTS entity_type text,
  ADD COLUMN IF NOT EXISTS entity_id text,
  ADD COLUMN IF NOT EXISTS request_payload jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_inspection_sessions_active_request
  ON inspection.inspection_sessions (tpi_request_id, session_number)
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_tpi_requests_active_created
  ON tpi.tpi_requests (created_at DESC)
  WHERE is_deleted = false;

CREATE UNIQUE INDEX IF NOT EXISTS uq_pending_entity_deletion
  ON master_data.pending_approvals (request_type, entity_type, entity_id)
  WHERE status = 'PENDING' AND request_type = 'ENTITY_DELETION';

CREATE OR REPLACE FUNCTION master_data.request_tpi_package_deletion(
  p_approval_id text,
  p_package_id text,
  p_reason text,
  p_request_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS master_data.pending_approvals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = master_data, tpi, core, public
AS $$
DECLARE
  v_actor_id text;
  v_result master_data.pending_approvals%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication is required';
  END IF;

  SELECT u.id
    INTO v_actor_id
    FROM core.users u
   WHERE u.id = auth.uid()::text
      OR lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
   ORDER BY CASE WHEN u.id = auth.uid()::text THEN 0 ELSE 1 END
   LIMIT 1;

  IF nullif(trim(v_actor_id), '') IS NULL THEN
    RAISE EXCEPTION 'Authenticated application user not found';
  END IF;
  IF nullif(trim(p_approval_id), '') IS NULL
     OR nullif(trim(p_package_id), '') IS NULL THEN
    RAISE EXCEPTION 'Approval and package identifiers are required';
  END IF;
  IF length(trim(coalesce(p_reason, ''))) < 10 THEN
    RAISE EXCEPTION 'Deletion reason must be at least 10 characters';
  END IF;
  IF NOT EXISTS (
    SELECT 1
      FROM tpi.tpi_requests
     WHERE id = p_package_id
       AND is_deleted = false
  ) THEN
    RAISE EXCEPTION 'TPI package not found or already deleted';
  END IF;

  INSERT INTO master_data.pending_approvals (
    id, field_type, proposed_value, requested_by, status,
    request_type, entity_type, entity_id, request_payload
  ) VALUES (
    p_approval_id, 'TPI_PACKAGE_DELETION', trim(p_reason), v_actor_id, 'PENDING',
    'ENTITY_DELETION', 'TPI_PACKAGE', p_package_id,
    coalesce(p_request_payload, '{}'::jsonb)
  )
  RETURNING * INTO v_result;

  RETURN v_result;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'A deletion request is already pending for this package';
END;
$$;

DROP FUNCTION IF EXISTS master_data.approve_tpi_package_deletion(text, text);

CREATE OR REPLACE FUNCTION master_data.approve_tpi_package_deletion(
  p_approval_id text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = master_data, tpi, core, public
AS $$
DECLARE
  v_approval master_data.pending_approvals%ROWTYPE;
  v_reviewer_id text;
  v_reviewer_role text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication is required';
  END IF;

  SELECT
    u.id,
    coalesce(to_jsonb(u) ->> 'role', to_jsonb(u) ->> 'role_id')
    INTO v_reviewer_id, v_reviewer_role
    FROM core.users u
   WHERE u.id = auth.uid()::text
      OR lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
   ORDER BY CASE WHEN u.id = auth.uid()::text THEN 0 ELSE 1 END
   LIMIT 1;

  IF v_reviewer_role IS NULL
     OR v_reviewer_role NOT IN ('admin', 'super_admin', 'manager', 'unit_manager') THEN
    RAISE EXCEPTION 'Only a unit manager or administrator may review deletion requests';
  END IF;

  SELECT *
    INTO v_approval
    FROM master_data.pending_approvals
   WHERE id = p_approval_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Approval request not found';
  END IF;

  IF v_approval.status <> 'PENDING' THEN
    RAISE EXCEPTION 'Approval request has already been reviewed';
  END IF;

  IF v_approval.request_type <> 'ENTITY_DELETION'
     OR v_approval.entity_type <> 'TPI_PACKAGE'
     OR nullif(trim(v_approval.entity_id), '') IS NULL THEN
    RAISE EXCEPTION 'Approval request is not a TPI package deletion';
  END IF;

  UPDATE tpi.tpi_requests
     SET is_deleted = true,
         deleted_at = now(),
         deleted_by = v_reviewer_id,
         deletion_reason = v_approval.proposed_value,
         deletion_approval_id = v_approval.id,
         status = 'CANCELLED',
         updated_at = now()
   WHERE id = v_approval.entity_id
     AND is_deleted = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TPI package not found or already deleted';
  END IF;

  UPDATE master_data.pending_approvals
     SET status = 'APPROVED',
         reviewed_by = v_reviewer_id,
         reviewed_at = now(),
         final_value = v_approval.entity_id
   WHERE id = v_approval.id;

  RETURN v_approval.entity_id;
END;
$$;

CREATE OR REPLACE FUNCTION master_data.reject_tpi_package_deletion(
  p_approval_id text,
  p_reason text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = master_data, core, public
AS $$
DECLARE
  v_approval master_data.pending_approvals%ROWTYPE;
  v_reviewer_id text;
  v_reviewer_role text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication is required';
  END IF;

  SELECT
    u.id,
    coalesce(to_jsonb(u) ->> 'role', to_jsonb(u) ->> 'role_id')
    INTO v_reviewer_id, v_reviewer_role
    FROM core.users u
   WHERE u.id = auth.uid()::text
      OR lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
   ORDER BY CASE WHEN u.id = auth.uid()::text THEN 0 ELSE 1 END
   LIMIT 1;

  IF v_reviewer_role IS NULL
     OR v_reviewer_role NOT IN ('admin', 'super_admin', 'manager', 'unit_manager') THEN
    RAISE EXCEPTION 'Only a unit manager or administrator may review deletion requests';
  END IF;
  IF length(trim(coalesce(p_reason, ''))) < 5 THEN
    RAISE EXCEPTION 'Rejection reason must be at least 5 characters';
  END IF;

  SELECT *
    INTO v_approval
    FROM master_data.pending_approvals
   WHERE id = p_approval_id
     AND request_type = 'ENTITY_DELETION'
     AND entity_type = 'TPI_PACKAGE'
   FOR UPDATE;

  IF NOT FOUND OR v_approval.status <> 'PENDING' THEN
    RAISE EXCEPTION 'Deletion request not found or already reviewed';
  END IF;

  UPDATE master_data.pending_approvals
     SET status = 'REJECTED',
         reviewed_by = v_reviewer_id,
         reviewed_at = now(),
         rejection_reason = trim(p_reason)
   WHERE id = v_approval.id;

  RETURN v_approval.entity_id;
END;
$$;

GRANT USAGE ON SCHEMA master_data TO authenticated;
REVOKE ALL ON FUNCTION master_data.request_tpi_package_deletion(text, text, text, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION master_data.approve_tpi_package_deletion(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION master_data.reject_tpi_package_deletion(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION master_data.request_tpi_package_deletion(text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION master_data.approve_tpi_package_deletion(text) TO authenticated;
GRANT EXECUTE ON FUNCTION master_data.reject_tpi_package_deletion(text, text) TO authenticated;

COMMIT;