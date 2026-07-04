# Graph Report - src  (2026-07-04)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 804 nodes · 1998 edges · 51 communities (45 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `74d42d79`
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
- [[_COMMUNITY_Community 34|Community 34]]

## God Nodes (most connected - your core abstractions)
1. `MockDatabase` - 83 edges
2. `useTheme()` - 51 edges
3. `saveToStorage()` - 38 edges
4. `IDBDatabase` - 37 edges
5. `getDB()` - 34 edges
6. `useAuth()` - 29 edges
7. `usePermission()` - 29 edges
8. `showToast()` - 29 edges
9. `DBUser` - 27 edges
10. `AuditLogService` - 24 edges

## Surprising Connections (you probably didn't know these)
- `FloatingActionBar()` --calls--> `useTheme()`  [EXTRACTED]
  shared/ui/FloatingActionBar.tsx → app/providers/ThemeProvider.tsx
- `ContractFormProps` --references--> `Contract`  [EXTRACTED]
  features/contract-management/ui/ContractForm.tsx → types/contract.ts
- `AppContent()` --calls--> `useTheme()`  [EXTRACTED]
  App.tsx → app/providers/ThemeProvider.tsx
- `Sidebar()` --calls--> `useTheme()`  [EXTRACTED]
  widgets/layout/Sidebar.tsx → app/providers/ThemeProvider.tsx
- `Clients()` --calls--> `useTheme()`  [EXTRACTED]
  pages/Clients.tsx → app/providers/ThemeProvider.tsx

## Import Cycles
- 2-file cycle: `entities/contract/services/contractCalculations.ts -> shared/lib/formatters.ts -> entities/contract/services/contractCalculations.ts`

## Communities (51 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (6): MockDatabase, saveToStorage(), DBInspection, DBInspector, DBInvoice, DBNCR

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (30): ActionType, DEFAULT_ACTIONS, ENTITIES, ENTITY_GROUPS, EntityType, CURRENT_USER, getRolePermissions(), hasAllPermissions() (+22 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (13): getDB(), DBClient, DBContactPerson, DBContract, DBTariffLine, ClientFormData, ClientService, ContractFormData (+5 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (25): useEventToNotification(), useNotifications(), useToast(), Header(), HeaderProps, INotificationService, Notification, NotificationCategory (+17 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (22): AuditActorType, AuditLogEntry, AuditLogFilter, AuditLogLevel, IAuditLogService, useAuditLogger(), useAuditLogs(), DomainEvent (+14 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (27): inspections, invoices, useInspections(), useInspectors(), useInvoices(), deepDiff(), diffArrays(), diffObjects() (+19 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (3): IDBDatabase, DBRole, DBUIElement

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (13): clientElements, contractElements, dashboardElements, autoDiscoverAndRegister(), convertToUIElements(), extractEntityFromModule(), registerUIElements(), toSingular() (+5 more)

### Community 8 - "Community 8"
Cohesion: 0.11
Nodes (20): AppContent(), meta, ViewMeta, views, useAuth(), useRequireAuth(), navItems, Sidebar() (+12 more)

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (21): DepartmentSelect(), Props, PermissionSelector(), PermissionSelectorProps, DepartmentModal(), JOB_TITLES, UserModal(), UserPermissionsModal() (+13 more)

### Community 10 - "Community 10"
Cohesion: 0.12
Nodes (22): CardHeader(), clients, contracts, contractTariffs, inspectionsByDiscipline, inspectionsByMonth, inspectorPerformance, inspectors (+14 more)

### Community 11 - "Community 11"
Cohesion: 0.17
Nodes (22): formatCurrency(), calculateDaysLeft(), calculateDaysProgress(), calculateInvoiceProgress(), calculatePerformedWorkValue(), calculateProgressFromTariffs(), calculateTotalInvoicedFromTariffs(), calculateUninvoicedWork() (+14 more)

### Community 12 - "Community 12"
Cohesion: 0.13
Nodes (17): CardHeaderProps, cn(), Avatar(), AvatarProps, BadgeProps, BadgeTone, ButtonProps, ButtonVariant (+9 more)

### Community 13 - "Community 13"
Cohesion: 0.18
Nodes (13): useClients(), usePermission(), validateMobile(), validateNationalCode(), validateNationalId(), Clients(), Client, ClientEditModal() (+5 more)

### Community 14 - "Community 14"
Cohesion: 0.19
Nodes (10): EventBus, publishEvent(), EVENT_TYPES, EventType, DomainEvent, EventHandler, EventType, IEventBus (+2 more)

### Community 15 - "Community 15"
Cohesion: 0.16
Nodes (7): AuthError, AuthSession, LoginCredentials, PasswordResetConfirm, PasswordResetRequest, User, AuthService

### Community 16 - "Community 16"
Cohesion: 0.17
Nodes (8): DatabaseProvider, DatabaseType, dbProvider, getDB(), DatabaseService, database, DatabaseSingleton, getDBSync()

### Community 17 - "Community 17"
Cohesion: 0.21
Nodes (16): useClickOutside(), usePermissionMapping(), getProgressBgClass(), getProgressTextClass(), Contract, TariffLine, ClientDetails(), ClientDetailsProps (+8 more)

### Community 18 - "Community 18"
Cohesion: 0.12
Nodes (17): formatNumberInput(), getNextJalaaliYearStart(), parseNumberInput(), Adjustment, ContractAttachment, ContractModification, Guarantee, ATTACHMENT_CATEGORIES (+9 more)

### Community 19 - "Community 19"
Cohesion: 0.11
Nodes (15): loadFromStorage(), mockClients, mockContracts, mockDepartments, mockInspections, mockInspectors, mockInvoices, mockNCRs (+7 more)

### Community 20 - "Community 20"
Cohesion: 0.26
Nodes (14): DeleteErrorInfo, SavePreviewItem, checkDependenciesChain(), elementDependencies, getAllChildren(), getAllChildrenChain(), getAllDependenciesChain(), getElementDepth() (+6 more)

### Community 21 - "Community 21"
Cohesion: 0.14
Nodes (11): AdjustmentMode, AttachmentCategory, ClientType, ContractFinancialTerms, ContractLike, ContractStatus, ContractType, GuaranteeType (+3 more)

### Community 22 - "Community 22"
Cohesion: 0.17
Nodes (3): DBUser, UserModalProps, UserPermissionsModalProps

### Community 23 - "Community 23"
Cohesion: 0.23
Nodes (7): ContractStatusFilter, useContracts(), exportToExcel(), Contracts(), getInvoicedPercentage(), ContractForm(), ContractList()

### Community 24 - "Community 24"
Cohesion: 0.18
Nodes (4): db, DatabaseSchema, DBPermissionMapping, DBSettings

### Community 25 - "Community 25"
Cohesion: 0.22
Nodes (6): Theme, ThemeColors, ThemeContext, ThemeContextType, colors, themeColors

### Community 26 - "Community 26"
Cohesion: 0.29
Nodes (6): confirmDialog(), ConfirmDialogProvider(), ConfirmDialogState, ConfirmOptions, FloatingActionBar(), FloatingActionBarProps

### Community 28 - "Community 28"
Cohesion: 0.50
Nodes (4): Department, DEPARTMENTS, getDepartmentById(), getDepartmentName()

## Knowledge Gaps
- **122 isolated node(s):** `meta`, `ThemeMode`, `ThemeContextType`, `ThemeContext`, `ViewMeta` (+117 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `MockDatabase` connect `Community 0` to `Community 2`, `Community 6`, `Community 16`, `Community 19`, `Community 22`, `Community 24`, `Community 29`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Why does `showToast()` connect `Community 2` to `Community 5`, `Community 9`, `Community 11`, `Community 13`, `Community 15`, `Community 17`, `Community 18`, `Community 20`, `Community 23`, `Community 26`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `EventBus` connect `Community 5` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 15`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **What connects `meta`, `ThemeMode`, `ThemeContextType` to the rest of the system?**
  _122 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07003367003367003 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.0815686274509804 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08313725490196078 - nodes in this community are weakly interconnected._