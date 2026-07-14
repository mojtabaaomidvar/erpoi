// src/shared/authorization/ui/permission-manager/components/PermissionToolbar.tsx

import { Button } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";

interface PermissionToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateClick: () => void;
  onSaveClick: () => void;
  hasChanges: boolean;
  pendingCount: number;
}

export function PermissionToolbar({
  searchQuery,
  onSearchChange,
  onCreateClick,
  onSaveClick,
  hasChanges,
  pendingCount,
}: PermissionToolbarProps) {
  const { isDark } = useTheme();

  return (
    <div
      className={`rounded-xl border p-4 mb-6 ${
        isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="🔍 Search..."
            className={`px-3 py-2 rounded-lg border text-sm ${
              isDark
                ? "border-slate-700 bg-slate-800 text-slate-200 placeholder-slate-500"
                : "border-slate-300 bg-white text-slate-900 placeholder-slate-400"
            }`}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="primary" size="md" onClick={onCreateClick}>
            ➕ New Permission
          </Button>
          {hasChanges && (
            <Button variant="primary" size="md" onClick={onSaveClick}>
              💾 Save Changes ({pendingCount})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}