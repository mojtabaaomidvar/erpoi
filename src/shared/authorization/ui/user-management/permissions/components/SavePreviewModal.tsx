// src/shared/authorization/ui/permission-manager/components/SavePreviewModal.tsx

import { Modal, Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import type { SavePreviewItem } from "../types";

interface SavePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  items: SavePreviewItem[];
  saving: boolean;
}

export function SavePreviewModal({
  isOpen,
  onClose,
  onSave,
  items,
  saving,
}: SavePreviewModalProps) {
  const { isDark } = useTheme();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="💾 Save Changes Preview"
      size="lg"
    >
      <div className="space-y-4">
        <div
          className={`p-3 rounded-lg border ${
            isDark
              ? "border-indigo-700 bg-indigo-900/20"
              : "border-indigo-200 bg-indigo-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">📋</span>
            <div>
              <h4
                className={`text-sm font-bold ${
                  isDark ? "text-indigo-200" : "text-indigo-800"
                }`}
              >
                Review your changes before saving
              </h4>
              <p
                className={`text-xs ${
                  isDark ? "text-indigo-300" : "text-indigo-700"
                }`}
              >
                {items.length} permission{items.length > 1 ? "s" : ""} will be
                saved to Supabase
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.permission}
              className={`rounded-lg border p-3 ${
                isDark
                  ? "border-slate-700 bg-slate-800/50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <code
                  className={`text-xs font-mono ${
                    isDark ? "text-indigo-300" : "text-indigo-700"
                  }`}
                >
                  {item.permission}
                </code>
                <Badge
                  tone={item.isNew ? "emerald" : "amber"}
                  className="text-[9px]"
                >
                  {item.isNew ? "✨ New" : "✏️ Modified"}
                </Badge>
              </div>

              {item.added.length > 0 && (
                <div className="mb-2">
                  <div
                    className={`text-[10px] font-medium mb-1 ${
                      isDark ? "text-emerald-400" : "text-emerald-700"
                    }`}
                  >
                    Added ({item.added.length}):
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {item.added.map((id) => (
                      <span
                        key={id}
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          isDark
                            ? "bg-emerald-900/30 text-emerald-300"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {id.replace(/^(client|contract)_/, "")}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {item.removed.length > 0 && (
                <div>
                  <div
                    className={`text-[10px] font-medium mb-1 ${
                      isDark ? "text-rose-400" : "text-rose-700"
                    }`}
                  >
                    ➖ Removed ({item.removed.length}):
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {item.removed.map((id) => (
                      <span
                        key={id}
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          isDark
                            ? "bg-rose-900/30 text-rose-300"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {id.replace(/^(client|contract)_/, "")}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {item.added.length === 0 && item.removed.length === 0 && (
                <div
                  className={`text-[10px] ${
                    isDark ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  No changes to elements
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onSave}
            disabled={saving}
            className={saving ? "opacity-70 cursor-wait" : ""}
          >
            {saving ? "⏳ Saving..." : "✓ Confirm & Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}