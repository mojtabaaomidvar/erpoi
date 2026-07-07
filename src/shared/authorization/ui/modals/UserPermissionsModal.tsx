// src/shared/authorization/ui/modals/UserPermissionsModal.tsx

import { useState, useEffect, useMemo } from "react";
import { Modal, Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import type { DBUser } from "@shared/database/types";
import { permissionMappingService } from "../../services/PermissionMappingService";
import type { DBPermissionMapping } from "@shared/database/types";

interface UserPermissionsModalProps {
  user: DBUser;
  onClose: () => void;
  onSave: (permissions: string[]) => void;
}

export function UserPermissionsModal({
  user,
  onClose,
  onSave,
}: UserPermissionsModalProps) {
  const { isDark } = useTheme();

  // 🔧 FIX: State برای mappings از Supabase
  const [allMappings, setAllMappings] = useState<DBPermissionMapping[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    user.customPermissions || [],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEntity, setFilterEntity] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // 🔧 FIX: Load mappings از Supabase
  useEffect(() => {
    const loadMappings = async () => {
      try {
        setLoading(true);
        const mappings = await permissionMappingService.getAll();
        setAllMappings(mappings);
        console.log(
          "[UserPermissionsModal] ✅ Loaded mappings:",
          mappings.length,
        );
      } catch (error) {
        console.error("[UserPermissionsModal] Failed to load mappings:", error);
      } finally {
        setLoading(false);
      }
    };
    loadMappings();
  }, []);

  // استخراج entity های یکتا
  const entities = useMemo(() => {
    const entitySet = new Set<string>();
    allMappings.forEach((m) => {
      const entity = m.permission.split(":")[0];
      entitySet.add(entity);
    });
    return Array.from(entitySet).sort();
  }, [allMappings]);

  // فیلتر کردن permissions
  const filteredMappings = useMemo(() => {
    return allMappings.filter((m) => {
      if (filterEntity && !m.permission.startsWith(`${filterEntity}:`))
        return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return m.permission.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allMappings, filterEntity, searchQuery]);

  const handleTogglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission],
    );
  };

  const handleSave = () => {
    onSave(selectedPermissions);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`🔐 Permissions for ${user.fullName}`}
      size="xl"
    >
      <div className="space-y-4">
        {/* Header Info */}
        <div
          className={`p-4 rounded-lg border ${
            isDark
              ? "border-indigo-700 bg-indigo-900/20"
              : "border-indigo-200 bg-indigo-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div
                className={`text-sm font-bold ${isDark ? "text-indigo-200" : "text-indigo-800"}`}
              >
                {user.fullName}
              </div>
              <div
                className={`text-xs ${isDark ? "text-indigo-300" : "text-indigo-600"}`}
              >
                @{user.username} • Role: {user.role}
              </div>
            </div>
            <Badge tone="indigo" className="text-xs">
              {selectedPermissions.length} selected
            </Badge>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="🔍 Search permissions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
              isDark
                ? "border-slate-700 bg-slate-800 text-slate-200 placeholder-slate-500"
                : "border-slate-300 bg-white text-slate-900 placeholder-slate-400"
            }`}
          />
          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className={`px-3 py-2 rounded-lg border text-sm ${
              isDark
                ? "border-slate-700 bg-slate-800 text-slate-200"
                : "border-slate-300 bg-white text-slate-900"
            }`}
          >
            <option value="">All Entities</option>
            {entities.map((entity) => (
              <option key={entity} value={entity}>
                {entity}
              </option>
            ))}
          </select>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2 animate-pulse">⏳</div>
            <p className={isDark ? "text-slate-400" : "text-slate-600"}>
              Loading permissions from Supabase...
            </p>
          </div>
        ) : allMappings.length === 0 ? (
          <div
            className={`p-8 rounded-lg border text-center ${
              isDark
                ? "border-amber-700 bg-amber-900/20"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <div className="text-4xl mb-2">⚠️</div>
            <h4
              className={`text-sm font-bold mb-1 ${isDark ? "text-amber-200" : "text-amber-800"}`}
            >
              No Permissions Defined
            </h4>
            <p
              className={`text-xs ${isDark ? "text-amber-300" : "text-amber-700"}`}
            >
              Please create permissions in the "Permissions" tab first.
            </p>
          </div>
        ) : (
          <>
            {/* Permissions List */}
            <div
              className={`rounded-lg border max-h-96 overflow-y-auto ${
                isDark
                  ? "border-slate-700 bg-slate-800/30"
                  : "border-slate-200 bg-slate-50/50"
              }`}
            >
              <div
                className={`px-4 py-2 border-b text-xs font-semibold ${
                  isDark
                    ? "border-slate-700 bg-slate-800 text-slate-300"
                    : "border-slate-200 bg-slate-100 text-slate-700"
                }`}
              >
                Available Permissions ({filteredMappings.length})
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredMappings.map((mapping) => {
                  const isSelected = selectedPermissions.includes(
                    mapping.permission,
                  );
                  const entity = mapping.permission.split(":")[0];
                  const action = mapping.permission.split(":")[1];

                  return (
                    <div
                      key={mapping.permission}
                      onClick={() => handleTogglePermission(mapping.permission)}
                      className={`px-4 py-3 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? isDark
                            ? "bg-emerald-900/20 hover:bg-emerald-900/30"
                            : "bg-emerald-50 hover:bg-emerald-100"
                          : isDark
                            ? "hover:bg-slate-800/50"
                            : "hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "bg-emerald-600 border-emerald-600"
                                : isDark
                                  ? "border-slate-600"
                                  : "border-slate-300"
                            }`}
                          >
                            {isSelected && (
                              <span className="text-white text-[10px]">✓</span>
                            )}
                          </div>
                          <code
                            className={`text-sm font-mono font-bold ${
                              isDark ? "text-indigo-300" : "text-indigo-700"
                            }`}
                          >
                            {mapping.permission}
                          </code>
                        </div>
                        <div className="flex items-center gap-2 ml-6">
                          <Badge tone="slate" className="text-[9px]">
                            {entity}
                          </Badge>
                          <Badge
                            tone={isSelected ? "emerald" : "indigo"}
                            className="text-[9px]"
                          >
                            {action}
                          </Badge>
                          <span
                            className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
                          >
                            • {mapping.allowedElements.length} elements
                          </span>
                        </div>
                      </div>

                      <Badge
                        tone={isSelected ? "emerald" : "slate"}
                        className="text-[10px] shrink-0"
                      >
                        {isSelected ? "✓ Assigned" : "Not assigned"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Permissions Summary */}
            {selectedPermissions.length > 0 && (
              <div
                className={`p-3 rounded-lg border ${
                  isDark
                    ? "border-emerald-700 bg-emerald-900/20"
                    : "border-emerald-200 bg-emerald-50"
                }`}
              >
                <div
                  className={`text-xs font-semibold mb-2 ${
                    isDark ? "text-emerald-300" : "text-emerald-700"
                  }`}
                >
                  ✅ Selected Permissions ({selectedPermissions.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPermissions.map((perm) => (
                    <div
                      key={perm}
                      className={`group flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono ${
                        isDark
                          ? "bg-emerald-900/40 text-emerald-200 border border-emerald-700/50"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      <span>{perm}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePermission(perm);
                        }}
                        className={`ml-1 ${isDark ? "text-emerald-400 hover:text-rose-400" : "text-emerald-600 hover:text-rose-600"}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end pt-2 border-t border-slate-200 dark:border-slate-700">
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            disabled={loading}
          >
            💾 Save Permissions
          </Button>
        </div>
      </div>
    </Modal>
  );
}
