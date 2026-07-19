// src/features/inspection-management/ui/ProjectSelector.tsx

import { useState, useEffect } from "react";
import { useTheme } from "@app/providers/ThemeProvider";
import { projectAppService } from "@features/project-management/application/ProjectApplicationService";
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

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await projectAppService.getAllProjects();
      setProjects(data.filter((p) => p.status === "ACTIVE"));
    } catch (err) {
      console.error("Failed to load projects", err);
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
        className={`w-full rounded-lg px-3 py-2.5 text-sm input-themed ${error ? "border-rose-500" : ""}`}
        disabled={loading}
      >
        <option value="">-- Select Project --</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
      {error && <p className="text-[11px] text-rose-600 mt-1">✕ {error}</p>}
    </div>
  );
}
