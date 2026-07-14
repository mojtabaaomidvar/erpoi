// src/shared/authorization/ui/permission-manager/components/CreatePermissionModal.tsx

import { useState, useMemo } from "react";
import { Modal, Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import type { DBPermissionMapping, DBUIElement } from "@shared/database/types";

interface CreatePermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (permission: string) => void;
  onGoToDuplicate: (permission: string) => void;
  entities: string[];
  uiElements: DBUIElement[];
  existingPermissions: Set<string>;
}

export function CreatePermissionModal({
  isOpen,
  onClose,
  onCreate,
  onGoToDuplicate,
  entities,
  uiElements,
  existingPermissions,
}: CreatePermissionModalProps) {
  const { isDark } = useTheme();
  const [newEntity, setNewEntity] = useState("");
  const [newAction, setNewAction] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicatePermission, setDuplicatePermission] = useState("");

  const previewPermission = useMemo(() => {
    if (!newEntity || !newAction) return "";
    return `${newEntity}:${newAction}`;
  }, [newEntity, newAction]);

  const previewElements = useMemo(() => {
    if (!newEntity) return [];
    return uiElements.filter((el) => el.id.startsWith(`${newEntity}_`));
  }, [uiElements, newEntity]);

  const isDuplicate = useMemo(() => {
    return previewPermission && existingPermissions.has(previewPermission);
  }, [previewPermission, existingPermissions]);

  const handleNext = () => {
    if (!newEntity || !newAction) return;
    if (isDuplicate) {
      setDuplicatePermission(previewPermission);
      setShowDuplicateWarning(true);
      return;
    }
    setShowPreview(true);
  };

  const handleCreate = () => {
    onCreate(previewPermission);
    handleClose();
  };

  const handleGoToDuplicate = () => {
    onGoToDuplicate(duplicatePermission);
    handleClose();
  };

  const handleClose = () => {
    onClose();
    setShowPreview(false);
    setShowDuplicateWarning(false);
    setNewEntity("");
    setNewAction("");
    setDuplicatePermission("");
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Create New Permission"
        size="lg"
      >
        <div className="space-y-4">
          {!showPreview ? (
            <>
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-slate-200" : "text-slate-700"
                  }`}
                >
                  🔷 Entity <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newEntity}
                  onChange={(e) => setNewEntity(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm ${
                    isDark
                      ? "border-slate-700 bg-slate-800 text-slate-200"
                      : "border-slate-300 bg-white text-slate-900"
                  }`}
                >
                  <option value="">Select an entity...</option>
                  {entities.map((entity) => (
                    <option key={entity} value={entity}>
                      {entity} (
                      {uiElements.filter((el) => el.entity === entity).length}{" "}
                      elements)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-slate-200" : "text-slate-700"
                  }`}
                >
                  ⚡ Action <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newAction}
                  onChange={(e) =>
                    setNewAction(
                      e.target.value.toLowerCase().replace(/\s+/g, "_"),
                    )
                  }
                  placeholder="e.g., read, create, update"
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm ${
                    isDark
                      ? "border-slate-700 bg-slate-800 text-slate-200"
                      : "border-slate-300 bg-white text-slate-900"
                  }`}
                />
              </div>
              {newEntity && newAction && (
                <div
                  className={`p-3 rounded-lg border ${
                    isDark
                      ? "border-indigo-700 bg-indigo-900/20"
                      : "border-indigo-200 bg-indigo-50"
                  }`}
                >
                  <code
                    className={`text-sm font-mono ${
                      isDark ? "text-indigo-300" : "text-indigo-700"
                    }`}
                  >
                    {previewPermission}
                  </code>
                </div>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="secondary" size="md" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleNext}
                  disabled={!newEntity || !newAction}
                >
                  Next: Preview →
                </Button>
              </div>
            </>
          ) : (
            <>
              <div
                className={`p-4 rounded-lg border ${
                  isDark
                    ? "border-slate-700 bg-slate-800/50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <h3
                  className={`text-sm font-bold mb-3 ${
                    isDark ? "text-slate-100" : "text-slate-900"
                  }`}
                >
                  📋 Permission Details
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs ${
                        isDark ? "text-slate-400" : "text-slate-600"
                      }`}
                    >
                      Permission Name:
                    </span>
                    <code
                      className={`text-xs font-mono px-2 py-1 rounded ${
                        isDark
                          ? "bg-indigo-900/30 text-indigo-300"
                          : "bg-indigo-100 text-indigo-700"
                      }`}
                    >
                      {previewPermission}
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs ${
                        isDark ? "text-slate-400" : "text-slate-600"
                      }`}
                    >
                      Related Elements:
                    </span>
                    <Badge tone="indigo" className="text-[10px]">
                      {previewElements.length} elements
                    </Badge>
                  </div>
                </div>
              </div>
              {previewElements.length > 0 ? (
                <div
                  className={`rounded-lg border max-h-60 overflow-y-auto ${
                    isDark
                      ? "border-slate-700 bg-slate-800/30"
                      : "border-slate-200 bg-slate-50/50"
                  }`}
                >
                  <div
                    className={`px-3 py-2 border-b text-xs font-medium ${
                      isDark
                        ? "border-slate-700 bg-slate-800 text-slate-200"
                        : "border-slate-200 bg-slate-100 text-slate-700"
                    }`}
                  >
                    🔗 Related UI Elements (will start empty)
                  </div>
                  <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {previewElements.slice(0, 10).map((element) => (
                      <div
                        key={element.id}
                        className={`px-3 py-2 text-xs ${
                          isDark ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        <code
                          className={
                            isDark ? "text-indigo-300" : "text-indigo-700"
                          }
                        >
                          {element.id}
                        </code>
                        <span
                          className={`ml-2 ${
                            isDark ? "text-slate-500" : "text-slate-400"
                          }`}
                        >
                          {element.name}
                        </span>
                      </div>
                    ))}
                    {previewElements.length > 10 && (
                      <div
                        className={`px-3 py-2 text-xs text-center ${
                          isDark ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        ... and {previewElements.length - 10} more
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  className={`p-4 rounded-lg border text-center ${
                    isDark
                      ? "border-amber-700 bg-amber-900/20"
                      : "border-amber-200 bg-amber-50"
                  }`}
                >
                  <div className="text-2xl mb-1">⚠️</div>
                  <p
                    className={`text-xs ${
                      isDark ? "text-amber-200" : "text-amber-800"
                    }`}
                  >
                    No UI elements found for entity "
                    <strong>{newEntity}</strong>"
                  </p>
                </div>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setShowPreview(false)}
                >
                  ← Back
                </Button>
                <Button variant="primary" size="md" onClick={handleCreate}>
                  ✓ Create Permission
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Duplicate Warning Modal */}
      <Modal
        isOpen={showDuplicateWarning}
        onClose={() => {
          setShowDuplicateWarning(false);
          setDuplicatePermission("");
        }}
        title="⚠️ Permission Already Exists"
        size="md"
      >
        <div className="space-y-4">
          <div
            className={`p-4 rounded-lg border ${
              isDark
                ? "border-amber-700 bg-amber-900/20"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <h4
                  className={`text-sm font-bold mb-1 ${
                    isDark ? "text-amber-200" : "text-amber-800"
                  }`}
                >
                  This permission already exists
                </h4>
                <p
                  className={`text-xs ${
                    isDark ? "text-amber-300" : "text-amber-700"
                  }`}
                >
                  You can edit the existing one instead.
                </p>
              </div>
            </div>
          </div>
          <div
            className={`p-3 rounded-lg border ${
              isDark
                ? "border-slate-700 bg-slate-800/50"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-xs ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Existing Permission:
              </span>
              <code
                className={`text-xs font-mono px-2 py-1 rounded ${
                  isDark
                    ? "bg-indigo-900/30 text-indigo-300"
                    : "bg-indigo-100 text-indigo-700"
                }`}
              >
                {duplicatePermission}
              </code>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setShowDuplicateWarning(false);
                setDuplicatePermission("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleGoToDuplicate}
            >
              🔗 Go to Permission
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}