// src/types/inspection.ts

// ⚠️ این فایل فقط برای سازگاری با کدهای قدیمی (Backward Compatibility) است.
// تمام تایپ‌های اصلی اکنون در لایه Domain ماژول‌های مربوطه قرار دارند.

export * from "@features/inspection-management/domain/types";
export type {
  Project,
  ProjectMember,
  ProjectRole,
} from "@features/project-management/domain/types";
