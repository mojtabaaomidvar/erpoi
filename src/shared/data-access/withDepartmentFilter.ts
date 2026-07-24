// src/shared/data-access/withDepartmentFilter.ts

import { authAppService } from "@/features/auth";

export function getDepartmentFilter(): string | null {
  const session = authAppService.getSession();
  const user = session?.user;

  if (user?.role === "admin" || user?.role === "super_admin") {
    return null;
  }

  const userDept = user?.department;

  if (Array.isArray(userDept)) {
    return userDept.length > 0 ? String(userDept[0]) : null;
  }

  return typeof userDept === "string" ? userDept : null;
}

export function applyDepartmentFilter(
  query: any,
  columnName: string = "department",
  isArray: boolean = false,
) {
  const dept = getDepartmentFilter();

  if (dept) {
    if (isArray) {
      return query.contains(columnName, [dept]);
    } else {
      return query.eq(columnName, dept);
    }
  }

  return query;
}
