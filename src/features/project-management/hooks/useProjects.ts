// src/features/project-management/hooks/useProjects.ts

import { useState, useEffect, useCallback } from "react";
import { projectAppService } from "../index";
import type { Project, ProjectMember } from "../domain/types";
import { showToast } from "@shared/ui/ToastContainer";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await projectAppService.getAllProjects();
      setProjects(data);
    } catch (err: any) {
      console.error("[useProjects] Failed to load projects:", err);
      setError(err.message || "Failed to load projects");
      showToast("error", "خطا", "بارگذاری پروژه‌ها با شکست مواجه شد");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const createProject = async (
    command: any,
    userId: string,
    teamMembers?: any[],
  ) => {
    try {
      if (teamMembers && teamMembers.length > 0) {
        await projectAppService.createProjectWithTeam(
          command,
          userId,
          teamMembers,
        );
      } else {
        await projectAppService.createProject(command, userId);
      }
      showToast("success", "موفق", "پروژه با موفقیت ایجاد شد");
      await loadProjects();
      return true;
    } catch (err: any) {
      showToast("error", "خطا", err.message);
      return false;
    }
  };

  const deleteProject = async (
    id: string,
    userId: string,
    userGlobalRole: string,
  ) => {
    try {
      await projectAppService.deleteProject(id, userId, userGlobalRole);
      showToast("success", "موفق", "پروژه حذف شد");
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      showToast("error", "خطا", err.message);
    }
  };

  return {
    projects,
    loading,
    error,
    loadProjects,
    createProject,
    deleteProject,
  };
}
