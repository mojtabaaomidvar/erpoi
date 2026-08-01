# ARCHITECTURE DECISIONS

This document records architectural decisions.

These decisions are final unless explicitly changed.

AI must follow them.

---

# ADR-001

Title

Domain Driven Design

Decision

Business rules belong in Domain.

Reason

Business logic must be reusable across UI, APIs and future services.

Status

Accepted

---

# ADR-002

Title

Clean Architecture

Decision

Dependency direction is fixed.

UI

↓

Application

↓

Domain

↓

Repositories

↓

Infrastructure

Status

Accepted

---

# ADR-003

Title

Repository Pattern

Decision

Repositories are the only persistence layer.

No direct database access.

No direct Supabase access.

No HTTP requests outside repositories.

Status

Accepted

---

# ADR-004

Title

Optimistic UI

Decision

Every CRUD operation is optimistic.

Process

Snapshot

↓

Immediate UI Update

↓

Background Persistence

↓

Rollback if needed

Status

Accepted

---

# ADR-005

Title

Feature Isolation

Decision

Features are independent.

Features never import each other.

Communication happens through

Application Layer

or

Domain Events

or

EventBus

Status

Accepted

---

# ADR-006

Title

State Management

Decision

Global state is minimized.

Prefer feature-local state.

Use global state only when shared.

Status

Accepted

---

# ADR-007

Title

Dependency Injection

Decision

Dependencies must be injected.

Avoid static singletons.

Avoid hidden dependencies.

Status

Accepted

---

# ADR-008

Title

Naming

Decision

Names describe business.

Avoid technical names.

Bad

Manager

Helper

Util

Good

InspectionRepository

ApproveInspection

InspectionPolicy

Status

Accepted

---

# ADR-009

Title

Scalability

Decision

Every module should support future extraction into a microservice.

No module should depend on implementation details.

Status

Accepted

---

# ADR-010

Title

Backward Compatibility

Decision

Prefer extending existing abstractions.

Breaking APIs requires explicit approval.

Status

Accepted

---

# ADR-011

Title

Performance

Decision

Optimize only after correctness and architecture.

Premature optimization is prohibited.

Status

Accepted

---

# ADR-012

Title

Code Review Checklist

Before every commit verify

No duplicated logic

No circular dependencies

No architecture violations

No business logic in UI

No direct infrastructure access

Tests still pass

Maintainability improved
