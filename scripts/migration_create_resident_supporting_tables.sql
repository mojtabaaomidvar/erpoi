-- =============================================================================
-- Migration 2: Create Resident Inspection Supporting Tables
-- =============================================================================
-- Purpose: Add the remaining child entities for the Resident bounded context:
--   Quality Issues, Corrective Actions, ITP Monitoring, Periodic Reports,
--   Closeouts, and Activity Evidence.
--
-- DEPENDENCY: Requires migration_create_resident_engagement_tables.sql
--             (resident_activities, resident_engagements).
-- =============================================================================

BEGIN;

-- ============================================================================
-- 1. Quality Issues (findings raised during an engagement)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tpi.resident_quality_issues (
    id                          text PRIMARY KEY,
    resident_engagement_id      text NOT NULL
                                REFERENCES tpi.resident_engagements(id)
                                ON DELETE CASCADE,
    resident_daily_activity_id  text
                                REFERENCES tpi.resident_activities(id)
                                ON DELETE SET NULL,
    issue_number                text,
    title                       text NOT NULL,
    description                 text,
    severity                    text NOT NULL DEFAULT 'MINOR'
                                CHECK (severity IN ('MINOR', 'MAJOR', 'CRITICAL')),
    status                      text NOT NULL DEFAULT 'OPEN'
                                CHECK (status IN (
                                    'OPEN', 'CORRECTIVE_ACTION',
                                    'VERIFICATION', 'CLOSED', 'REJECTED'
                                )),
    location_found              text,
    vendor_or_equipment         text,
    raised_by                   text REFERENCES inspection.inspectors(id),
    raised_date                 date NOT NULL DEFAULT CURRENT_DATE,
    closed_by                   text REFERENCES inspection.inspectors(id),
    closed_date                 date,
    closed_notes                text,
    created_at                  timestamp with time zone NOT NULL DEFAULT now(),
    updated_at                  timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resident_qi_engagement
    ON tpi.resident_quality_issues (resident_engagement_id);
CREATE INDEX IF NOT EXISTS idx_resident_qi_status
    ON tpi.resident_quality_issues (status);

-- ============================================================================
-- 2. Corrective Actions (response to quality issues)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tpi.resident_corrective_actions (
    id                          text PRIMARY KEY,
    resident_quality_issue_id   text NOT NULL
                                REFERENCES tpi.resident_quality_issues(id)
                                ON DELETE CASCADE,
    action_number               text,
    title                       text NOT NULL,
    description                 text,
    responsible_party           text,
    planned_completion_date     date,
    actual_completion_date      date,
    status                      text NOT NULL DEFAULT 'PENDING'
                                CHECK (status IN (
                                    'PENDING', 'IN_PROGRESS', 'SUBMITTED',
                                    'ACCEPTED', 'REJECTED', 'OVERDUE'
                                )),
    verification_notes          text,
    verified_by                 text REFERENCES inspection.inspectors(id),
    verified_at                 timestamp with time zone,
    created_at                  timestamp with time zone NOT NULL DEFAULT now(),
    updated_at                  timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resident_ca_issue
    ON tpi.resident_corrective_actions (resident_quality_issue_id);
CREATE INDEX IF NOT EXISTS idx_resident_ca_status
    ON tpi.resident_corrective_actions (status);

-- ============================================================================
-- 3. ITP Monitoring (hold/witness/surveillance/review points)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tpi.resident_itp_monitoring (
    id                          text PRIMARY KEY,
    resident_engagement_id      text NOT NULL
                                REFERENCES tpi.resident_engagements(id)
                                ON DELETE CASCADE,
    itp_reference               text,
    activity_description        text NOT NULL,
    point_type                  text NOT NULL
                                CHECK (point_type IN (
                                    'HOLD', 'WITNESS', 'SURVEILLANCE', 'REVIEW'
                                )),
    planned_date                date,
    actual_date                 date,
    status                      text NOT NULL DEFAULT 'PENDING'
                                CHECK (status IN (
                                    'PENDING', 'SATISFIED', 'WAIVED',
                                    'FAILED', 'DEFERRED'
                                )),
    inspected_by                text REFERENCES inspection.inspectors(id),
    result_notes                text,
    documents_reviewed          text[],
    created_at                  timestamp with time zone NOT NULL DEFAULT now(),
    updated_at                  timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resident_itp_engagement
    ON tpi.resident_itp_monitoring (resident_engagement_id);
CREATE INDEX IF NOT EXISTS idx_resident_itp_status
    ON tpi.resident_itp_monitoring (status);

-- ============================================================================
-- 4. Periodic Reports (daily / weekly / monthly / final)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tpi.resident_periodic_reports (
    id                          text PRIMARY KEY,
    resident_engagement_id      text NOT NULL
                                REFERENCES tpi.resident_engagements(id)
                                ON DELETE CASCADE,
    report_type                 text NOT NULL
                                CHECK (report_type IN (
                                    'DAILY', 'WEEKLY', 'MONTHLY', 'FINAL'
                                )),
    report_period_start         date NOT NULL,
    report_period_end           date NOT NULL,
    title                       text NOT NULL,
    summary                     text NOT NULL,
    achievements                text,
    issues_and_challenges       text,
    recommendations             text,
    man_days_summary            text,
    quality_issues_summary      text,
    status                      text NOT NULL DEFAULT 'DRAFT'
                                CHECK (status IN (
                                    'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'
                                )),
    submitted_by                text REFERENCES core.users(id),
    submitted_at                timestamp with time zone,
    approved_by                 text REFERENCES core.users(id),
    approved_at                 timestamp with time zone,
    approval_notes              text,
    file_url                    text,
    created_at                  timestamp with time zone NOT NULL DEFAULT now(),
    updated_at                  timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resident_reports_engagement
    ON tpi.resident_periodic_reports (resident_engagement_id);
CREATE INDEX IF NOT EXISTS idx_resident_reports_status
    ON tpi.resident_periodic_reports (status);

-- ============================================================================
-- 5. Closeout (formal terminal phase)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tpi.resident_closeouts (
    id                          text PRIMARY KEY,
    resident_engagement_id      text NOT NULL UNIQUE
                                REFERENCES tpi.resident_engagements(id)
                                ON DELETE CASCADE,
    status                      text NOT NULL DEFAULT 'NOT_STARTED'
                                CHECK (status IN (
                                    'NOT_STARTED', 'IN_PROGRESS',
                                    'READY_FOR_REVIEW', 'APPROVED', 'REJECTED'
                                )),
    punch_list_items            text[],
    documentation_checklist     jsonb,
    final_report_id             text
                                REFERENCES tpi.resident_periodic_reports(id)
                                ON DELETE SET NULL,
    lessons_learned             text,
    handover_notes              text,
    prepared_by                 text REFERENCES core.users(id),
    prepared_at                 timestamp with time zone,
    reviewed_by                 text REFERENCES core.users(id),
    reviewed_at                 timestamp with time zone,
    approved_by                 text REFERENCES core.users(id),
    approved_at                 timestamp with time zone,
    approved_notes              text,
    created_at                  timestamp with time zone NOT NULL DEFAULT now(),
    updated_at                  timestamp with time zone NOT NULL DEFAULT now()
);

-- ============================================================================
-- 6. Activity Evidence (photos / documents attached to daily activities)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tpi.resident_activity_evidence (
    id                          text PRIMARY KEY,
    resident_daily_activity_id  text NOT NULL
                                REFERENCES tpi.resident_activities(id)
                                ON DELETE CASCADE,
    file_name                   text NOT NULL,
    file_path                   text NOT NULL,
    file_size                   bigint,
    mime_type                   text,
    description                 text,
    uploaded_by                 text REFERENCES core.users(id),
    created_at                  timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resident_evidence_activity
    ON tpi.resident_activity_evidence (resident_daily_activity_id);

-- ============================================================================
-- Comments documentation
-- ============================================================================
COMMENT ON TABLE tpi.resident_quality_issues IS
    'Quality findings raised during a resident engagement, with status tracking.';
COMMENT ON TABLE tpi.resident_corrective_actions IS
    'Corrective actions responding to resident quality issues.';
COMMENT ON TABLE tpi.resident_itp_monitoring IS
    'ITP hold/witness/surveillance/review points tracked per engagement.';
COMMENT ON TABLE tpi.resident_periodic_reports IS
    'Periodic (daily/weekly/monthly/final) reports for resident engagements.';
COMMENT ON TABLE tpi.resident_closeouts IS
    'Formal closeout phase: punch list, documentation checklist, handover, lessons learned.';
COMMENT ON TABLE tpi.resident_activity_evidence IS
    'File evidence (photos, documents) attached to daily resident activities.';

COMMIT;
