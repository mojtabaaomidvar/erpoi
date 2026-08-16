# Database Schema Documentation

This document provides a comprehensive overview of the database schema for the Inspection ERP system.

## Schema Overview

The database is organized into several schemas based on business domains:

- `core`: Core system tables (users, roles, permissions)
- `crm`: Customer relationship management
- `contracts`: Contract management
- `equipment`: Equipment and checklist management
- `inspection`: Inspection-related data
- `projects`: Project management
- `tpi`: Third party inspection specific tables
- `master_data`: Master data lists

## Schema Details

### 1. Core Schema (`core`)

Contains fundamental system tables for user management and permissions.

#### Tables:

- `departments`: Organizational departments
- `notifications`: System notifications
- `permission_mappings`: User permissions mapping
- `roles`: User roles definitions
- `users`: User accounts

### 2. CRM Schema (`crm`)

Manages client information and relationships.

#### Tables:

- `clients`: Client organizations
  - `id`: Primary key
  - `name_en`, `name_fa`: English and Persian names
  - `type`: Client type
  - `national_id`, `registration_no`, `economic_code`: Identification numbers
  - `phone`, `email`: Contact information
  - `contact_persons`: JSONB field for contact persons
  - `address_en`, `address_fa`: Addresses
  - `department`: Associated departments (array)
  - `emails`: Email addresses (array)

### 3. Contracts Schema (`contracts`)

Manages contract information and related data.

#### Tables:

- `contracts`: Main contract table
  - `id`: Primary key
  - `client_id`: Reference to clients table
  - `contract_no`: Contract number
  - `contract_title`: Contract title
  - `type`: Contract type
  - `status`: Current status
  - `total_value`, `currency`: Financial information
  - `start_date`, `end_date`: Timeline
  - `financial_terms`: Terms as JSONB
  - `department`: Associated department

### 4. Projects Schema (`projects`)

Project management tables.

#### Tables:

- `projects`: Main project table
  - `id`: Primary key
  - `name`: Project name
  - `contract_id`: Reference to contracts table
  - `client_id`: Reference to clients table
  - `description`: Project description
  - `start_date`, `end_date`: Timeline
  - `status`: Current status
  - `service_types`: Service types (array)
  - `department`: Associated department

### 5. Equipment Schema (`equipment`)

Equipment and checklist management.

#### Tables:

- `equipment`: Equipment definitions
  - `id`: Primary key
  - `code`: Equipment code
  - `name`: Equipment name
  - `level`: Equipment level
  - `parent_id`: Parent equipment reference
  - `description`: Equipment description
  - `discipline`: Engineering discipline

- `checklist_templates`: Template definitions for checklists
  - `id`: Primary key
  - `name`: Template name
  - `description`: Template description
  - `is_active`: Whether template is active

- `checklist`: Individual checklist items
  - `id`: Primary key
  - `equipment_id`: Reference to equipment table
  - `template_id`: Reference to checklist_templates
  - `inspection_method`: Method of inspection
  - `sequence`: Sequence number
  - `checklist_text`: The actual checklist item text
  - `is_active`: Whether item is active

### 6. Inspection Schema (`inspection`)

Core inspection data and results.

#### Tables:

- `checklist_results`: Results of checklist inspections
  - `id`: Primary key
  - `request_id`: Reference to inspection request
  - `session_id`: Reference to inspection session (NULL = legacy request-level row)
  - `equipment_id`: Reference to equipment
  - `inspection_method`: Method of inspection
  - `item_id`: Reference to checklist item
  - `checklist_text`: Snapshot of the checklist item text
  - `status`: Result status (PASS, REJECT, NOTE, N/A)
  - `comment`: Additional comments
  - `checked_by`, `checked_at`: Audit information
  - `created_by`, `created_at`, `updated_at`: Timestamps

- `inspection_photos`: Photos taken during inspections
  - `id`: Primary key (UUID)
  - `request_id`: Reference to inspection request
  - `equipment_id`: Reference to equipment
  - `checklist_item_id`: Reference to checklist item
  - `file_name`, `file_path`: File information
  - `file_size`, `mime_type`: File metadata
  - `status`: Photo status
  - `description`: Photo description
  - `uploaded_by`: Who uploaded the photo

- `inspection_sessions`: Inspection visit sessions linked to TPI requests
  - `id`: Primary key
  - `tpi_request_id`: Reference to TPI request (FK → tpi.tpi_requests.id)
  - `session_number`: Auto-increment per request (1, 2, 3...)
  - `session_date`: Date of this inspection visit
  - `stages`: Snapshot of stages selected for this session (text array)
  - `methods`: Snapshot of methods selected for this session (text array)
  - `equipment_ids`: Snapshot of equipment ids selected for this session (text array)
  - `status`: inspection_execution_status (SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED)
  - `notes`: Optional notes
  - `is_deleted`: Soft-delete flag; deleted sessions are excluded from operational queries
  - `deleted_at`, `deleted_by`, `deletion_reason`: Immutable deletion audit metadata
  - `created_at`, `updated_at`: Timestamps

- `observations`: Inspection observations represented as package findings
  - `id`: Primary key
  - `request_id`, `session_id`: Owning TPI package and originating inspection session
  - `equipment_id`, `inspection_method`, `checklist_item_id`, `checklist_text`: Checklist origin
  - `title`, `observation_text`, `classification`, `category`: Finding description and classification
  - `revision`, `status`, `location_found`, `evidence`, `photos`: Report and evidence data
  - `document_references`: JSON array of document number, title, revision and clause/section
  - `immediate_containment`, `corrective_action`, `target_completion_date`, `responsible_person`: Optional CAR data
  - `verification`, `closeout_decision`, `closeout_note`, `closeout_date`: Optional close-out data
  - `closed_by`, `closed_at`, `created_by`, `created_at`, `updated_at`: Audit metadata

- `non_conformities`: Non-conformity reports represented as package findings
  - `id`: Primary key
  - `inspection_id`: Legacy inspection reference retained for compatibility
  - `request_id`, `session_id`: Owning TPI package and originating inspection session
  - `ncr_number`, `revision`: Independent NCR identity and form revision
  - `equipment_id`, `inspection_method`, `checklist_item_id`, `checklist_text`: Checklist origin
  - `title`, `description`, `severity`, `category`: Finding description and classification
  - `location_found`, `evidence`, `photos`, `document_references`: Evidence and referenced specifications
  - `immediate_containment`, `corrective_action`, `target_completion_date`, `responsible_person`: CAR workflow
  - `root_cause`, `preventive_action`: Corrective/preventive analysis
  - `verification`, `closeout_decision`, `closeout_note`, `closeout_date`: Verification and close-out
  - `status`: OPEN, CORRECTIVE_ACTION, VERIFICATION, CLOSED, or REJECTED
  - `closed_by`, `closed_at`, `created_by`, `created_at`, `updated_at`: Audit metadata

- `certificates`: Inspection certificates
  - `id`: Primary key
  - `inspection_id`: Reference to inspection
  - `certificate_type`: Type of certificate
  - `certificate_number`: Certificate number
  - `certificate_url`: URL to certificate document
  - `issue_date`, `expiry_date`: Dates
  - `verified_by_ics`, `verified_by`, `verified_at`: Verification details

- `inspection_reports`: Inspection reports
  - `id`: Primary key
  - `inspection_id`: Reference to inspection
  - `report_type`: Enum (IR, IRN, SRN)
  - `report_number`: Report number
  - `report_url`: URL to report document
  - `issued_by`, `issued_at`: Issue details
  - `approved_by`, `approved_at`: Approval details
  - `sent_to_client`, `sent_at`: Delivery information

- `inspectors`: Inspector profiles
  - `id`: Primary key
  - `name_en`, `name_fa`: Names
  - `inspector_type`: Type of inspector
  - `status`: Current status
  - `specialties`: Specialties (array)
  - `phone`, `email`: Contact information
  - `location_base`: Base location
  - `rating`, `completed_inspections`: Performance metrics
  - `user_id`: Reference to user account

- `vendors`: Vendor information
  - `id`: Primary key
  - `name`: Vendor name

- `document_reviews`: Document review process
  - `id`: Primary key
  - `inspection_request_id`: Nullable reference to a SPOT inspection request
  - `resident_engagement_id`: Nullable reference to a Resident engagement; Resident creation documents reuse this table and the existing document storage infrastructure
  - `session_id`: Nullable reference to the inspection session that introduced the document; null identifies legacy unassigned documents
  - `document_type`: Enum (ITP, PROCEDURE, CERTIFICATE, etc.)
  - `document_name`, `document_url`: Document details
  - `review_status`: Current status
  - `comments`: Review comments
  - `reviewed_by`, `reviewed_at`: Review information
  - `verified_by_ics`, `verification_letter_number`, `verification_date`: Verification details

### 7. TPI Schema (`tpi`)

Third Party Inspection specific tables.

#### Tables:

- `tpi_requests`: TPI requests
  - `id`: Primary key
  - `project_id`: Reference to project
  - `client_id`: Reference to client
  - `contract_id`: Reference to contract
  - `category`, `tpi_mode`: TPI classification
  - `disciplines`, `methods`: Technical specifications (arrays)
  - `inspection_date`: Scheduled date
  - `requested_by`: Request initiator
  - `status`: Current status
  - `priority`: Priority level
  - `stages`, `equipment_type_id`: Equipment and stage information (arrays)
  - `is_deleted`: Soft-delete flag set only after the deletion request is approved
  - `deleted_at`, `deleted_by`, `deletion_reason`: Deletion audit metadata
  - `deletion_approval_id`: Reference to the approval request that authorized deletion

- `tpi_inspection_items`: Specific items in TPI requests
  - `id`: Primary key
  - `tpi_request_id`: Reference to TPI request
  - `item_name`, `tag_number`, `description`: Item details
  - `quantity`, `unit`: Quantity information
  - `manufacturer`, `model`, `serial_number`: Equipment details
  - `source_type`, `source_file_url`, `source_file_name`: Source information

- `tpi_inspector_assignments`: Inspector assignments for TPI requests
  - `id`: Primary key
  - `tpi_request_id`: Reference to TPI request
  - `session_id`: Reference to inspection session (NULL = legacy date-linked row)
  - `inspector_id`: Reference to inspector
  - `assigned_by`: Who assigned the inspector
  - `assigned_at`: Assignment timestamp
  - `execution_date`: Scheduled execution date
  - `location`, `vendor_site`: Location details
  - `status`: inspection_execution_status (ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED)
  - `actual_start_time`, `actual_end_time`: Execution timestamps
  - `weather_conditions`, `general_remarks`: Execution notes
  - `cancelled_at`, `cancelled_by`, `cancellation_reason`, `cancellation_notes`: Cancellation details
  - `related_assignment_id`: Reference to the reassigned assignment (for REASSIGNED cancellations)
  - `new_scheduled_date`, `date_is_unknown`: Rescheduling details
  - `new_scope`: New inspection scopes (array, for SCOPE_CHANGED cancellations)
  - `created_at`, `updated_at`: Timestamps

- `mws_inspector_assignments`: Inspector assignments for MWS requests (mirror of the TPI table in the `mws` schema)

- `resident_engagements`: Resident Inspection engagements (root aggregate for the Resident bounded context)
  - `id`: Primary key
  - `project_id`: Reference to projects table (required)
  - `client_id`: Reference to clients table
  - `contract_id`: Reference to contracts table
  - `department`, `title`, `scope_of_work`, `location`: Engagement description and scope
  - `site_representative_id`: Reference to the selected `core.users` Site Representative
  - `disciplines`: All active database-backed TPI discipline values, assigned automatically when the engagement is created
  - `inspection_scope_ids`, `inspection_scopes`: Legacy scope arrays retained for compatibility; not collected by Resident creation
  - `planned_start_date`, `planned_end_date`, `actual_start_date`, `actual_end_date`: Timeline (planned and actual)
    - `status`: DRAFT, PLANNED, ACTIVE, COMPLETED, CANCELLED, SUSPENDED, or CLOSED
  - `lead_inspector_id`: Reference to inspectors table
  - `client_representative`, `notes`: Contact and notes
  - `is_deleted`, `deleted_at`, `deleted_by`, `deletion_reason`: Soft-delete metadata
  - `created_at`, `updated_at`, `created_by`: Audit metadata

- `resident_assignments`: Inspector assignments to Resident engagements
  - `id`: Primary key
  - `resident_engagement_id`: Reference to resident_engagements
  - `inspector_id`: Reference to inspectors table
  - `planned_start_date`, `planned_end_date`, `actual_start_date`, `actual_end_date`: Assignment period
  - `assignment_status`: ASSIGNED, ACTIVE, RELIEVED, COMPLETED, or CANCELLED
  - `relief_reason`, `relieved_at`, `relieved_by`, `replaced_by_assignment_id`: Relief/replacement data
  - `notes`, `created_at`, `updated_at`, `created_by`: Metadata
  - Unique: (resident_engagement_id, inspector_id, planned_start_date)

- `resident_activities`: Daily operational activities log for engagements
  - `id`: Primary key
  - `resident_engagement_id`: Reference to resident_engagements
  - `activity_date`: Date of activity
  - `activity_type`: ROUTINE_INSPECTION, SURVEILLANCE, WITNESS_POINT, HOLD_POINT, DOCUMENT_REVIEW, MEETING, SITE_WALK, ITP_MONITORING, QUALITY_CHECK, or OTHER
  - `title`, `description`, `location`: Activity details
  - `activity_status`: PLANNED, IN_PROGRESS, COMPLETED, CANCELLED, or DEFERRED
  - `result_outcome`, `deferral_reason`: Execution outcome
  - `performed_by`: Lead inspector (FK to inspectors)
  - `planned_start_time`, `planned_end_time`, `actual_start_time`, `actual_end_time`: Timing
  - `linked_assignment_id`: Link to assignment (if applicable)
  - `created_at`, `updated_at`, `created_by`: Metadata
  - Unique: (resident_engagement_id, activity_date, title)

- `resident_mandays`: Per-inspector daily record supporting timesheet and billing
  - `id`: Primary key
  - `resident_engagement_id`: Reference to resident_engagements
  - `resident_assignment_id`: Reference to resident_assignments
  - `work_date`: Date of work
  - `day_of_week`: Day of week (0-6)
  - `attendance_status`: PRESENT, ABSENT, LATE, LEAVE, SICK, or REMOTE
  - `activity_type`: INSPECTION, SURVEILLANCE, MEETING, DOCUMENT_REVIEW, TRAVEL, TRAINING, or OTHER
  - `hours_worked`, `overtime_hours`: Hours worked (0-24)
  - `remarks`: Notes
  - `is_billable`: Whether hours are billable
  - `created_at`, `updated_at`, `created_by`: Metadata
  - Unique: (resident_assignment_id, work_date)

- `resident_lookahead_activities`: Planned future activities (lookahead window)
  - `id`: Primary key
  - `resident_engagement_id`: Reference to resident_engagements
  - `title`, `description`: Activity description
  - `planned_start_date`, `planned_end_date`: Planning window
  - `priority`: 1-5 (1 highest)
  - `lookahead_status`: PLANNED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, or DEFERRED
  - `required_resources`: Notes on required resources
  - `linked_activity_id`: Link to executed activity
    - `notes`, `created_at`, `updated_at`, `created_by`: Metadata
  - Unique: (resident_engagement_id, title, planned_start_date)

- `resident_quality_issues`: Quality findings raised during a resident engagement
  - `id`: Primary key
  - `resident_engagement_id`: Reference to resident_engagements
  - `resident_daily_activity_id`: Optional link to the daily activity that raised the issue
  - `issue_number`: Independent issue number
  - `title`, `description`: Issue details
  - `severity`: MINOR, MAJOR, or CRITICAL
  - `status`: OPEN, CORRECTIVE_ACTION, VERIFICATION, CLOSED, or REJECTED
  - `location_found`, `vendor_or_equipment`: Finding context
  - `raised_by`, `raised_date`: Raised by inspector on date
  - `closed_by`, `closed_date`, `closed_notes`: Closure audit
  - `created_at`, `updated_at`: Timestamps

- `resident_corrective_actions`: Corrective actions responding to resident quality issues
  - `id`: Primary key
  - `resident_quality_issue_id`: Reference to resident_quality_issues
  - `action_number`, `title`, `description`: Action details
  - `responsible_party`: Who owns the action
  - `planned_completion_date`, `actual_completion_date`: Completion timeline
  - `status`: PENDING, IN_PROGRESS, SUBMITTED, ACCEPTED, REJECTED, or OVERDUE
  - `verification_notes`, `verified_by`, `verified_at`: Verification audit
  - `created_at`, `updated_at`: Timestamps

- `resident_itp_monitoring`: ITP hold/witness/surveillance/review points tracked per engagement
  - `id`: Primary key
  - `resident_engagement_id`: Reference to resident_engagements
  - `itp_reference`: Reference to the ITP document
  - `activity_description`: Description of the monitored point
  - `point_type`: HOLD, WITNESS, SURVEILLANCE, or REVIEW
  - `planned_date`, `actual_date`: Planned and actual execution dates
  - `status`: PENDING, SATISFIED, WAIVED, FAILED, or DEFERRED
  - `inspected_by`: Reference to inspectors table
  - `result_notes`, `documents_reviewed`: Result details and reviewed documents (array)
  - `created_at`, `updated_at`: Timestamps

- `resident_periodic_reports`: Periodic (daily/weekly/monthly/final) reports for resident engagements
  - `id`: Primary key
  - `resident_engagement_id`: Reference to resident_engagements
  - `report_type`: DAILY, WEEKLY, MONTHLY, or FINAL
  - `report_period_start`, `report_period_end`: Covered period
  - `title`, `summary`: Report identity and summary
  - `achievements`, `issues_and_challenges`, `recommendations`: Narrative sections
  - `man_days_summary`, `quality_issues_summary`: Aggregated summaries
  - `status`: DRAFT, SUBMITTED, APPROVED, or REJECTED
  - `submitted_by`, `submitted_at`, `approved_by`, `approved_at`, `approval_notes`: Workflow audit
  - `file_url`: Attached report file
  - `created_at`, `updated_at`: Timestamps

- `resident_closeouts`: Formal closeout phase for a resident engagement
  - `id`: Primary key
  - `resident_engagement_id`: Unique reference to resident_engagements
  - `status`: NOT_STARTED, IN_PROGRESS, READY_FOR_REVIEW, APPROVED, or REJECTED
  - `punch_list_items`: Punch list (array)
  - `documentation_checklist`: Documentation handover checklist (JSONB)
  - `final_report_id`: Reference to the FINAL resident_periodic_reports entry
  - `lessons_learned`, `handover_notes`: Closeout narrative
  - `prepared_by`, `prepared_at`, `reviewed_by`, `reviewed_at`, `approved_by`, `approved_at`, `approved_notes`: Workflow audit
  - `created_at`, `updated_at`: Timestamps

- `resident_activity_evidence`: File evidence (photos, documents) attached to daily resident activities
  - `id`: Primary key
  - `resident_daily_activity_id`: Reference to resident_activities
  - `file_name`, `file_path`: File information
  - `file_size`, `mime_type`: File metadata
  - `description`: Evidence description
  - `uploaded_by`: Reference to core.users table
  - `created_at`: Timestamp

### 8. Master Data Schema (`master_data`)

- `pending_approvals`: Shared approval inbox for master-data values and governed entity operations
  - `id`: Primary key
  - `field_type`: Approval classification; `TPI_PACKAGE_DELETION` identifies package deletion requests
  - `proposed_value`: Proposed master-data value or deletion reason
  - `request_type`: `MASTER_DATA_VALUE` or `ENTITY_DELETION`
  - `entity_type`, `entity_id`: Target entity identity for governed operations
  - `request_payload`: JSON snapshot used to present the request without coupling UI features
  - `requested_by`, `requested_at`: Request audit fields
  - `status`: PENDING, APPROVED, or REJECTED
  - `reviewed_by`, `reviewed_at`, `rejection_reason`, `final_value`: Review audit fields
  - Only one PENDING entity-deletion approval may exist for the same entity

## Enum Types

Several custom enum types are defined in the database:

- `ncr_severity`: Values [MINOR, MAJOR, CRITICAL]
- `ncr_status`: Values [OPEN, CORRECTIVE_ACTION, VERIFICATION, CLOSED]
- `report_type`: Values [IR, IRN, SRN]
- `document_type`: Values [ITP, PROCEDURE, CERTIFICATE, DRAWING, OTHER]
- `checklist_category`: Values [VISUAL, DIMENSIONAL, MATERIAL, WELDING, NDT, COATING, PACKAGING, DOCUMENTATION, OTHER]
- `inspection_status`: Values [PENDING, DOCUMENT_REVIEW, APPROVED, IN_PROGRESS, COMPLETED, REJECTED]
- `inspection_execution_status`: Values [SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED]

## Key Relationships

- TPI requests link to projects, contracts, and clients
- TPI inspection items link to TPI requests
- Checklists link to equipment and templates
- Checklist results link to TPI requests, equipment, and checklist items
- Observations link to TPI requests and equipment
- Non-conformities link to inspections
- Certificates and inspection reports link to inspections
- Photos link to inspection requests, equipment, and checklist items

## Data Flow

1. Clients initiate contracts
2. Contracts are associated with projects
3. TPI requests are created for projects
4. Equipment and checklists are defined for inspections
5. During inspection, checklist results are recorded
6. Non-conformities and observations are documented
7. Photos are attached to specific checklist items
8. Reports and certificates are generated
9. All data is linked back to original request

## Notes

This schema supports a comprehensive inspection management workflow from initial request through final certification. The modular schema design allows for scaling and potential microservice architecture in the future.
