# Graph Report - src  (2026-07-27)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1532 nodes · 4088 edges · 102 communities (87 shown, 15 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `53f498a1`
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
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 86|Community 86]]

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 160 edges
2. `useAuth()` - 59 edges
3. `Contract` - 53 edges
4. `usePermissionMapping()` - 51 edges
5. `Button()` - 46 edges
6. `Badge()` - 43 edges
7. `User` - 39 edges
8. `showToast()` - 39 edges
9. `Client` - 37 edges
10. `supabase` - 36 edges

## Surprising Connections (you probably didn't know these)
- `FilePreviewButton()` --calls--> `useTheme()`  [EXTRACTED]
  features/contract-management/ui/contract-add-form/steps/Step5Preview.tsx → app/providers/ThemeProvider.tsx
- `FilePreviewModal()` --calls--> `useTheme()`  [EXTRACTED]
  features/contract-management/ui/contract-add-form/steps/Step5Preview.tsx → app/providers/ThemeProvider.tsx
- `useContractAddForm()` --calls--> `generateContractNo()`  [INFERRED]
  features/contract-management/hooks/useContractAddForm.ts → entities/contract/services/contractCalculations.ts
- `useClientDetails()` --calls--> `usePermissionMapping()`  [EXTRACTED]
  features/client-management/hooks/useClientDetails.ts → shared/authorization/hooks/usePermissionMapping.ts
- `useContractDetails()` --calls--> `usePermissionMapping()`  [INFERRED]
  features/client-management/hooks/useContractDetails.ts → shared/authorization/hooks/usePermissionMapping.ts

## Import Cycles
- 1-file cycle: `features/mws-management/domain/types.ts -> features/mws-management/domain/types.ts`
- 1-file cycle: `features/tpi-management/domain/types.ts -> features/tpi-management/domain/types.ts`

## Communities (102 total, 15 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (21): ResidentInspectionApplicationService, residentInspectionAppService, applyDepartmentFilter(), getDepartmentFilter(), ResidentInspection, Client, Contract, IClientRepository (+13 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (59): permissionMappingAppService, CreatePermissionModal(), CreatePermissionModalProps, DeleteErrorModal(), DeleteErrorModalProps, DependencyModal(), DependencyModalProps, EditPermissionModal() (+51 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (23): ProjectApplicationService, ROLE_HIERARCHY, ProjectStatsApplicationService, Project, ProjectClient, ProjectMember, ProjectRole, CreateProjectCommand (+15 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (29): AuditActorType, AuditLog, AuditLogEntry, AuditLogFilter, AuditLogLevel, EventBus, EVENT_TYPES, EventType (+21 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (19): inspectorAppService, InspectorElements, useInspectorForm(), useInspectors(), Inspector, INSPECTOR_SPECIALTY_OPTIONS, InspectorSpecialty, InspectorStatus (+11 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (28): FormFooterProps, PermissionToolbarProps, ContractElements, useClientEdit(), useClientForm(), useDuplicateWarning(), DuplicateClientInfo, isNightTime() (+20 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (11): InspectorAttendanceApplicationService, MonthlyReportApplicationService, InspectorAttendance, MonthlyAttendanceSummary, MonthlyReport, IInspectorAttendanceRepository, IMonthlyReportRepository, inspectorAttendanceRepository (+3 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (30): AppContent(), meta, AuthError, AuthSession, LoginCredentials, User, ViewMeta, views (+22 more)

### Community 8 - "Community 8"
Cohesion: 0.07
Nodes (24): InspectionCoreService, Checklist, ChecklistCategory, ChecklistItem, CreateInspectionCommand, CreateInspectionRequestCommand, CreateNCRCommand, CreateReportCommand (+16 more)

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (27): ProgressBar(), ProgressBarProps, ADJUSTMENT_MODES, CURRENCIES, DEFAULT_VALUES, EMAIL_INPUT_METHODS, GUARANTEE_TYPES, SERVICE_TYPES (+19 more)

### Community 10 - "Community 10"
Cohesion: 0.09
Nodes (32): DocumentReviewSection(), DocumentReviewSectionProps, UploadFileItem, UploadingFileItem, EnrichedInspector, InspectionProjectDetails, InspectorAssignmentSection(), InspectorAssignmentSectionProps (+24 more)

### Community 11 - "Community 11"
Cohesion: 0.10
Nodes (27): tpiRequestAppService, vendorAppService, InspectionItem, InspectionItemSourceType, SourceFileType, TPI_DISCIPLINE_OPTIONS, TPI_INSPECTION_METHOD_OPTIONS, TPI_INSPECTION_STAGE_OPTIONS (+19 more)

### Community 12 - "Community 12"
Cohesion: 0.10
Nodes (28): Department, DEPARTMENTS, getDepartmentById(), getDepartmentName(), ENTITIES, ENTITY_GROUPS, EntityType, CURRENT_USER (+20 more)

### Community 13 - "Community 13"
Cohesion: 0.09
Nodes (25): inspectorAttendanceAppService, monthlyReportAppService, FormFooter(), AttendanceStatus, Billing(), Reports(), Settings(), projectAppService (+17 more)

### Community 14 - "Community 14"
Cohesion: 0.15
Nodes (27): useContractDetails(), useContractDetails(), ContractDocument, calculateDaysLeft(), calculateDaysProgress(), calculateInvoiceProgress(), calculatePerformedWorkValue(), calculateProgressFromTariffs() (+19 more)

### Community 15 - "Community 15"
Cohesion: 0.09
Nodes (23): authAppService, departmentAppService, userAppService, DepartmentSelect(), DepartmentSelectProps, getRoleConfig(), isManagerRole(), ROLE_CONFIGS (+15 more)

### Community 16 - "Community 16"
Cohesion: 0.13
Nodes (21): ProjectElements, useProjectForm(), useProjectStats(), INSPECTION_CATEGORY_CONFIG, ProjectDetailsModal(), InspectionCategory, ProjectForm(), ROLE_HIERARCHY (+13 more)

### Community 17 - "Community 17"
Cohesion: 0.11
Nodes (19): CardHeader(), CardHeaderProps, cn(), Avatar(), AvatarProps, BadgeProps, BadgeTone, ButtonProps (+11 more)

### Community 18 - "Community 18"
Cohesion: 0.16
Nodes (8): MWSElements, ElementRegistry, RegistryStats, UIElementDefinition, UIElementMap, UIElementType, UIModuleElements, ValidationError

### Community 19 - "Community 19"
Cohesion: 0.19
Nodes (6): AuthSession, AuthUser, LoginCredentials, IAuthRepository, SupabaseAuthRepository, AuthApplicationService

### Community 20 - "Community 20"
Cohesion: 0.12
Nodes (11): useEventToNotification(), DomainEvent, EVENT_TYPES, EventBus, EventHandler, EventType, IEventBus, subscribeOnce() (+3 more)

### Community 21 - "Community 21"
Cohesion: 0.13
Nodes (15): clientAppService, contractAppService, tariffAppService, useClients(), ContractStatusFilter, useContracts(), exportToExcel(), Clients() (+7 more)

### Community 22 - "Community 22"
Cohesion: 0.15
Nodes (8): InspectionRequestApplicationService, inspectionRequestAppService, BaseInspectionRequest, CreateInspectionRequestCommand, CreateInspectionRequestSchema, IInspectionRequestRepository, inspectionRequestRepository, SupabaseInspectionRequestRepository

### Community 23 - "Community 23"
Cohesion: 0.16
Nodes (7): VendorApplicationService, Vendor, CreateVendorCommand, CreateVendorSchema, IVendorRepository, SupabaseVendorRepository, vendorRepository

### Community 24 - "Community 24"
Cohesion: 0.13
Nodes (10): TabKey, useApprovalModal(), ContractAmendment, CreateAmendmentData, IAmendmentRepository, SupabaseAmendmentRepository, ApprovalModal(), ApprovalModalProps (+2 more)

### Community 25 - "Community 25"
Cohesion: 0.14
Nodes (15): ContractDocument, TabKey, useContractDocumentsModal(), formatCurrency(), getDaysProgressColor(), getProgressColor(), getProgressTextClass(), isContractNotStarted() (+7 more)

### Community 26 - "Community 26"
Cohesion: 0.15
Nodes (8): amendmentRepo, contractRepo, tariffRepo, TariffLine, ITariffRepository, SupabaseTariffRepository, TariffApplicationService, ContractDetailsModalProps

### Community 27 - "Community 27"
Cohesion: 0.18
Nodes (13): DepartmentCard(), DepartmentsTab(), DepartmentsTabProps, UserRow(), UserRowProps, UsersTab(), UsersTabProps, UserTable() (+5 more)

### Community 28 - "Community 28"
Cohesion: 0.18
Nodes (5): DepartmentCardProps, Department, IDepartmentRepository, SupabaseDepartmentRepository, DepartmentApplicationService

### Community 29 - "Community 29"
Cohesion: 0.13
Nodes (14): ClientEditForm, FormErrors, ClientFormData, ContactPerson, DuplicateInfo, FormErrors, ContactErrors, jalaaliDateToNumber() (+6 more)

### Community 30 - "Community 30"
Cohesion: 0.24
Nodes (14): useNotifications(), useToast(), INotificationService, NotificationCategory, NotificationFilter, NotificationType, categoryColors, categoryLabels (+6 more)

### Community 31 - "Community 31"
Cohesion: 0.20
Nodes (8): DatabaseType, dbProvider, database, DatabaseSingleton, getDB(), getDBSync(), supabase, tpiRequestRepository

### Community 32 - "Community 32"
Cohesion: 0.17
Nodes (6): TPIRequestApplicationService, TPIRequest, SupabaseTPIRequestRepository, InspectionDetailsModalProps, TPIDetailsModalProps, TPIRequestFormProps

### Community 33 - "Community 33"
Cohesion: 0.18
Nodes (13): getAllEntities(), getBasePermissions(), getBasePermissionsInfo(), isBasePermission(), KNOWN_ENTITIES, ROLE_BASE_PERMISSIONS, calculateEffectivePermissions(), countPermissionsByEntity() (+5 more)

### Community 34 - "Community 34"
Cohesion: 0.21
Nodes (4): PermissionMapping, IPermissionMappingRepository, SupabasePermissionMappingRepository, PermissionMappingApplicationService

### Community 35 - "Community 35"
Cohesion: 0.26
Nodes (6): User, UserStatus, CreateUserPayload, IUserRepository, UpdateUserPayload, SupabaseUserRepository

### Community 36 - "Community 36"
Cohesion: 0.16
Nodes (3): InspectionApplicationService, CreateInspectionCommand, CreateInspectionSchema

### Community 37 - "Community 37"
Cohesion: 0.21
Nodes (13): clients, contracts, contractTariffs, clearExistingData(), clearTable(), runMigration(), seedClients(), seedContracts() (+5 more)

### Community 38 - "Community 38"
Cohesion: 0.17
Nodes (4): TPICancellationReason, IInspectionRepository, inspectionRepository, SupabaseInspectionRepository

### Community 43 - "Community 43"
Cohesion: 0.20
Nodes (7): amendmentAppService, AmendmentApprovalStatus, AmendmentType, ContractStatus, ContractType, TariffAdjustment, TariffAdjustmentMode

### Community 44 - "Community 44"
Cohesion: 0.26
Nodes (10): UserManagementTabs(), UserManagementTabsProps, DBUser, DepartmentAction, DepartmentWithUsers, TabConfig, USER_MANAGEMENT_TABS, UserAction (+2 more)

### Community 45 - "Community 45"
Cohesion: 0.27
Nodes (9): useContractAmendmentForm(), formatNumberInput(), parseNumberInput(), Step2Financials(), ContractAmendmentForm(), ContractAmendmentFormProps, TariffEditor(), TariffEditorProps (+1 more)

### Community 46 - "Community 46"
Cohesion: 0.21
Nodes (7): deepDiff(), diffArrays(), diffObjects(), DiffResult, FieldChange, getObjectFieldChanges(), STORAGE_EVENT_MAP

### Community 48 - "Community 48"
Cohesion: 0.29
Nodes (6): ClientElements, useClickOutside(), useClientDetails(), getProgressBgClass(), ClientDetails(), ClientDetailsProps

### Community 49 - "Community 49"
Cohesion: 0.22
Nodes (6): Theme, ThemeColors, ThemeContext, ThemeContextType, colors, themeColors

### Community 50 - "Community 50"
Cohesion: 0.31
Nodes (6): documentReviewAppService, inspectionAppService, inspectionRepo, CreateDocumentReviewCommand, CreateDocumentReviewSchema, documentReviewRepository

### Community 52 - "Community 52"
Cohesion: 0.25
Nodes (7): CancellationReason, DocumentReview, Inspection, InspectionCategory, InspectionExecutionStatus, Priority, ReviewStatus

### Community 53 - "Community 53"
Cohesion: 0.29
Nodes (7): MWSCancellationReason, MWSDiscipline, MWSDocumentType, MWSInspectionMethod, MWSInspectionStage, MWSReportType, MWSRequest

### Community 54 - "Community 54"
Cohesion: 0.39
Nodes (6): Toast, Props, Toast(), typeStyles, Props, ToastContainer()

### Community 55 - "Community 55"
Cohesion: 0.50
Nodes (7): calculateProjectStatus(), calculateTimeProgress(), compareJalaliDates(), getDaysDifference(), getTodayJalali(), jalaliDateToDate(), jalaliToGregorian()

### Community 58 - "Community 58"
Cohesion: 0.40
Nodes (4): ATTACHMENT_CATEGORIES, ContractAttachment, ContractAttachmentsEditor(), ContractAttachmentsEditorProps

## Knowledge Gaps
- **197 isolated node(s):** `meta`, `ThemeMode`, `ThemeContextType`, `ThemeContext`, `ViewMeta` (+192 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `Community 13` to `Community 1`, `Community 4`, `Community 5`, `Community 7`, `Community 9`, `Community 10`, `Community 11`, `Community 44`, `Community 45`, `Community 15`, `Community 16`, `Community 48`, `Community 20`, `Community 21`, `Community 24`, `Community 25`, `Community 58`, `Community 27`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Why does `supabase` connect `Community 31` to `Community 0`, `Community 2`, `Community 3`, `Community 6`, `Community 7`, `Community 10`, `Community 11`, `Community 13`, `Community 15`, `Community 19`, `Community 20`, `Community 22`, `Community 23`, `Community 26`, `Community 28`, `Community 34`, `Community 35`, `Community 37`, `Community 38`, `Community 42`, `Community 43`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Why does `showToast()` connect `Community 16` to `Community 1`, `Community 2`, `Community 4`, `Community 5`, `Community 9`, `Community 10`, `Community 43`, `Community 11`, `Community 13`, `Community 15`, `Community 19`, `Community 20`, `Community 21`, `Community 24`, `Community 29`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `usePermissionMapping()` (e.g. with `useContractDetails()` and `useContractDetails()`) actually correct?**
  _`usePermissionMapping()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `meta`, `ThemeMode`, `ThemeContextType` to the rest of the system?**
  _197 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05339506172839506 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06720321931589537 - nodes in this community are weakly interconnected._