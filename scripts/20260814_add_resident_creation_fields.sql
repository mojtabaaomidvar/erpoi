-- Add the references and database-backed taxonomy selections required by the
-- dedicated Resident TPI creation workflow.

BEGIN;

ALTER TABLE tpi.resident_engagements
    ADD COLUMN IF NOT EXISTS site_representative_id text,
    ADD COLUMN IF NOT EXISTS disciplines text[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS inspection_scope_ids text[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS inspection_scopes text[] NOT NULL DEFAULT '{}';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'resident_engagements_site_representative_id_fkey'
          AND conrelid = 'tpi.resident_engagements'::regclass
    ) THEN
        ALTER TABLE tpi.resident_engagements
            ADD CONSTRAINT resident_engagements_site_representative_id_fkey
            FOREIGN KEY (site_representative_id)
            REFERENCES core.users(id);
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_resident_engagements_site_representative
    ON tpi.resident_engagements (site_representative_id);

COMMENT ON COLUMN tpi.resident_engagements.disciplines IS
    'All active values from the database-backed TPI_DISCIPLINE system list, assigned automatically on creation.';

COMMENT ON COLUMN tpi.resident_engagements.inspection_scope_ids IS
    'Legacy equipment taxonomy identifiers; not collected by the Resident creation flow.';

ALTER TABLE inspection.document_reviews
    ADD COLUMN IF NOT EXISTS resident_engagement_id text;

-- A document review has one of two aggregate owners: a SPOT inspection request
-- or a Resident engagement. Older deployed schemas may have made the SPOT
-- owner mandatory, so relax that legacy constraint before inserting Resident
-- documents. Existing SPOT rows and behavior are unchanged.
ALTER TABLE inspection.document_reviews
    ALTER COLUMN inspection_request_id DROP NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'document_reviews_resident_engagement_id_fkey'
          AND conrelid = 'inspection.document_reviews'::regclass
    ) THEN
        ALTER TABLE inspection.document_reviews
            ADD CONSTRAINT document_reviews_resident_engagement_id_fkey
            FOREIGN KEY (resident_engagement_id)
            REFERENCES tpi.resident_engagements(id)
            ON DELETE CASCADE;
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_document_reviews_resident_engagement
    ON inspection.document_reviews (resident_engagement_id);

COMMENT ON COLUMN inspection.document_reviews.inspection_request_id IS
    'Owning SPOT inspection request; null when resident_engagement_id owns the document.';

COMMENT ON COLUMN inspection.document_reviews.resident_engagement_id IS
    'Owning Resident engagement; null for SPOT inspection request documents.';

COMMIT;