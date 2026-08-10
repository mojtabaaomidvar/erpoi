-- Adapts the TPI package deletion RPCs to the application's custom session.
-- The actor id is supplied by the Application layer and resolved again from
-- core.users. This is an interim bridge until authentication is server-backed.

BEGIN;

DROP FUNCTION IF EXISTS master_data.request_tpi_package_deletion(text, text, text, jsonb);
DROP FUNCTION IF EXISTS master_data.approve_tpi_package_deletion(text);
DROP FUNCTION IF EXISTS master_data.reject_tpi_package_deletion(text, text);

CREATE OR REPLACE FUNCTION master_data.request_tpi_package_deletion(
  p_approval_id text,
  p_package_id text,
  p_requested_by text,
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
  SELECT u.id
    INTO v_actor_id
    FROM core.users u
   WHERE u.id = trim(coalesce(p_requested_by, ''))
     AND CASE
           WHEN nullif(trim(to_jsonb(u) ->> 'status'), '') IS NOT NULL
             THEN lower(trim(to_jsonb(u) ->> 'status')) = 'active'
           WHEN nullif(trim(to_jsonb(u) ->> 'is_active'), '') IS NOT NULL
             THEN (to_jsonb(u) ->> 'is_active')::boolean
           ELSE true
         END
   LIMIT 1;

  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Active application user not found';
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

CREATE OR REPLACE FUNCTION master_data.approve_tpi_package_deletion(
  p_approval_id text,
  p_reviewed_by text
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
  SELECT
    u.id,
    coalesce(
      nullif(lower(trim(to_jsonb(u) ->> 'role')), ''),
      nullif(lower(trim(to_jsonb(u) ->> 'role_id')), ''),
      ''
    )
    INTO v_reviewer_id, v_reviewer_role
    FROM core.users u
   WHERE u.id = trim(coalesce(p_reviewed_by, ''))
     AND CASE
           WHEN nullif(trim(to_jsonb(u) ->> 'status'), '') IS NOT NULL
             THEN lower(trim(to_jsonb(u) ->> 'status')) = 'active'
           WHEN nullif(trim(to_jsonb(u) ->> 'is_active'), '') IS NOT NULL
             THEN (to_jsonb(u) ->> 'is_active')::boolean
           ELSE true
         END
   LIMIT 1;

  IF v_reviewer_id IS NULL THEN
    RAISE EXCEPTION 'Active reviewing user not found';
  END IF;
  IF v_reviewer_role NOT IN ('admin', 'super_admin', 'manager', 'unit_manager') THEN
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
  p_reviewed_by text,
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
  SELECT
    u.id,
    coalesce(
      nullif(lower(trim(to_jsonb(u) ->> 'role')), ''),
      nullif(lower(trim(to_jsonb(u) ->> 'role_id')), ''),
      ''
    )
    INTO v_reviewer_id, v_reviewer_role
    FROM core.users u
   WHERE u.id = trim(coalesce(p_reviewed_by, ''))
     AND CASE
           WHEN nullif(trim(to_jsonb(u) ->> 'status'), '') IS NOT NULL
             THEN lower(trim(to_jsonb(u) ->> 'status')) = 'active'
           WHEN nullif(trim(to_jsonb(u) ->> 'is_active'), '') IS NOT NULL
             THEN (to_jsonb(u) ->> 'is_active')::boolean
           ELSE true
         END
   LIMIT 1;

  IF v_reviewer_id IS NULL THEN
    RAISE EXCEPTION 'Active reviewing user not found';
  END IF;
  IF v_reviewer_role NOT IN ('admin', 'super_admin', 'manager', 'unit_manager') THEN
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

GRANT USAGE ON SCHEMA master_data TO anon, authenticated;

REVOKE ALL ON FUNCTION master_data.request_tpi_package_deletion(text, text, text, text, jsonb)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION master_data.approve_tpi_package_deletion(text, text)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION master_data.reject_tpi_package_deletion(text, text, text)
  FROM PUBLIC;

GRANT EXECUTE ON FUNCTION master_data.request_tpi_package_deletion(text, text, text, text, jsonb)
  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION master_data.approve_tpi_package_deletion(text, text)
  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION master_data.reject_tpi_package_deletion(text, text, text)
  TO anon, authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;

SELECT
  has_function_privilege(
    'anon',
    'master_data.request_tpi_package_deletion(text,text,text,text,jsonb)',
    'EXECUTE'
  ) AS anon_can_request,
  has_function_privilege(
    'anon',
    'master_data.approve_tpi_package_deletion(text,text)',
    'EXECUTE'
  ) AS anon_can_approve,
  has_function_privilege(
    'anon',
    'master_data.reject_tpi_package_deletion(text,text,text)',
    'EXECUTE'
  ) AS anon_can_reject;