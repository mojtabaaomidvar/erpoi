// src/shared/authorization/components/DepartmentSelect.tsx

import { DEPARTMENTS, getDepartmentName } from '../departments';

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
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 ${className}`}
    >
      <option value="">{placeholder}</option>
      {DEPARTMENTS.map((dept) => (
        <option key={dept.id} value={dept.id}>
          {dept.name} - {dept.description}
        </option>
      ))}
    </select>
  );
}

// Helper component برای نمایش نام department
export function DepartmentBadge({ departmentId }: { departmentId?: string }) {
  if (!departmentId) {
    return <span className="text-slate-400">N/A</span>;
  }

  return (
    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs">
      {getDepartmentName(departmentId)}
    </span>
  );
}