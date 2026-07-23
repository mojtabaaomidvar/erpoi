// src/shared/authorization/components/DepartmentSelect.tsx

import { useState, useEffect } from "react";
import { useTheme } from "@app/providers/ThemeProvider";
import { supabase } from "@shared/database/supabase";
import type { Department } from "@shared/authorization";

interface DepartmentSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function DepartmentSelect({
  value,
  onChange,
  className,
  placeholder = "Select department...",
}: DepartmentSelectProps) {
  const { isDark } = useTheme();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      console.log("[DepartmentSelect] 📥 Loading departments from Supabase");

      // 🔧 FIX: Use supabase directly instead of getDB().getAllDepartments()
      const { data, error } = await supabase
        .from("core.departments")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error(
          "[DepartmentSelect] ❌ Failed to load departments:",
          error,
        );
        return;
      }

      console.log(
        "[DepartmentSelect] ✅ Departments loaded:",
        data?.length || 0,
      );
      setDepartments(data || []);
    } catch (err) {
      console.error("[DepartmentSelect] ❌ Error loading departments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  if (loading) {
    return (
      <div
        className={`w-full rounded-lg border px-3 py-2 text-sm ${
          isDark
            ? "border-slate-600 bg-slate-700 text-slate-400"
            : "border-slate-300 bg-slate-100 text-slate-500"
        }`}
      >
        Loading...
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all ${
        isDark
          ? "border-slate-600 bg-slate-700 text-slate-100 focus:border-indigo-400 focus:ring-indigo-900"
          : "border-slate-300 bg-white focus:border-indigo-400 focus:ring-indigo-100"
      } ${className}`}
    >
      <option value="">{placeholder}</option>
      {departments.map((dept) => (
        <option key={dept.id} value={dept.id}>
          {dept.name}
        </option>
      ))}
    </select>
  );
}
