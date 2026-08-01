# ENTERPRISE ARCHITECTURE

## Principles

DDD

Clean Architecture

CQRS where appropriate

Repository Pattern

SOLID

Dependency Injection

Feature Based Organization

---

# Layers

app/

Application bootstrap.

Routing.

Providers.

Configuration.

Dependency Injection.

No business logic.

---

application/

Use Cases.

Commands.

Queries.

DTOs.

Application Services.

Transactions.

Permissions.

Orchestration.

---

domain/

Entities

Aggregates

Value Objects

Policies

Specifications

Domain Services

Events

Business Rules

No framework dependency.

---

repositories/

Interfaces

Repository implementations

Caching

Persistence abstraction

Unit of Work

---

infrastructure/

Supabase

HTTP

Storage

Realtime

Authentication

Logging

Telemetry

External APIs

---

# Dependency Flow

UI

↓

Application

↓

Domain

↓

Repositories

↓

Infrastructure

---

# Feature Structure

feature/

application/

domain/

repositories/

infrastructure/

ui/

---

# Forbidden

UI -> Infrastructure

Feature -> Feature

Repository -> UI

Infrastructure -> Domain

Domain -> React

Domain -> Supabase

Application -> React Components

---

# State Management

Global state only when necessary.

Prefer feature-local state.

Use optimistic updates.

Snapshot before mutation.

Rollback on failure.

---

# Naming

Business names.

No abbreviations.

No generic names.

Bad:

Utils

Helpers

Manager

Service

Good:

InspectionRepository

ApproveInspection

InspectionPolicy

ContractAggregate

InvoiceFactory

InspectionChecklist

---

# Testing

Domain:

100% deterministic

Application:

mock repositories

Repositories:

integration tests

UI:

component tests
