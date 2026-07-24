//src/features/project-management/hooks/useProjectStats.ts

import { useState, useEffect } from "react";
import { projectStatsAppService } from "../index";
import type { ProjectStats } from "../domain/models/ProjectStats";

export function useProjectStats(projectId: string | null) {
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!projectId) {
      setStats(null);
      return;
    }

    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const data = await projectStatsAppService.getProjectStats(projectId);
        setStats(data);
      } catch (err) {
        console.error(`Failed to load stats for project ${projectId}`, err);
        setStats(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [projectId]);

  return { stats, isLoading };
}
