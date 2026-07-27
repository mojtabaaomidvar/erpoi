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
      console.log(
        "🔵 [ProjectSelector] Calling projectAppService.getAllProjects()...",
      );
      const data = await projectAppService.getAllProjects();

      console.log("🟣 [ProjectSelector] Raw data received from service:", data);
      console.log(
        "🟣 [ProjectSelector] Data type:",
        typeof data,
        "Is Array?",
        Array.isArray(data),
      );

      const activeProjects = data.filter((p: any) => p.status === "ACTIVE");
      console.log(
        "🟢 [ProjectSelector] Filtered ACTIVE projects:",
        activeProjects,
      );

      setProjects(activeProjects);

      if (activeProjects.length === 0) {
        console.warn(
          "⚠️ [ProjectSelector] No ACTIVE projects found in the database.",
        );
        setLoadError("هیچ پروژه فعالی یافت نشد.");
      }
    } catch (err: any) {
      console.error("🔴 [ProjectSelector] CRITICAL ERROR CAUGHT:");
      console.error("🔴 Error Object:", err);
      console.error("🔴 Error Message:", err?.message);
      console.error("🔴 Error Details:", JSON.stringify(err, null, 2));

      const errorMsg = err?.message || "خطای ناشناخته در بارگذاری پروژه‌ها";
      setLoadError(errorMsg);
    } finally {
      console.log("⚪ [ProjectSelector] Loading state set to false.");
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log(
      "🟢 [ProjectSelector] Component mounted. Starting loadProjects...",
    );
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
