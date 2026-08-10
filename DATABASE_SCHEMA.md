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

- `observations`: Inspection observations
  - `id`: Primary key
  - `request_id`: Reference to inspection request
  - `equipment_id`: Reference to equipment
  - `inspection_method`: Method of inspection
  - `checklist_item_id`: Reference to checklist item
  - `checklist_text`: Original checklist text
  - `observation_text`: Detailed observation
  - `category`: Observation category

- `non_conformities`: Non-conformity reports
  - `id`: Primary key
  - `inspection_id`: Reference to inspection
  - `ncr_number`: NCR number
  - `title`, `description`: NCR details
  - `severity`: Enum (MINOR, MAJOR, CRITICAL)
  - `status`: Enum (OPEN, CORRECTIVE_ACTION, VERIFICATION, CLOSED)
  - `location_found`: Where issue was found
  - `photos`: Array of photo references
  - `corrective_action`, `root_cause`, `preventive_action`: Resolution details

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
  - `inspection_request_id`: Reference to inspection request
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
