-- =============================================================================
-- Migration: Create inspection schema and related tables (idempotent)
-- Generated: 2026-08-07
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'inspection') THEN
    EXECUTE 'CREATE SCHEMA inspection';
  END IF;
END $$;

-- Checklist results
CREATE TABLE IF NOT EXISTS inspection.checklist_results (
  id text PRIMARY KEY
);
ALTER TABLE inspection.checklist_results ADD COLUMN IF NOT EXISTS request_id text;
ALTER TABLE inspection.checklist_results ADD COLUMN IF NOT EXISTS session_id text;
ALTER TABLE inspection.checklist_results ADD COLUMN IF NOT EXISTS equipment_id text;
ALTER TABLE inspection.checklist_results ADD COLUMN IF NOT EXISTS inspection_method text;
ALTER TABLE inspection.checklist_results ADD COLUMN IF NOT EXISTS item_id text;
ALTER TABLE inspection.checklist_results ADD COLUMN IF NOT EXISTS checklist_text text;
ALTER TABLE inspection.checklist_results ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE inspection.checklist_results ADD COLUMN IF NOT EXISTS comment text;
ALTER TABLE inspection.checklist_results ADD COLUMN IF NOT EXISTS checked_by text;
ALTER TABLE inspection.checklist_results ADD COLUMN IF NOT EXISTS checked_at timestamptz;
ALTER TABLE inspection.checklist_results ADD COLUMN IF NOT EXISTS created_by text;
ALTER TABLE inspection.checklist_results ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE inspection.checklist_results ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- Inspection photos
CREATE TABLE IF NOT EXISTS inspection.inspection_photos (
  id text PRIMARY KEY
);
ALTER TABLE inspection.inspection_photos ADD COLUMN IF NOT EXISTS request_id text;
ALTER TABLE inspection.inspection_photos ADD COLUMN IF NOT EXISTS equipment_id text;
ALTER TABLE inspection.inspection_photos ADD COLUMN IF NOT EXISTS checklist_item_id text;
ALTER TABLE inspection.inspection_photos ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE inspection.inspection_photos ADD COLUMN IF NOT EXISTS file_path text;
ALTER TABLE inspection.inspection_photos ADD COLUMN IF NOT EXISTS file_size bigint;
ALTER TABLE inspection.inspection_photos ADD COLUMN IF NOT EXISTS mime_type text;
ALTER TABLE inspection.inspection_photos ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE inspection.inspection_photos ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE inspection.inspection_photos ADD COLUMN IF NOT EXISTS uploaded_by text;

-- Inspection sessions
CREATE TABLE IF NOT EXISTS inspection.inspection_sessions (
  id text PRIMARY KEY
);
ALTER TABLE inspection.inspection_sessions ADD COLUMN IF NOT EXISTS tpi_request_id text;
ALTER TABLE inspection.inspection_sessions ADD COLUMN IF NOT EXISTS session_number integer;
ALTER TABLE inspection.inspection_sessions ADD COLUMN IF NOT EXISTS session_date text;
ALTER TABLE inspection.inspection_sessions ADD COLUMN IF NOT EXISTS stages text[];
ALTER TABLE inspection.inspection_sessions ADD COLUMN IF NOT EXISTS methods text[];
ALTER TABLE inspection.inspection_sessions ADD COLUMN IF NOT EXISTS equipment_ids text[];
ALTER TABLE inspection.inspection_sessions ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE inspection.inspection_sessions ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE inspection.inspection_sessions ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE inspection.inspection_sessions ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- Observations
CREATE TABLE IF NOT EXISTS inspection.observations (
  id text PRIMARY KEY
);
ALTER TABLE inspection.observations ADD COLUMN IF NOT EXISTS request_id text;
ALTER TABLE inspection.observations ADD COLUMN IF NOT EXISTS equipment_id text;
ALTER TABLE inspection.observations ADD COLUMN IF NOT EXISTS inspection_method text;
ALTER TABLE inspection.observations ADD COLUMN IF NOT EXISTS checklist_item_id text;
ALTER TABLE inspection.observations ADD COLUMN IF NOT EXISTS checklist_text text;
ALTER TABLE inspection.observations ADD COLUMN IF NOT EXISTS observation_text text;
ALTER TABLE inspection.observations ADD COLUMN IF NOT EXISTS category text;

-- Non-conformities
CREATE TABLE IF NOT EXISTS inspection.non_conformities (
  id text PRIMARY KEY
);
ALTER TABLE inspection.non_conformities ADD COLUMN IF NOT EXISTS inspection_id text;
ALTER TABLE inspection.non_conformities ADD COLUMN IF NOT EXISTS ncr_number text;
ALTER TABLE inspection.non_conformities ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE inspection.non_conformities ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE inspection.non_conformities ADD COLUMN IF NOT EXISTS severity text;
ALTER TABLE inspection.non_conformities ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE inspection.non_conformities ADD COLUMN IF NOT EXISTS location_found text;
ALTER TABLE inspection.non_conformities ADD COLUMN IF NOT EXISTS photos text[];
ALTER TABLE inspection.non_conformities ADD COLUMN IF NOT EXISTS corrective_action text;
ALTER TABLE inspection.non_conformities ADD COLUMN IF NOT EXISTS root_cause text;
ALTER TABLE inspection.non_conformities ADD COLUMN IF NOT EXISTS preventive_action text;

-- Certificates
CREATE TABLE IF NOT EXISTS inspection.certificates (
  id text PRIMARY KEY
);
ALTER TABLE inspection.certificates ADD COLUMN IF NOT EXISTS inspection_id text;
ALTER TABLE inspection.certificates ADD COLUMN IF NOT EXISTS certificate_type text;
ALTER TABLE inspection.certificates ADD COLUMN IF NOT EXISTS certificate_number text;
ALTER TABLE inspection.certificates ADD COLUMN IF NOT EXISTS certificate_url text;
ALTER TABLE inspection.certificates ADD COLUMN IF NOT EXISTS issue_date date;
ALTER TABLE inspection.certificates ADD COLUMN IF NOT EXISTS expiry_date date;
ALTER TABLE inspection.certificates ADD COLUMN IF NOT EXISTS verified_by_ics text;
ALTER TABLE inspection.certificates ADD COLUMN IF NOT EXISTS verified_by text;
ALTER TABLE inspection.certificates ADD COLUMN IF NOT EXISTS verified_at timestamptz;

-- Inspection reports
CREATE TABLE IF NOT EXISTS inspection.inspection_reports (
  id text PRIMARY KEY
);
ALTER TABLE inspection.inspection_reports ADD COLUMN IF NOT EXISTS inspection_id text;
ALTER TABLE inspection.inspection_reports ADD COLUMN IF NOT EXISTS report_type text;
ALTER TABLE inspection.inspection_reports ADD COLUMN IF NOT EXISTS report_number text;
ALTER TABLE inspection.inspection_reports ADD COLUMN IF NOT EXISTS report_url text;
ALTER TABLE inspection.inspection_reports ADD COLUMN IF NOT EXISTS issued_by text;
ALTER TABLE inspection.inspection_reports ADD COLUMN IF NOT EXISTS issued_at timestamptz;
ALTER TABLE inspection.inspection_reports ADD COLUMN IF NOT EXISTS approved_by text;
ALTER TABLE inspection.inspection_reports ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE inspection.inspection_reports ADD COLUMN IF NOT EXISTS sent_to_client boolean DEFAULT false;
ALTER TABLE inspection.inspection_reports ADD COLUMN IF NOT EXISTS sent_at timestamptz;

-- Inspectors
CREATE TABLE IF NOT EXISTS inspection.inspectors (
  id text PRIMARY KEY
);
ALTER TABLE inspection.inspectors ADD COLUMN IF NOT EXISTS name_en text;
ALTER TABLE inspection.inspectors ADD COLUMN IF NOT EXISTS name_fa text;
ALTER TABLE inspection.inspectors ADD COLUMN IF NOT EXISTS inspector_type text;
ALTER TABLE inspection.inspectors ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE inspection.inspectors ADD COLUMN IF NOT EXISTS specialties text[];
ALTER TABLE inspection.inspectors ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE inspection.inspectors ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE inspection.inspectors ADD COLUMN IF NOT EXISTS location_base text;
ALTER TABLE inspection.inspectors ADD COLUMN IF NOT EXISTS rating numeric;
ALTER TABLE inspection.inspectors ADD COLUMN IF NOT EXISTS completed_inspections integer;
ALTER TABLE inspection.inspectors ADD COLUMN IF NOT EXISTS user_id text;

-- Vendors
CREATE TABLE IF NOT EXISTS inspection.vendors (
  id text PRIMARY KEY
);
ALTER TABLE inspection.vendors ADD COLUMN IF NOT EXISTS name text;

-- Document reviews
CREATE TABLE IF NOT EXISTS inspection.document_reviews (
  id text PRIMARY KEY
);
ALTER TABLE inspection.document_reviews ADD COLUMN IF NOT EXISTS inspection_request_id text;
ALTER TABLE inspection.document_reviews ADD COLUMN IF NOT EXISTS session_id text;
ALTER TABLE inspection.document_reviews ADD COLUMN IF NOT EXISTS document_type text;
ALTER TABLE inspection.document_reviews ADD COLUMN IF NOT EXISTS document_name text;
ALTER TABLE inspection.document_reviews ADD COLUMN IF NOT EXISTS document_url text;
ALTER TABLE inspection.document_reviews ADD COLUMN IF NOT EXISTS review_status text;
ALTER TABLE inspection.document_reviews ADD COLUMN IF NOT EXISTS comments text;
ALTER TABLE inspection.document_reviews ADD COLUMN IF NOT EXISTS reviewed_by text;
ALTER TABLE inspection.document_reviews ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE inspection.document_reviews ADD COLUMN IF NOT EXISTS verified_by_ics text;
ALTER TABLE inspection.document_reviews ADD COLUMN IF NOT EXISTS verification_letter_number text;
ALTER TABLE inspection.document_reviews ADD COLUMN IF NOT EXISTS verification_date date;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inspection_sessions_tpi_request ON inspection.inspection_sessions (tpi_request_id);
CREATE INDEX IF NOT EXISTS idx_checklist_results_request ON inspection.checklist_results (request_id);
CREATE INDEX IF NOT EXISTS idx_document_reviews_session ON inspection.document_reviews (session_id);
