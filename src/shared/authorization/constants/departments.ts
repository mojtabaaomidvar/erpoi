// src/shared/authorization/departments.ts

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export const DEPARTMENTS: Department[] = [
  { id: 'it', name: 'IT', description: 'Information Technology' },
  { id: 'contracts', name: 'Contracts', description: 'Contract Management' },
  { id: 'oi', name: 'Offshore', description: 'Offshore & Energy Department' },
];

export function getDepartmentById(id: string): Department | undefined {
  return DEPARTMENTS.find(d => d.id === id);
}

export function getDepartmentName(id: string): string {
  return getDepartmentById(id)?.name || id;
}