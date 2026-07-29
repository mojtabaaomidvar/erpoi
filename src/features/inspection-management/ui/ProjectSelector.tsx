// src/features/inspection-management/ui/ProjectSelector.tsx

import { useState, useEffect } from "react";
import { useTheme } from "@app/providers/ThemeProvider";
import { projectAppService } from "@/features/project-management";
import type { Project } from "@features/project-management/domain/types";

interface ProjectSelectorProps {
  value: string;
  onChange: (projectId: string) => void;
  error?: string;
}

export function ProjectSelector({
  value,
  onChange,
  error,
}: ProjectSelectorProps) {
  const { isDark } = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadProjects = async () => {
    console.log("🟡 [ProjectSelector] Inside loadProjects function...");
    setLoading(true);
    setLoadError(null);

    try {
      const data = await projectAppService.getAllProjects();

      const activeProjects = data.filter((p: any) => p.status === "ACTIVE");

      setProjects(activeProjects);

      if (activeProjects.length === 0) {
        setLoadError("هیچ پروژه فعالی یافت نشد.");
      }
    } catch (err: any) {
      const errorMsg = err?.message || "خطای ناشناخته در بارگذاری پروژه‌ها";
      setLoadError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg px-3 py-2.5 text-sm input-themed ${
          error || loadError
            ? "border-rose-500 bg-rose-50 dark:bg-rose-900/20"
            : ""
        } ${loading ? "opacity-60 cursor-wait" : ""}`}
        disabled={loading}
      >
        <option value="">
          {loading
            ? "⏳ در حال بارگذاری..."
            : projects.length === 0
              ? "📭 پروژه‌ای یافت نشد"
              : "-- انتخاب پروژه --"}
        </option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
      {loadError && !error && (
        <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-mono">
          <span>⚠️</span> {loadError}
        </p>
      )}
      {error && <p className="text-[11px] text-rose-600 mt-1">✕ {error}</p>}3
    </div>
  );
}
