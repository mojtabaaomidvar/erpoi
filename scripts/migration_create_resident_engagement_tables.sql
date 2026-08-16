-- =============================================================================
-- Migration 1: Create Resident Inspection Engagement Tables
-- =============================================================================
-- Purpose: Establish the core Resident Inspection bounded context schema.
--
-- This migration creates the primary aggregate root table for Resident
-- Engagements and all directly owned child entities for the operational
-- sub-domains: Assignments, Activities, Man-Days, and Lookahead planning.
--
-- CONSOLIDATES: The legacy tables `tpi.resident_inspections`,
-- `tpi.inspector_attendance`, and `tpi.monthly_reports` are deprecated.
-- Existing data should be reviewed before final production migration.
-- =============================================================================

BEGIN;

-- ============================================================================
-- 1. Core aggregate: resident_engagements
-- ============================================================================
CREATE TABLE IF NOT EXISTS tpi.resident_engagements (
    id                          text PRIMARY KEY,
    project_id                  text NOT NULL REFERENCES projects.projects(id),
    client_id                   text REFERENCES crm.clients(id),
    contract_id                 text REFERENCES contracts.contracts(id),
    department                  text,
    title                       text NOT NULL,
    scope_of_work               text,
    location                    text,
    planned_start_date          date NOT NULL,
    planned_end_date            date,
    actual_start_date           date,
    actual_end_date             date,
    status                      text NOT NULL DEFAULT 'DRAFT'
                                CHECK (status IN (
                                    'DRAFT', 'PLANNED', 'ACTIVE',
                                    'COMPLETED', 'CANCELLED', 'SUSPENDED',
                                    'CLOSED'
                                )),
    lead_inspector_id           text REFERENCES inspection.inspectors(id),
    client_representative       text,
    notes                       text,
    -- Soft delete (per DONAIN.md business rule)
    is_deleted                  boolean NOT NULL DEFAULT false,
    deleted_at                  timestamp with time zone,
    deleted_by                  text REFERENCES core.users(id),
    deletion_reason             text,
    -- Audit
    created_at                  timestamp with time zone NOT NULL DEFAULT now(),
    updated_at                  timestamp with time zone NOT NULL DEFAULT now(),
    created_by                  text REFERENCES core.users(id)
);

CREATE INDEX IF NOT EXISTS idx_resident_engagements_project
    ON tpi.resident_engagements (project_id);

CREATE INDEX IF NOT EXISTS idx_resident_engagements_client
    ON tpi.resident_engagements (client_id);

CREATE INDEX IF NOT EXISTS idx_resident_engagements_status
    ON tpi.resident_engagements (status);

CREATE INDEX IF NOT EXISTS idx_resident_engagements_deleted
    ON tpi.resident_engagements (is_deleted) WHERE NOT is_deleted;

-- ============================================================================
-- 2. Resident Assignments (inspector allocation to engagement)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tpi.resident_assignments (
    id                          text PRIMARY KEY,
    resident_engagement_id      text NOT NULL
                                REFERENCES tpi.resident_engagements(id)
                                ON DELETE CASCADE,
    inspector_id                text NOT NULL
                                REFERENCES inspection.inspectors(id),
    planned_start_date          date NOT NULL,
    planned_end_date            date,
    actual_start_date           date,
    actual_end_date             date,
    assignment_status           text NOT NULL DEFAULT 'ASSIGNED'
                                CHECK (assignment_status IN (
                                    'ASSIGNED', 'ACTIVE', 'RELIEVED',
                                    'COMPLETED', 'CANCELLED'
                                )),
    relief_reason               text,
    relieved_at                 timestamp with time zone,
    relieved_by                 text REFERENCES core.users(id),
    replaced_by_assignment_id   text REFERENCES tpi.resident_assignments(id),
    notes                       text,
    created_at                  timestamp with time zone NOT NULL DEFAULT now(),
    updated_at                  timestamp with time zone NOT NULL DEFAULT now(),
    created_by                  text REFERENCES core.users(id),
    UNIQUE (resident_engagement_id, inspector_id, planned_start_date)
);

CREATE INDEX IF NOT EXISTS idx_resident_assignments_engagement
    ON tpi.resident_assignments (resident_engagement_id);

CREATE INDEX IF NOT EXISTS idx_resident_assignments_inspector
    ON tpi.resident_assignments (inspector_id);

-- ============================================================================
-- 3. Daily Activities (continuous operational log)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tpi.resident_activities (
    id                          text PRIMARY KEY,
    resident_engagement_id      text NOT NULL
                                REFERENCES tpi.resident_engagements(id)
                                ON DELETE CASCADE,
    activity_date               date NOT NULL,
    activity_type               text NOT NULL
                                CHECK (activity_type IN (
                                    'ROUTINE_INSPECTION', 'SURVEILLANCE',
                                    'WITNESS_POINT', 'HOLD_POINT',
                                    'DOCUMENT_REVIEW', 'MEETING',
                                    'SITE_WALK', 'ITP_MONITORING',
                                    'QUALITY_CHECK', 'OTHER'
                                )),
    title                       text NOT NULL,
    description                 text,
    location                    text,
    activity_status             text NOT NULL DEFAULT 'PLANNED'
                                CHECK (activity_status IN (
                                    'PLANNED', 'IN_PROGRESS',
                                    'COMPLETED', 'CANCELLED', 'DEFERRED'
                                )),
    result_outcome              text,
    deferral_reason             text,
    performed_by                text
                                REFERENCES inspection.inspectors(id),
    planned_start_time          time without time zone,
    planned_end_time            time without time zone,
    actual_start_time           time without time zone,
    actual_end_time             time without time zone,
    linked_assignment_id        text
                                REFERENCES tpi.resident_assignments(id),
    created_at                  timestamp with time zone NOT NULL DEFAULT now(),
    updated_at                  timestamp with time zone NOT NULL DEFAULT now(),
    created_by                  text REFERENCES core.users(id),
    UNIQUE (resident_engagement_id, activity_date, title)
);

CREATE INDEX IF NOT EXISTS idx_resident_activities_engagement
    ON tpi.resident_activities (resident_engagement_id);

CREATE INDEX IF NOT EXISTS idx_resident_activities_date
    ON tpi.resident_activities (activity_date);

CREATE INDEX IF NOT EXISTS idx_resident_activities_status
    ON tpi.resident_activities (activity_status);

-- ============================================================================
-- 4. Man-Days / Timesheets (per-inspector daily record)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tpi.resident_mandays (
    id                          text PRIMARY KEY,
    resident_engagement_id      text NOT NULL
                                REFERENCES tpi.resident_engagements(id)
                                ON DELETE CASCADE,
    resident_assignment_id      text NOT NULL
                                REFERENCES tpi.resident_assignments(id)
                                ON DELETE CASCADE,
    work_date                   date NOT NULL,
    day_of_week                 smallint
                                CHECK (day_of_week BETWEEN 0 AND 6),
    attendance_status           text NOT NULL DEFAULT 'PRESENT'
                                CHECK (attendance_status IN (
                                    'PRESENT', 'ABSENT', 'LATE',
                                    'LEAVE', 'SICK', 'REMOTE'
                                )),
    activity_type               text
                                CHECK (activity_type IN (
                                    'INSPECTION', 'SURVEILLANCE',
                                    'MEETING', 'DOCUMENT_REVIEW',
                                    'TRAVEL', 'TRAINING', 'OTHER'
                                )),
    hours_worked                numeric(4,2)
                                CHECK (hours_worked >= 0 AND hours_worked <= 24),
    overtime_hours              numeric(4,2)
                                CHECK (overtime_hours >= 0 AND overtime_hours <= 24),
    remarks                     text,
    is_billable                 boolean NOT NULL DEFAULT true,
    created_at                  timestamp with time zone NOT NULL DEFAULT now(),
    updated_at                  timestamp with time zone NOT NULL DEFAULT now(),
    created_by                  text REFERENCES core.users(id),
    UNIQUE (resident_assignment_id, work_date)
);

CREATE INDEX IF NOT EXISTS idx_resident_mandays_assignment
    ON tpi.resident_mandays (resident_assignment_id);

CREATE INDEX IF NOT EXISTS idx_resident_mandays_date
    ON tpi.resident_mandays (work_date);

CREATE INDEX IF NOT EXISTS idx_resident_mandays_engagement
    ON tpi.resident_mandays (resident_engagement_id);

-- ============================================================================
-- 5. Lookahead Activities (planned future work)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tpi.resident_lookahead_activities (
    id                          text PRIMARY KEY,
    resident_engagement_id      text NOT NULL
                                REFERENCES tpi.resident_engagements(id)
                                ON DELETE CASCADE,
    title                       text NOT NULL,
    description                 text,
    planned_start_date          date NOT NULL,
    planned_end_date            date,
    priority                    integer DEFAULT 3
                                CHECK (priority BETWEEN 1 AND 5),
    lookahead_status            text NOT NULL DEFAULT 'PLANNED'
                                CHECK (lookahead_status IN (
                                    'PLANNED', 'CONFIRMED',
                                    'IN_PROGRESS', 'COMPLETED',
                                    'CANCELLED', 'DEFERRED'
                                )),
    required_resources          text,
    linked_activity_id          text
                                REFERENCES tpi.resident_activities(id),
    notes                       text,
    created_at                  timestamp with time zone NOT NULL DEFAULT now(),
    updated_at                  timestamp with time zone NOT NULL DEFAULT now(),
    created_by                  text REFERENCES core.users(id),
    UNIQUE (resident_engagement_id, title, planned_start_date)
);

CREATE INDEX IF NOT EXISTS idx_resident_lookahead_engagement
    ON tpi.resident_lookahead_activities (resident_engagement_id);

CREATE INDEX IF NOT EXISTS idx_resident_lookahead_planned
    ON tpi.resident_lookahead_activities (planned_start_date);

-- ============================================================================
-- Comments documentation
-- ============================================================================
COMMENT ON TABLE tpi.resident_engagements IS
    'Root aggregate for Resident Inspection bounded context. Represents a continuous on-site inspection presence for a project.';
COMMENT ON TABLE tpi.resident_assignments IS
    'Inspector allocations to a Resident Engagement. Tracks assignment period, status, and relief history.';
COMMENT ON TABLE tpi.resident_activities IS
    'Daily operational log: all activities (inspections, surveillance, meetings) recorded against an engagement.';
COMMENT ON TABLE tpi.resident_mandays IS
    'Per-inspector daily records supporting timesheet, billing, and man-day utilization tracking.';
COMMENT ON TABLE tpi.resident_lookahead_activities IS
    'Planned future activities aggregated into a lookahead window for proactive resource coordination.';

COMMIT;
