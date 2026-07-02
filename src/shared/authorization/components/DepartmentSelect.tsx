// src/shared/authorization/components/DepartmentSelect.tsx

import { useState, useEffect } from 'react';
import { getDB } from '@shared/database';
import type { DBDepartment } from '@shared/database/types';

interface Props {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function DepartmentSelect({
  value,
  onChange,
  className = '',
  placeholder = 'Select department...'
}: Props) {
  const [departments, setDepartments] = useState<DBDepartment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const db = await getDB();
        const depts = await db.getAllDepartments();
        setDepartments(depts);
      } catch (error) {
        console.error('Failed to load departments:', error);
      } finally {
        setLoading(false);
      }
    };
    loadDepartments();
  }, []);

  if (loading) {
    return (
      <select
        disabled
        className={`w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 ${className}`}
      >
        <option value="">Loading...</option>
      </select>
    );
  }

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 ${className}`}
    >
      <option value="">{placeholder}</option>
      {departments.map((dept) => (
        <option key={dept.id} value={dept.id}>
          {dept.name}{dept.description ? ` - ${dept.description}` : ''}
        </option>
      ))}
    </select>
  );
}

// Helper component برای نمایش نام department
export function DepartmentBadge({ departmentId }: { departmentId?: string }) {
  const [department, setDepartment] = useState<DBDepartment | null>(null);

  useEffect(() => {
    if (!departmentId) return;
    
    const loadDepartment = async () => {
      try {
        const db = await getDB();
        const dept = await db.getDepartment(departmentId);
        setDepartment(dept);
      } catch (error) {
        console.error('Failed to load department:', error);
      }
    };
    loadDepartment();
  }, [departmentId]);

  if (!departmentId || !department) {
    return <span className="text-slate-400">N/A</span>;
  }

  return (
    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs">
      {department.name}
    </span>
  );
}