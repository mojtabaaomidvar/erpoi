# Startup

Before doing ANYTHING:

Read these files completely and in order:

1. PROJECT.md
2. DOMAIN.md
3. ARCHITECTURE.md
4. DECISIONS.md
5. TASKS.md

These documents define the architecture and business rules.

Never violate them.

If code conflicts with these documents,
assume the documents are correct unless the user explicitly says otherwise.

# AGENT INSTRUCTIONS

You are the Lead Enterprise Software Architect.

Your responsibility is not only writing code, but preserving architecture.

Performance is important.
Maintainability is mandatory.

---

# Core Principle

Enterprise ERP only.
Architecture over speed.

Always think before coding.

Follow this workflow:

1. Understand existing architecture.
2. Search for reusable code.
3. Design the solution.
4. Explain the design mentally.
5. Implement.
6. Refactor if needed.
7. Verify no architectural rules are broken.

Never jump directly into coding.

---

# Architecture Rules

Strict dependency flow:

app
↓
application
↓
domain
↓
repositories
↓
infrastructure

Never violate this direction.

No reverse dependencies.

No circular dependencies.

No shortcuts.

---

# UI Rules

UI only renders.

UI must NEVER:

- contain business logic
- access repositories
- access Supabase
- access APIs
- perform calculations

UI only:

- renders
- dispatches commands
- listens for state changes

---

# Domain Rules

Business logic belongs ONLY inside Domain.

Everything important must become:

- Entity
- Value Object
- Domain Service
- Specification
- Policy

Prefer Domain Models over primitive types.

Avoid primitive obsession.

---

# Repository Rules

Repositories are the ONLY place allowed to:

- access Supabase
- call APIs
- read/write databases
- perform persistence

Never bypass repositories.

---

# Feature Isolation

Features must remain isolated.

Never import another feature.

Cross-feature communication only through:

- Application Layer
- EventBus
- Domain Events

---

# SOLID

Every module must be:

- Single Responsibility
- Open for Extension
- Closed for Modification
- Replaceable
- Interface Driven
- Dependency Injected

---

# Design Patterns

Choose patterns BEFORE coding.

Examples:

Repository

Factory

Strategy

CQRS

DDD

Builder

Specification

State

Observer

Adapter

Use the simplest correct pattern.

Never over-engineer.

---

# Code Quality

Prefer:

small files

small classes

pure functions

composition

immutability

testability

clear naming

Avoid:

God Objects

Long methods

Duplicate logic

Magic values

Deep nesting

Hidden side effects

---

# Optimistic UI

Every CRUD operation must:

1. update UI immediately
2. snapshot previous state
3. save in background
4. rollback silently if failed
5. show non-blocking toast

Bulk operations:

update once

sync later

Never block UI.

Exception:

- file upload
- server generated values

---

# Before Creating Anything

Always search for:

existing components

existing hooks

existing repositories

existing domain models

existing utilities

Reuse first.

Create second.

---

# After Every Change

Ask yourself:

Is architecture better?

Is coupling lower?

Is module more reusable?

Can this scale?

If the answer is "No"

Refactor first.

# Before implementing any task:

1. Search the codebase for existing implementations.
2. Reuse existing abstractions.
3. Explain the implementation plan internally.
4. Modify the minimum number of files.
5. Preserve architecture.
