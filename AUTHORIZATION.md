# AUTHORIZATION

## Purpose

This document defines how element-level access control is designed and
implemented across the system. It is the single source of truth for the
authorization model. Read it fully before creating, modifying, or reviewing
any permission-related code.

---

# Model Overview

Access is expressed as a tree of **UI Module Elements**.

Each element has:

- `id` — stable, unique identifier
- `label` — human-readable name
- `type` — action | button | badge | statistic | section | table | column |
  dropdown | filter | search | progress | information
- `requires` — the list of element ids that must already be granted before
  this element can be granted

A user's effective access is a role-based default, optionally overridden
per-element manually. Both role-based and manual overrides resolve through
the same `requires` chain.

Elements are grouped into modules (e.g. `ClientElements`, `InspectorElements`,
`ContractElements`), one file per module, under:

```
shared/authorization/ui/elements/
```

---

# The Gate Principle

**Do not fragment authorization below the point where access is already
decided.**

An element should only be defined if there is a realistic scenario where a
user holds access to the parent but must NOT hold access to this specific
child. If no such scenario exists, the parent element is the gate — do not
create children under it.

## Test before adding a new element

Before adding a new element, answer:

1. Is there a real, expected scenario where a user has the parent permission
   but should be blocked from this specific piece?
2. Would blocking it protect something meaningful — sensitive data, a
   destructive action, a financial figure, cross-tenant visibility?
3. Would omitting it and relying on the parent gate ever leak something that
   matters?

If the answer to all three is "no," do not create the element. Let the parent
gate cover it.

## Examples from this codebase

**Do not fragment** — `ClientList.btn_add` already gates the ability to add a
client. Everything inside the "add client" flow (form fields, the submit
button inside that form) is downstream of one already-made decision. Adding
elements like `AddClientForm.submit_button` or `AddClientForm.name_field`
would be fragmentation with no protective value.

**Do fragment** — `ClientDetails` contains financial and commercial figures
(`stat_value_agreements`, `agreement_value`, `tariffs_section`). A user may
legitimately have `ClientList.list_item_click` (can open a client) without
being cleared to see contract values. This is a real scenario, so these stay
as separate elements.

## Rule of thumb by element type

Elements that typically do NOT need separate gating (usually covered by a
parent action or view element):
- fields inside a form already gated by an add/edit action
- buttons that only submit or cancel a form that is itself gated
- purely structural/layout elements with no sensitive content

Elements that typically DO need separate gating:
- financial figures (values, totals, tariffs, invoicing status)
- destructive actions (delete, void, cancel a contract)
- cross-entity or cross-client visibility
- anything a role might reasonably need partial access to (see it, but not
  edit or export it)

---

# Structure Rules

- One file per business module in `shared/authorization/ui/elements/`.
- Each file exports a `UIModuleElements` object, one property per screen or
  major UI region within that module (e.g. `ClientList`, `ClientDetails`,
  `ClientContractDetailsModal`).
- `id` values are prefixed with the module's lowercase name
  (`client_...`, `inspector_...`, `contract_...`) and must be globally unique.
- `requires` must only reference ids that are defined earlier in the
  dependency chain — never forward-reference, never create cycles.
- A `requires` chain should include the full path back to the root view
  element, not just the immediate parent, when the intermediate steps are
  also independently gated (see `agreement_value` requiring both
  `ClientDetails.agreements_section` and
  `ClientList.total_agreement_value_badge`).

---

# Where This Lives Architecturally

Per `ARCHITECTURE.md`, permissions belong to the **Application** layer.

- Element definitions (`shared/authorization/ui/elements/*`) are static data,
  not business logic. They may be imported anywhere they're needed for
  rendering decisions.
- Resolving "does this user currently have this element" (combining role
  defaults, manual overrides, and the `requires` chain) is an Application-layer
  concern. It must NOT be computed inline inside UI components.
- UI components only ask a single question — "is element X granted?" — via a
  hook or selector backed by the Application layer. UI must never read roles,
  overrides, or `requires` chains directly.
- Never duplicate a `requires` chain's logic inside a component. If a check is
  needed in more than one place, it belongs in the Application layer's
  authorization resolver, not copy-pasted.

---

# Before Adding or Changing Any Element

1. Search existing modules for an equivalent element first. Reuse before
   creating (see AGENTS.md — Reuse First).
2. Apply the Gate Principle test above.
3. If creating a new element, place it in the correct module file and follow
   the id/requires conventions.
4. If the change affects an existing `requires` chain, check every element
   that depends on it — a broken chain can silently over- or under-grant
   access.
5. Never bypass this model with ad-hoc `if (user.role === "admin")` checks in
   UI or Application code. All access decisions flow through elements.
