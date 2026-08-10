-- Repairs RPC privileges for environments where the TPI deletion workflow
-- migration was applied before schema usage was granted.

BEGIN;

GRANT USAGE ON SCHEMA master_data TO authenticated;

REVOKE ALL ON FUNCTION master_data.request_tpi_package_deletion(text, text, text, jsonb)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION master_data.approve_tpi_package_deletion(text)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION master_data.reject_tpi_package_deletion(text, text)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION master_data.request_tpi_package_deletion(text, text, text, jsonb)
  TO authenticated;
GRANT EXECUTE ON FUNCTION master_data.approve_tpi_package_deletion(text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION master_data.reject_tpi_package_deletion(text, text)
  TO authenticated;

COMMIT;

-- Expected result: true, false
SELECT
  has_function_privilege(
    'authenticated',
    'master_data.request_tpi_package_deletion(text,text,text,jsonb)',
    'EXECUTE'
  ) AS authenticated_can_request,
  has_function_privilege(
    'anon',
    'master_data.request_tpi_package_deletion(text,text,text,jsonb)',
    'EXECUTE'
  ) AS anon_can_request;