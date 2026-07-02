# Graph Report - src  (2026-07-01)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 672 nodes · 1716 edges · 41 communities (36 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0a9ab002`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 24|Community 24]]

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 40 edges
2. `usePermission()` - 37 edges
3. `IDBDatabase` - 37 edges
4. `UserService` - 31 edges
5. `Permission` - 27 edges
6. `AuditLogService` - 24 edges
7. `showToast()` - 23 edges
8. `NotificationService` - 22 edges
9. `PermissionMappingService` - 22 edges
10. `useAuth()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `PermissionManager()` --calls--> `useTheme()`  [EXTRACTED]
  pages/admin/PermissionManager.tsx → app/providers/ThemeProvider.tsx
- `useInspections()` --calls--> `usePersistedState()`  [EXTRACTED]
  features/inspection-management/hooks/useInspections.ts → shared/hooks/usePersistedState.ts
- `useInspectors()` --calls--> `usePersistedState()`  [EXTRACTED]
  features/inspector-managment/hooks/useInspectors.ts → shared/hooks/usePersistedState.ts
- `useInvoices()` --calls--> `usePersistedState()`  [EXTRACTED]
  features/invoice-managment/hooks/useInvoices.ts → shared/hooks/usePersistedState.ts
- `AppContent()` --calls--> `useAuth()`  [EXTRACTED]
  App.tsx → features/auth/hooks/useAuth.ts

## Import Cycles
- 2-file cycle: `entities/contract/services/contractCalculations.ts -> shared/lib/formatters.ts -> entities/contract/services/contractCalculations.ts`

## Communities (41 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (85): contractTariffs, useClickOutside(), usePermission(), exportToExcel(), formatCurrency(), formatDate(), validateMobile(), validateNationalCode() (+77 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (56): ALL_PERMISSIONS, formatPermission(), getPermissionDescription(), getPermissionLabel(), parsePermission(), PERMISSION_DESCRIPTIONS, PERMISSION_GROUPS, CURRENT_USER (+48 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (28): AuditActorType, AuditLogEntry, AuditLogFilter, AuditLogLevel, IAuditLogService, useAuditLogger(), useAuditLogs(), DomainEvent (+20 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (29): AppContent(), meta, AuthError, AuthSession, LoginCredentials, PasswordResetConfirm, PasswordResetRequest, User (+21 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (25): useEventToNotification(), useNotifications(), useToast(), Header(), HeaderProps, INotificationService, Notification, NotificationCategory (+17 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (13): DatabaseService, db, IDBDatabase, DatabaseSchema, DBPermissionMapping, DBRole, DBSettings, DBUIElement (+5 more)

### Community 6 - "Community 6"
Cohesion: 0.13
Nodes (12): PermissionManager(), EntityType, PermissionGuard(), PermissionGuardProps, usePermissionMapping(), PermissionMappingService, PermissionMapping, UIElement (+4 more)

### Community 7 - "Community 7"
Cohesion: 0.13
Nodes (18): CardHeader(), CardHeaderProps, cn(), Avatar(), AvatarProps, BadgeProps, BadgeTone, ButtonProps (+10 more)

### Community 8 - "Community 8"
Cohesion: 0.19
Nodes (3): User, Props, UserService

### Community 9 - "Community 9"
Cohesion: 0.19
Nodes (10): EventBus, publishEvent(), EVENT_TYPES, EventType, DomainEvent, EventHandler, EventType, IEventBus (+2 more)

### Community 10 - "Community 10"
Cohesion: 0.23
Nodes (12): getDepartmentName(), clients, contracts, useAuth(), useClients(), ContractStatusFilter, useContracts(), usePersistedState() (+4 more)

### Community 11 - "Community 11"
Cohesion: 0.13
Nodes (12): AdjustmentMode, AttachmentCategory, ClientType, ContractFinancialTerms, ContractLike, ContractStatus, ContractType, GuaranteeType (+4 more)

### Community 13 - "Community 13"
Cohesion: 0.22
Nodes (9): inspectionsByDiscipline, inspectionsByMonth, inspectorPerformance, inspectors, ncrs, useInspectors(), ContactPerson, Inspector (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.24
Nodes (7): deepDiff(), diffArrays(), diffObjects(), DiffResult, FieldChange, getObjectFieldChanges(), STORAGE_EVENT_MAP

### Community 16 - "Community 16"
Cohesion: 0.22
Nodes (6): Theme, ThemeColors, ThemeContext, ThemeContextType, colors, themeColors

### Community 17 - "Community 17"
Cohesion: 0.29
Nodes (6): Department, DEPARTMENTS, getDepartmentById(), DepartmentBadge(), DepartmentSelect(), Props

### Community 18 - "Community 18"
Cohesion: 0.25
Nodes (4): CONTRACT_STATUSES, CONTRACT_TYPES, ContractStatusType, ContractType

### Community 19 - "Community 19"
Cohesion: 0.29
Nodes (5): invoices, useInvoices(), Invoice, Invoice, InvoiceStatus

### Community 21 - "Community 21"
Cohesion: 0.18
Nodes (7): useInspections(), EVENT_TYPES, Inspection, Inspection, showToast(), Toast, ToastType

## Knowledge Gaps
- **105 isolated node(s):** `meta`, `ThemeMode`, `ThemeContextType`, `ThemeContext`, `ViewMeta` (+100 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `showToast()` connect `Community 21` to `Community 0`, `Community 1`, `Community 3`, `Community 5`, `Community 10`, `Community 13`, `Community 19`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `EventBus` connect `Community 2` to `Community 1`, `Community 3`, `Community 4`, `Community 14`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Why does `UserService` connect `Community 8` to `Community 1`, `Community 3`, `Community 5`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **What connects `meta`, `ThemeMode`, `ThemeContextType` to the rest of the system?**
  _105 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05736409608091024 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06512345679012346 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06586538461538462 - nodes in this community are weakly interconnected._