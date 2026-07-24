// src/shared/authorization/ui/user-management/index.ts

export * from "./types";

// Users
export { UserRow } from "./users/components/UserRow";
export { UserTable } from "./users/components/UserTable";
export { UsersTab } from "./users/components/UsersTab";
export { UserElementAccessModal } from "./users/modals/UserElementAccessModal";

// Departments
export { DepartmentCard } from "./departments/components/DepartmentCard";
export { DepartmentsTab } from "./departments/components/DepartmentsTab";
export { DepartmentSelect } from "./departments/components/DepartmentSelect";

// Shared
export { UserManagementTabs } from "./components/UserManagementTabs";

// Skeletons
export { TableSkeleton } from "./users/skeletons/TableSkeleton";
export { DepartmentCardSkeleton } from "./departments/skeletons/DepartmentCardSkeleton";
