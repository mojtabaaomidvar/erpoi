# Graph Report - src  (2026-08-01)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1711 nodes · 4465 edges · 118 communities (99 shown, 19 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `650f1d6a`
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
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 98|Community 98]]
- [[_COMMUNITY_Community 99|Community 99]]
- [[_COMMUNITY_Community 116|Community 116]]
- [[_COMMUNITY_Community 117|Community 117]]

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 177 edges
2. `useAuth()` - 63 edges
3. `Contract` - 53 edges
4. `usePermissionMapping()` - 51 edges
5. `Button()` - 47 edges
6. `Badge()` - 45 edges
7. `showToast()` - 43 edges
8. `User` - 39 edges
9. `supabase` - 39 edges
10. `Client` - 38 edges

## Surprising Connections (you probably didn't know these)
- `InspectionMethodSelector()` --calls--> `useTheme()`  [EXTRACTED]
  features/tpi-management/ui/components/InspectionMethodSelector.tsx → app/providers/ThemeProvider.tsx
- `FilePreviewButton()` --calls--> `useTheme()`  [EXTRACTED]
  features/contract-management/ui/contract-add-form/steps/Step5Preview.tsx → app/providers/ThemeProvider.tsx
- `FilePreviewModal()` --calls--> `useTheme()`  [EXTRACTED]
  features/contract-management/ui/contract-add-form/steps/Step5Preview.tsx → app/providers/ThemeProvider.tsx
- `ProjectSelector()` --calls--> `useTheme()`  [EXTRACTED]
  features/inspection-management/ui/ProjectSelector.tsx → app/providers/ThemeProvider.tsx
- `useContractAddForm()` --calls--> `generateContractNo()`  [INFERRED]
  features/contract-management/hooks/useContractAddForm.ts → entities/contract/services/contractCalculations.ts

## Import Cycles
- 1-file cycle: `features/mws-management/domain/types.ts -> features/mws-management/domain/types.ts`
- 1-file cycle: `features/tpi-management/domain/types.ts -> features/tpi-management/domain/types.ts`

## Communities (118 total, 19 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (38): ProjectApplicationService, ROLE_HIERARCHY, ProjectStatsApplicationService, Project, ProjectClient, ProjectMember, ProjectRole, CreateProjectCommand (+30 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (61): permissionMappingAppService, CreatePermissionModal(), CreatePermissionModalProps, DeleteErrorModal(), DeleteErrorModalProps, DependencyModal(), DependencyModalProps, EditPermissionModal() (+53 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (22): EQUIPMENT_TAXONOMY_SEED, EquipmentSeedItem, DatabaseProvider, DatabaseType, dbProvider, getDB(), database, DatabaseSingleton (+14 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (29): AuditActorType, AuditLog, AuditLogEntry, AuditLogFilter, AuditLogLevel, EventBus, EVENT_TYPES, EventType (+21 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (27): inspectorAppService, InspectorApplicationService, inspectorAppService, CancellationReason, ChecklistResult, ChecklistStatus, EnrichedInspector, ChecklistItem (+19 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (26): ClientEditForm, FormErrors, ClientFormData, ContactPerson, DuplicateInfo, FormErrors, ContactErrors, jalaaliDateToNumber() (+18 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (31): FormFooter(), FormFooterProps, ProgressBar(), ProgressBarProps, ADJUSTMENT_MODES, CURRENCIES, DEFAULT_VALUES, EMAIL_INPUT_METHODS (+23 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (32): useContractDetails(), useContractDetails(), ContractDocument, calculateDaysLeft(), calculateDaysProgress(), calculateInvoiceProgress(), calculatePerformedWorkValue(), calculateProgressFromTariffs() (+24 more)

### Community 8 - "Community 8"
Cohesion: 0.07
Nodes (24): InspectionCoreService, Checklist, ChecklistCategory, CreateInspectionCommand, CreateInspectionRequestCommand, CreateNCRCommand, CreateReportCommand, InspectionReport (+16 more)

### Community 9 - "Community 9"
Cohesion: 0.17
Nodes (13): DepartmentCard(), DepartmentCardProps, DepartmentsTabProps, UserRow(), UserRowProps, UsersTab(), UsersTabProps, UserTable() (+5 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (26): Department, DEPARTMENTS, getDepartmentById(), getDepartmentName(), ENTITIES, ENTITY_GROUPS, EntityType, CURRENT_USER (+18 more)

### Community 11 - "Community 11"
Cohesion: 0.10
Nodes (22): PermissionToolbarProps, useClientEdit(), DepartmentUsersModal(), Billing(), Reports(), Settings(), isNightTime(), ThemeContext (+14 more)

### Community 12 - "Community 12"
Cohesion: 0.10
Nodes (15): InspectionRequestApplicationService, inspectionRequestAppService, BaseInspectionRequest, MWSCancellationReason, MWSDiscipline, MWSDocumentType, MWSInspectionMethod, MWSInspectionStage (+7 more)

### Community 13 - "Community 13"
Cohesion: 0.12
Nodes (21): InspectionProjectDetails, InspectorAssignmentSection(), InspectorAssignmentSectionProps, useInspectorForm(), useMasterDataOptions(), INSPECTION_STATUS_CONFIG, Button(), FloatingSearch() (+13 more)

### Community 14 - "Community 14"
Cohesion: 0.13
Nodes (20): cn(), Avatar(), AvatarProps, Badge(), BadgeProps, BadgeTone, ButtonProps, ButtonVariant (+12 more)

### Community 15 - "Community 15"
Cohesion: 0.13
Nodes (20): AppContent(), meta, PermissionGuard(), PermissionGuardProps, useInspectors(), usePermissionMapping(), Dashboard(), Inspections() (+12 more)

### Community 16 - "Community 16"
Cohesion: 0.17
Nodes (20): useNotifications(), useToast(), INotificationService, NotificationCategory, NotificationFilter, NotificationType, Toast, categoryColors (+12 more)

### Community 17 - "Community 17"
Cohesion: 0.14
Nodes (9): VendorApplicationService, Vendor, CreateVendorCommand, CreateVendorSchema, IVendorRepository, SupabaseVendorRepository, vendorRepository, VendorAutocomplete() (+1 more)

### Community 18 - "Community 18"
Cohesion: 0.16
Nodes (8): MWSElements, ElementRegistry, RegistryStats, UIElementDefinition, UIElementMap, UIElementType, UIModuleElements, ValidationError

### Community 19 - "Community 19"
Cohesion: 0.11
Nodes (19): amendmentAppService, AuthError, AuthSession, LoginCredentials, User, TabKey, useApprovalModal(), useAuth() (+11 more)

### Community 20 - "Community 20"
Cohesion: 0.13
Nodes (11): ApprovalApplicationService, approvalAppService, ApprovalFieldType, ApprovalStatus, PendingApproval, approvalRepository, DbRecord, FIELD_TO_TABLE_MAPPING (+3 more)

### Community 21 - "Community 21"
Cohesion: 0.14
Nodes (17): DisciplineGroup, EquipmentApplicationService, equipmentAppService, EquipmentGroup, EquipmentFreeSearch(), EquipmentFreeSearchProps, GroupedEquipmentSelect(), GroupedEquipmentSelectProps (+9 more)

### Community 22 - "Community 22"
Cohesion: 0.15
Nodes (6): InspectorAttendanceApplicationService, InspectorAttendance, MonthlyAttendanceSummary, IInspectorAttendanceRepository, inspectorAttendanceRepository, SupabaseInspectorAttendanceRepository

### Community 23 - "Community 23"
Cohesion: 0.11
Nodes (10): useEventToNotification(), DomainEvent, EVENT_TYPES, EventBus, EventHandler, EventType, IEventBus, subscribeOnce() (+2 more)

### Community 24 - "Community 24"
Cohesion: 0.13
Nodes (9): amendmentRepo, contractRepo, tariffRepo, TariffLine, ITariffRepository, SupabaseTariffRepository, TariffApplicationService, ContractAmendmentFormProps (+1 more)

### Community 25 - "Community 25"
Cohesion: 0.19
Nodes (10): ChecklistApplicationService, checklistAppService, ChecklistSection(), ChecklistSectionProps, ChecklistData, ChecklistGroup, ChecklistItem, ChecklistTemplate (+2 more)

### Community 26 - "Community 26"
Cohesion: 0.19
Nodes (5): Contract, IContractRepository, SupabaseContractRepository, ContractApplicationService, ContractEditFormProps

### Community 27 - "Community 27"
Cohesion: 0.10
Nodes (19): documentReviewAppService, DocumentReviewSection(), DocumentReviewSectionProps, UploadFileItem, UploadingFileItem, InspectionStatus, INSPECTION_CATEGORY_CONFIG, INSPECTION_EXECUTION_STATUS_CONFIG (+11 more)

### Community 28 - "Community 28"
Cohesion: 0.15
Nodes (14): clientAppService, contractAppService, tariffAppService, ContractStatusFilter, useContracts(), useProjectForm(), useEvent(), Contracts() (+6 more)

### Community 29 - "Community 29"
Cohesion: 0.16
Nodes (8): Client, IClientRepository, ClientApplicationService, ClientDetailsProps, ClientEditModalProps, ClientFormProps, ClientListProps, ContractDetailsProps

### Community 30 - "Community 30"
Cohesion: 0.22
Nodes (9): DepartmentUsersModalProps, UserRowProps, UserElementAccessModalProps, User, UserStatus, CreateUserPayload, IUserRepository, UpdateUserPayload (+1 more)

### Community 31 - "Community 31"
Cohesion: 0.19
Nodes (4): Department, IDepartmentRepository, SupabaseDepartmentRepository, DepartmentApplicationService

### Community 32 - "Community 32"
Cohesion: 0.26
Nodes (8): TPIRequestDetailsDTO, vendorAppService, InspectionItem, SourceFile, projectAppService, ITPIRequestRepository, tpiRequestRepository, TabType

### Community 33 - "Community 33"
Cohesion: 0.15
Nodes (6): TPIRequest, SupabaseTPIRequestRepository, InspectionDetailsModalProps, TPIDetailsModalProps, TPIRequestCardProps, TPIRequestFormProps

### Community 34 - "Community 34"
Cohesion: 0.17
Nodes (10): MasterDataApplicationService, masterDataAppService, InspectionMethodSelector(), InspectionMethodSelectorProps, METHOD_ICONS, InspectionStageSelector(), InspectionStageSelectorProps, STAGE_ICONS (+2 more)

### Community 35 - "Community 35"
Cohesion: 0.19
Nodes (3): MonthlyReportApplicationService, MonthlyReport, SupabaseMonthlyReportRepository

### Community 36 - "Community 36"
Cohesion: 0.19
Nodes (9): ClientElements, useClickOutside(), useClientDetails(), useClients(), exportToExcel(), Clients(), getProgressBgClass(), ClientDetails() (+1 more)

### Community 37 - "Community 37"
Cohesion: 0.21
Nodes (4): PermissionMapping, IPermissionMappingRepository, SupabasePermissionMappingRepository, PermissionMappingApplicationService

### Community 38 - "Community 38"
Cohesion: 0.21
Nodes (3): ResidentInspectionApplicationService, ResidentInspection, SupabaseResidentInspectionRepository

### Community 39 - "Community 39"
Cohesion: 0.15
Nodes (17): CardHeader(), CardHeaderProps, useContractAmendmentForm(), useContractDocumentsModal(), formatCurrency(), formatNumberInput(), parseNumberInput(), AnimatedCollapse() (+9 more)

### Community 40 - "Community 40"
Cohesion: 0.20
Nodes (13): getAllEntities(), getBasePermissions(), getBasePermissionsInfo(), isBasePermission(), KNOWN_ENTITIES, ROLE_BASE_PERMISSIONS, calculateEffectivePermissions(), countPermissionsByEntity() (+5 more)

### Community 41 - "Community 41"
Cohesion: 0.25
Nodes (3): applyDepartmentFilter(), getDepartmentFilter(), SupabaseClientRepository

### Community 42 - "Community 42"
Cohesion: 0.18
Nodes (6): ContractDocument, TabKey, ContractAmendment, SupabaseAmendmentRepository, ApprovalModalProps, ContractDocumentsModalProps

### Community 46 - "Community 46"
Cohesion: 0.21
Nodes (7): InspectionItemApplicationService, inspectionItemAppService, DISCIPLINE_TO_CATEGORIES, getCategoriesForDisciplines(), EquipmentItem, inspectionItemRepository, SupabaseInspectionItemRepository

### Community 47 - "Community 47"
Cohesion: 0.17
Nodes (3): IDocumentReviewRepository, documentReviewRepository, SupabaseDocumentReviewRepository

### Community 48 - "Community 48"
Cohesion: 0.33
Nodes (5): ATTENDANCE_STATUS_OPTIONS, AttendanceTracker(), AttendanceTrackerProps, JalaaliDatePicker(), JalaaliDatePickerProps

### Community 50 - "Community 50"
Cohesion: 0.18
Nodes (10): authAppService, departmentAppService, userAppService, DepartmentsTab(), useUserManagement(), DepartmentModal(), DepartmentModalProps, UserElementAccessModal() (+2 more)

### Community 52 - "Community 52"
Cohesion: 0.17
Nodes (9): ApprovalDashboard(), TabType, STATUS_COLORS, STATUS_LABELS, InspectorScheduleModal(), InspectorScheduleModalProps, MONTHS_EN, WEEK_DAYS_EN (+1 more)

### Community 54 - "Community 54"
Cohesion: 0.21
Nodes (7): AmendmentApprovalStatus, AmendmentType, ContractStatus, ContractType, CreateAmendmentData, TariffAdjustment, TariffAdjustmentMode

### Community 55 - "Community 55"
Cohesion: 0.26
Nodes (10): UserManagementTabs(), UserManagementTabsProps, DBUser, DepartmentAction, DepartmentWithUsers, TabConfig, USER_MANAGEMENT_TABS, UserAction (+2 more)

### Community 56 - "Community 56"
Cohesion: 0.21
Nodes (7): deepDiff(), diffArrays(), diffObjects(), DiffResult, FieldChange, getObjectFieldChanges(), STORAGE_EVENT_MAP

### Community 57 - "Community 57"
Cohesion: 0.25
Nodes (8): inspectorAttendanceAppService, monthlyReportAppService, monthlyReportRepository, MonthlyReportForm(), MonthlyReportFormProps, ResidentDashboard(), ResidentDashboardProps, ViewMode

### Community 59 - "Community 59"
Cohesion: 0.27
Nodes (6): inspectionAppService, inspectionRepo, CreateDocumentReviewCommand, CreateDocumentReviewSchema, CreateInspectionCommand, CreateInspectionSchema

### Community 60 - "Community 60"
Cohesion: 0.31
Nodes (4): residentInspectionAppService, IMonthlyReportRepository, IResidentInspectionRepository, residentInspectionRepository

### Community 61 - "Community 61"
Cohesion: 0.22
Nodes (7): ViewMeta, views, NavItem, navItems, Sidebar(), SidebarProps, ViewKey

### Community 62 - "Community 62"
Cohesion: 0.29
Nodes (6): useClientForm(), useDuplicateWarning(), AnimatedModalProps, ClientForm(), DuplicateWarningModal(), Modal()

### Community 63 - "Community 63"
Cohesion: 0.22
Nodes (6): Theme, ThemeColors, ThemeContext, ThemeContextType, colors, themeColors

### Community 64 - "Community 64"
Cohesion: 0.36
Nodes (4): inspectionAppService, IInspectionRepository, inspectionRepository, InspectorAssignment

### Community 65 - "Community 65"
Cohesion: 0.29
Nodes (7): AttendanceStatus, InspectionItemSourceType, TPIDiscipline, TPIDocumentType, TPIInspectionMethod, TPIInspectionStage, TPIReportType

### Community 68 - "Community 68"
Cohesion: 0.40
Nodes (3): __dirname, __filename, supabase

### Community 70 - "Community 70"
Cohesion: 0.50
Nodes (3): clients, contracts, contractTariffs

### Community 116 - "Community 116"
Cohesion: 0.20
Nodes (11): DepartmentSelect(), DepartmentSelectProps, getRoleConfig(), isManagerRole(), ROLE_CONFIGS, RoleConfig, ROLES, UserRole (+3 more)

### Community 117 - "Community 117"
Cohesion: 0.43
Nodes (4): tpiRequestAppService, TPIElements, TabType, TPIDetailsModal()

## Knowledge Gaps
- **237 isolated node(s):** `meta`, `ThemeMode`, `ThemeContextType`, `ThemeContext`, `ViewMeta` (+232 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `Community 11` to `Community 0`, `Community 1`, `Community 6`, `Community 7`, `Community 9`, `Community 13`, `Community 14`, `Community 15`, `Community 17`, `Community 19`, `Community 20`, `Community 21`, `Community 23`, `Community 25`, `Community 27`, `Community 28`, `Community 32`, `Community 34`, `Community 36`, `Community 39`, `Community 48`, `Community 50`, `Community 52`, `Community 55`, `Community 57`, `Community 61`, `Community 62`, `Community 116`, `Community 117`?**
  _High betweenness centrality (0.149) - this node is a cross-community bridge._
- **Why does `supabase` connect `Community 2` to `Community 0`, `Community 3`, `Community 4`, `Community 5`, `Community 12`, `Community 13`, `Community 17`, `Community 20`, `Community 21`, `Community 22`, `Community 23`, `Community 25`, `Community 30`, `Community 31`, `Community 32`, `Community 34`, `Community 36`, `Community 37`, `Community 41`, `Community 46`, `Community 47`, `Community 48`, `Community 54`, `Community 60`, `Community 61`, `Community 64`, `Community 116`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Why does `showToast()` connect `Community 5` to `Community 0`, `Community 1`, `Community 4`, `Community 6`, `Community 7`, `Community 11`, `Community 13`, `Community 15`, `Community 17`, `Community 19`, `Community 20`, `Community 21`, `Community 23`, `Community 27`, `Community 28`, `Community 36`, `Community 48`, `Community 50`, `Community 52`, `Community 54`, `Community 57`, `Community 117`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `usePermissionMapping()` (e.g. with `useContractDetails()` and `useContractDetails()`) actually correct?**
  _`usePermissionMapping()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `meta`, `ThemeMode`, `ThemeContextType` to the rest of the system?**
  _237 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.052604698672114404 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.0635350797952424 - nodes in this community are weakly interconnected._