// src/pages/Projects.tsx

import { useState, useEffect } from "react";
import { useTheme } from "@app/providers/ThemeProvider";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import { useAuth } from "@features/auth/hooks/useAuth";
import { confirmDialog } from "@shared/ui/ConfirmDialog";
import { EmptyState } from "@shared/ui/EmptyState";
import { Lock } from "lucide-react";
import { showToast } from "@shared/ui/ToastContainer";
import { projectAppService } from "@/features/project-management";
import { ProjectList } from "@features/project-management/ui/ProjectList";
import { ProjectForm } from "@features/project-management/ui/ProjectForm";
import { ProjectDetailsModal } from "@features/project-management/ui/ProjectDetailsModal";
import type { Project } from "@features/project-management/domain/types";
import type { ProjectRole } from "@features/project-management/domain/types";

export function Projects() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { canAccessElement } = usePermissionMapping();

  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const comingSoonServices = ["TPER", "Others"];

  // Permissions
  const canViewItems = canAccessElement("project_list_item_view");
  const canClickItem = canAccessElement("project_list_item_click");
  const canAdd = canAccessElement("project_btn_add");
  const canEdit = canAccessElement("project_btn_edit");
  const canDelete = canAccessElement("project_btn_delete");

  // Load Projects
  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await projectAppService.getAllProjects();
      setProjects(data);
    } catch (err: any) {
      showToast("error", "Load Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Handlers

  const handleSaveProject = async (formData: any) => {
    if (!formData.project_manager_id || !formData.coordinator_id) {
      showToast(
        "error",
        "Error",
        "Project Manager and Coordinator are required",
      );
      return;
    }

    const tempId = `temp_${Date.now()}`;
    const optimisticProject: any = {
      id: tempId,
      name: formData.name,
      client_id: formData.client_id,
      contract_id: formData.contract_id,
      service_types: formData.service_types,
      status: "ACTIVE",
      start_date: formData.start_date,
      end_date: formData.end_date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _isOptimistic: true,
    };

    setProjects((prev) => [optimisticProject, ...prev]);
    setIsAddModalOpen(false);
    setEditingProject(null);

    try {
      const realProject = await projectAppService.createProject(
        formData,
        user?.id || "unknown",
      );
      const userId = user?.id || "unknown";

      const membersToAdd: { userId: string; role: ProjectRole }[] = [
        { userId: formData.project_manager_id, role: "PROJECT_MANAGER" },
      ];

      if (
        formData.coordinator_id &&
        formData.coordinator_id !== formData.project_manager_id
      ) {
        membersToAdd.push({
          userId: formData.coordinator_id,
          role: "COORDINATOR",
        });
      }

      for (const member of membersToAdd) {
        await projectAppService.addProjectMember(
          realProject.id,
          member.userId,
          member.role,
          userId,
        );
      }

      setProjects((prev) =>
        prev.map((p) => (p.id === tempId ? realProject : p)),
      );
      showToast("success", "Success", "Project created successfully!");

      if (formData.project_manager_id) {
        await projectAppService.addProjectMember(
          realProject.id,
          formData.project_manager_id,
          "PROJECT_MANAGER",
          userId,
        );
      }

      if (
        formData.coordinator_id &&
        formData.coordinator_id !== formData.project_manager_id
      ) {
        await projectAppService.addProjectMember(
          realProject.id,
          formData.coordinator_id,
          "COORDINATOR",
          userId,
        );
      }

      setProjects((prev) =>
        prev.map((p) => (p.id === tempId ? realProject : p)),
      );

      showToast("success", "Success", "Project created successfully!");
    } catch (err: any) {
      setProjects((prev) => prev.filter((p) => p.id !== tempId));
      console.error("❌ [Background Save Failed]:", err);
      showToast(
        "error",
        "Background Save Failed",
        err.message || "Failed to save project",
      );
    }
  };

  const handleAddClick = () => {
    setIsAddModalOpen(true);
    setEditingProject(null);
  };

  const handleProjectClick = (project: Project) => {
    if (!canClickItem) {
      showToast(
        "error",
        "Access Denied",
        "You do not have permission to view project details",
      );
      return;
    }
    setSelectedProject(project);
    setIsDetailsOpen(true);
  };

  const handleEditFromDetails = (project: Project) => {
    if (!canEdit) {
      showToast(
        "error",
        "Access Denied",
        "You do not have permission to edit projects",
      );
      return;
    }
    setEditingProject(project);
    setIsAddModalOpen(true);
  };

  const handleDeleteProject = async (project: Project) => {
    if (!canDelete) {
      showToast(
        "error",
        "Access Denied",
        "You do not have permission to delete projects",
      );
      return;
    }

    const confirmed = await confirmDialog({
      title: "Delete Project",
      message: `Are you sure you want to delete "${project.name}"?\n\nThis action cannot be undone.`,
      confirmText: "Yes, Delete",
      cancelText: "Cancel",
      variant: "danger",
    });

    if (!confirmed) return;

    setIsDetailsOpen(false);
    setSelectedProject(null);

    setProjects((prev) => prev.filter((p) => p.id !== project.id));
    showToast("success", "Deleted", "Project has been removed");

    await projectAppService.deleteProject(
      project.id,
      user?.id || "unknown",
      user?.role || "viewer",
    );
  };

  // Access Denied View
  if (!canViewItems) {
    return (
      <EmptyState
        icon={Lock}
        title="Access Denied"
        description="You do not have permission to view the projects module."
        className="min-h-[60vh]"
      />
    );
  }

  return (
    <>
      <ProjectList
        projects={projects}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        onProjectClick={handleProjectClick}
        onAddClick={handleAddClick}
        loading={loading}
      />
      <ProjectDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedProject(null);
        }}
        project={selectedProject}
        onEdit={handleEditFromDetails}
      />

      <ProjectForm
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProject(null);
        }}
        onSave={handleSaveProject}
        initialData={editingProject}
      />
    </>
  );
}
