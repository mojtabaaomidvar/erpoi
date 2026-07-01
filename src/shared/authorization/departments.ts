// src/shared/authorization/departments.ts

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export const DEPARTMENTS: Department[] = [
  { id: 'it', name: 'IT', description: 'Information Technology' },
  { id: 'contracts', name: 'Contracts', description: 'Contract Management' },
  { id: 'inspections', name: 'Inspections', description: 'Inspection Operations' },
  { id: 'finance', name: 'Finance', description: 'Financial Operations' },
  { id: 'field', name: 'Field', description: 'Field Operations' },
  { id: 'management', name: 'Management', description: 'Executive Management' },
  { id: 'hr', name: 'HR', description: 'Human Resources' },
  { id: 'legal', name: 'Legal', description: 'Legal Affairs' },
  { id: 'quality', name: 'Quality', description: 'Quality Assurance' },
  { id: 'general', name: 'General', description: 'General Operations' },
];

export function getDepartmentById(id: string): Department | undefined {
  return DEPARTMENTS.find(d => d.id === id);
}

export function getDepartmentName(id: string): string {
  return getDepartmentById(id)?.name || id;
}