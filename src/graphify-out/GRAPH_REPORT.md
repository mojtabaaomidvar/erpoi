# Graph Report - src  (2026-07-02)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 871 nodes · 2030 edges · 53 communities (46 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f0f7e482`
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
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 36|Community 36]]

## God Nodes (most connected - your core abstractions)
1. `MockDatabase` - 83 edges
2. `useTheme()` - 46 edges
3. `getDB()` - 41 edges
4. `saveToStorage()` - 38 edges
5. `IDBDatabase` - 37 edges
6. `usePermission()` - 28 edges
7. `DBUser` - 27 edges
8. `DBRole` - 25 edges
9. `AuditLogService` - 24 edges
10. `NotificationService` - 22 edges

## Surprising Connections (you probably didn't know these)
- `useInvoices()` --calls--> `usePersistedState()`  [EXTRACTED]
  features/invoice-managment/hooks/useInvoices.ts → shared/hooks/usePersistedState.ts
- `ClientDetails()` --calls--> `useTheme()`  [EXTRACTED]
  features/client-management/ui/ClientDetails.tsx → app/providers/ThemeProvider.tsx
- `ClientSelectorModal()` --calls--> `useTheme()`  [EXTRACTED]
  entities/client/ui/ClientSelectorModal.tsx → app/providers/ThemeProvider.tsx
- `ContractDetails()` --calls--> `useTheme()`  [EXTRACTED]
  features/contract-management/ui/ContractDetails.tsx → app/providers/ThemeProvider.tsx
- `ContractDetailsModal()` --calls--> `useTheme()`  [EXTRACTED]
  features/client-management/ui/ContractDetailsModal.tsx → app/providers/ThemeProvider.tsx

## Import Cycles
- 2-file cycle: `entities/contract/services/contractCalculations.ts -> shared/lib/formatters.ts -> entities/contract/services/contractCalculations.ts`

## Communities (53 total, 7 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (15): Department, DEPARTMENTS, getDepartmentById(), getDepartmentName(), User, UserFormData, getDB(), DBClient (+7 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (28): AuditActorType, AuditLogEntry, AuditLogFilter, AuditLogLevel, IAuditLogService, useAuditLogger(), useAuditLogs(), DomainEvent (+20 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (7): loadFromStorage(), MockDatabase, saveToStorage(), DBInspection, DBInspector, DBInvoice, DBNCR

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (25): useEventToNotification(), useNotifications(), useToast(), Header(), HeaderProps, INotificationService, Notification, NotificationCategory (+17 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (22): meta, AuthError, AuthSession, LoginCredentials, PasswordResetConfirm, PasswordResetRequest, User, useAuth() (+14 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (24): clientElements, contractElements, dashboardElements, confirmDialog(), ConfirmDialogProvider(), ConfirmDialogState, ConfirmOptions, FloatingActionBar() (+16 more)

### Community 6 - "Community 6"
Cohesion: 0.06
Nodes (7): db, IDBDatabase, DatabaseSchema, DBPermissionMapping, DBSettings, DBUIElement, DBUser

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (18): DepartmentSelect(), Props, DBContactPerson, DBDepartment, DBRole, DepartmentModal(), DepartmentModalProps, RoleModal() (+10 more)

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (24): contracts, ncrs, DatabaseProvider, DatabaseType, dbProvider, getDB(), DatabaseService, database (+16 more)

### Community 9 - "Community 9"
Cohesion: 0.13
Nodes (21): CardHeader(), CardHeaderProps, cn(), Avatar(), AvatarProps, Badge(), BadgeProps, BadgeTone (+13 more)

### Community 10 - "Community 10"
Cohesion: 0.16
Nodes (24): formatCurrency(), formatDate(), formatDateShort(), Billing(), calculateDaysLeft(), calculateDaysProgress(), calculatePerformedWorkValue(), calculateTotalInvoicedFromTariffs() (+16 more)

### Community 11 - "Community 11"
Cohesion: 0.15
Nodes (21): useClients(), useContracts(), usePermission(), exportToExcel(), validateMobile(), validateNationalCode(), validateNationalId(), Clients() (+13 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (9): Permission, CustomRole, PermissionExplorer(), RoleFormProps, CustomRole, UserFormData, UserFormProps, CustomRole (+1 more)

### Community 13 - "Community 13"
Cohesion: 0.18
Nodes (6): EntityType, PermissionMappingService, PermissionMapping, UIElement, UIElementRegistry, UIElementType

### Community 14 - "Community 14"
Cohesion: 0.19
Nodes (10): EventBus, publishEvent(), EVENT_TYPES, EventType, DomainEvent, EventHandler, EventType, IEventBus (+2 more)

### Community 15 - "Community 15"
Cohesion: 0.14
Nodes (11): ActionType, DEFAULT_ACTIONS, ENTITIES, ENTITY_GROUPS, EntityType, PermissionGroup, permissionGroups, PERMISSION_GROUPS (+3 more)

### Community 16 - "Community 16"
Cohesion: 0.14
Nodes (12): RoleGuard(), RoleGuardProps, ViewMeta, views, useEntityAccess(), useRole(), navItems, Sidebar() (+4 more)

### Community 17 - "Community 17"
Cohesion: 0.14
Nodes (16): ThemeContext, ThemeContextType, ThemeMode, formatNumberInput(), getNextJalaaliYearStart(), parseNumberInput(), ClientSelectorModal(), ClientSelectorModalProps (+8 more)

### Community 18 - "Community 18"
Cohesion: 0.19
Nodes (13): CURRENT_USER, getRolePermissions(), hasAllPermissions(), hasAnyPermission(), hasPermission(), ROLES, ActionType, Role (+5 more)

### Community 19 - "Community 19"
Cohesion: 0.18
Nodes (16): contractTariffs, useClickOutside(), calculateInvoiceProgress(), calculateProgressFromTariffs(), getProgressBgClass(), getProgressTextClass(), Contract, TariffLine (+8 more)

### Community 20 - "Community 20"
Cohesion: 0.11
Nodes (15): Adjustment, AdjustmentMode, AttachmentCategory, ClientType, ContractAttachment, ContractFinancialTerms, ContractLike, ContractModification (+7 more)

### Community 21 - "Community 21"
Cohesion: 0.19
Nodes (9): inspections, useInspections(), useInspectors(), usePersistedState(), EVENT_TYPES, Inspection, Inspector, Inspection (+1 more)

### Community 22 - "Community 22"
Cohesion: 0.23
Nodes (8): clients, inspectionsByDiscipline, inspectionsByMonth, inspectorPerformance, inspectors, ContactPerson, NCR, ClientSelectorProps

### Community 23 - "Community 23"
Cohesion: 0.24
Nodes (7): deepDiff(), diffArrays(), diffObjects(), DiffResult, FieldChange, getObjectFieldChanges(), STORAGE_EVENT_MAP

### Community 24 - "Community 24"
Cohesion: 0.20
Nodes (6): invoices, useInvoices(), publishEvent(), Invoice, Invoice, InvoiceStatus

### Community 25 - "Community 25"
Cohesion: 0.22
Nodes (6): Theme, ThemeColors, ThemeContext, ThemeContextType, colors, themeColors

### Community 26 - "Community 26"
Cohesion: 0.25
Nodes (4): CONTRACT_STATUSES, CONTRACT_TYPES, ContractStatusType, ContractType

### Community 28 - "Community 28"
Cohesion: 0.40
Nodes (4): ATTACHMENT_CATEGORIES, ContractAttachment, ContractAttachmentsEditor(), ContractAttachmentsEditorProps

### Community 29 - "Community 29"
Cohesion: 0.67
Nodes (3): usePermissionMapping(), PermissionGuard(), PermissionGuardProps

## Knowledge Gaps
- **132 isolated node(s):** `ThemeMode`, `ThemeContextType`, `ThemeContext`, `CONTRACT_STATUSES`, `ContractStatusType` (+127 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `EventBus` connect `Community 1` to `Community 0`, `Community 3`, `Community 4`, `Community 7`, `Community 12`, `Community 23`, `Community 24`?**
  _High betweenness centrality (0.151) - this node is a cross-community bridge._
- **Why does `useTheme()` connect `Community 11` to `Community 4`, `Community 5`, `Community 7`, `Community 9`, `Community 10`, `Community 12`, `Community 15`, `Community 16`, `Community 17`, `Community 18`, `Community 19`, `Community 31`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `MockDatabase` connect `Community 2` to `Community 8`, `Community 0`, `Community 6`, `Community 7`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **What connects `ThemeMode`, `ThemeContextType`, `ThemeContext` to the rest of the system?**
  _132 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06189640035118525 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06861239119303636 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06594071385359952 - nodes in this community are weakly interconnected._