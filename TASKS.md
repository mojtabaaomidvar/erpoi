# ROADMAP

## Phase 1

Foundation

- Authentication
- Users
- Roles
- Permissions
- Layout
- Theme
- Navigation

---

## Current Sprint: Unify TPI Resident Domain

### Impact Analysis - ResidentInspection vs ResidentEngagement

#### Duplicated Concepts

| Concept       | TPI Module (Legacy)                    | Resident Module (New)                                                         |
| ------------- | -------------------------------------- | ----------------------------------------------------------------------------- |
| Core Entity   | `ResidentInspection`                   | `ResidentEngagement`                                                          |
| Table         | `tpi.resident_inspections`             | `tpi.resident_engagements`                                                    |
| Repository    | `IResidentInspectionRepository`        | `IResidentEngagementRepository`                                               |
| App Service   | `ResidentInspectionApplicationService` | `ResidentEngagementApplicationService`                                        |
| Status Values | `ACTIVE`, `COMPLETED`, `SUSPENDED`     | `DRAFT`, `PLANNED`, `ACTIVE`, `COMPLETED`, `CLOSED`, `SUSPENDED`, `CANCELLED` |
| Parent Link   | `tpi_request_id`                       | `project_id`, `client_id`, `contract_id`                                      |

#### Key Differences

1. **ResidentInspection** (TPI): Tied to TPI Request, minimal fields, simple status machine
2. **ResidentEngagement** (Resident): Standalone aggregate, rich domain (assignments, activities, mandays, quality, ITP, lookahead, reports, closeout), full lifecycle policy

#### Dependent UI

- `src/features/tpi-management/ui/ResidentDashboard.tsx` → uses legacy `residentInspectionAppService`
- `src/features/resident-inspection/ui/ResidentEngagementList.tsx`, `ResidentEngagementForm.tsx`, `ResidentEngagementDetail.tsx` → uses new services

#### Migration Strategy

1. Create canonical `TPIEngagement` domain in a shared location (or new feature module)
2. Implement unified repository interface extending both legacy and new capabilities
3. Create adapters/mappers for backward compatibility
4. Migrate `ResidentDashboard` to use new unified service
5. Deprecate legacy `resident_inspections` table (soft delete, keep for history)
6. Update all imports to use canonical domain

### Implementation Plan

- [x] Analyze current TPI module (domain, application, repositories, UI)
- [x] Analyze current Resident module (domain, application, repositories, UI)
- [x] Analyze inspection-management module and shared types
- [x] Identify database tables and persistence mappings
- [x] Identify duplicated logic and shared concepts
- [x] Produce impact analysis (this entry)
- [ ] Implement canonical TPIEngagement domain
- [ ] Create unified application service
- [ ] Create unified repository interface
- [ ] Create adapters/mappers for legacy compatibility
- [ ] Validate: TypeScript, lint, build
- [ ] Report findings

---

## Phase 2

Inspection Module

- Inspections
- Checklists
- Findings
- NCR
- Attachments
- Approval Workflow

---

## Phase 3

Projects

Contracts

Clients

Inspectors

Assignments

Scheduling

---

## Phase 4

Engineering

TPER

Drawing Review

Document Control

Revision History

---

## Phase 5

Marine Warranty Survey

Marine Operations

Risk Assessment

Certificates

Mobilization

Demobilization

---

## Phase 6

Finance

Invoices

Payments

Expenses

Reports

---

## Phase 7

Reporting

Dashboard

KPIs

Analytics

Exports

---

# Development Rules

Before implementing a task:

Understand requirements.

Search existing code.

Design.

Implement.

Test.

Refactor.

Document.

---

# Definition of Done

Architecture preserved.

Tests pass.

No duplicate code.

No lint errors.

No circular dependencies.

No business logic in UI.

No direct infrastructure access.

Documentation updated.

Ready for production.
