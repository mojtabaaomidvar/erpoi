// src/features/inspection-management/domain/checklistTypes.ts

export interface ChecklistTemplate {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

export interface ChecklistItem {
  id: string;
  template_id: string;
  inspection_method: string;
  sequence: number;
  checklist_text: string;
  is_active: boolean;
}

export interface ChecklistGroup {
  method: string;
  items: ChecklistItem[];
}

export interface ChecklistData {
  template: ChecklistTemplate | null;
  groups: ChecklistGroup[];
}

// ✅ وضعیت‌های چک‌لیست
export type ChecklistItemStatus =
  | "PENDING"
  | "PASS"
  | "REJECT"
  | "NOTE"
  | "N/A";

// ✅ متادیتای رنگی برای هر وضعیت
export interface StatusMetadata {
  label: string;
  icon: string;
  color: string;
  gradient: string;
  softColor: string;
  borderColor: string;
}

// ✅ نتیجه هر آیتم چک‌لیست
export interface ChecklistItemResult {
  item_id: string;
  request_id?: string;
  equipment_id: string;
  inspection_method: string;
  checklist_text?: string;
  status: ChecklistItemStatus;
  comment?: string;
  checked_by?: string;
  checked_at?: string;
  photo_urls?: string[];
}

// ✅ Session چک‌لیست برای ذخیره در دیتابیس
export interface ChecklistSession {
  id: string;
  request_id: string;
  equipment_id: string;
  inspection_method: string;
  results: ChecklistItemResult[];
  total_items: number;
  completed_items: number;
  status: "IN_PROGRESS" | "COMPLETED" | "SUBMITTED";
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ✅ آیتم مشترک بین چند تجهیز
export interface SharedChecklistItem {
  checklist_text: string;
  equipment_ids: string[];
  methods: string[];
  count: number;
}

// ✅ متادیتای رنگی برای هر متد بازرسی
export interface MethodMetadata {
  method: string;
  icon: string;
  gradient: string;
  color: string;
}
