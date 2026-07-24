// src/shared/authorization/ui/permission-manager/components/DeleteErrorModal.tsx

import { Modal, Button } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import type { DeleteErrorInfo } from "../types";

interface DeleteErrorModalProps {
  info: DeleteErrorInfo | null;
  onClose: () => void;
}

export function DeleteErrorModal({ info, onClose }: DeleteErrorModalProps) {
  const { isDark } = useTheme();

  return (
    <Modal
      isOpen={info !== null}
      onClose={onClose}
      title="⚠️ Cannot Delete Permission"
      size="lg"
    >
      {info && (
        <div className="space-y-4">
          <div
            className={`p-4 rounded-lg border ${
              isDark
                ? "border-rose-700 bg-rose-900/20"
                : "border-rose-200 bg-rose-50"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">🚫</span>
              <div className="flex-1">
                <h4
                  className={`text-sm font-bold mb-1 ${
                    isDark ? "text-rose-200" : "text-rose-800"
                  }`}
                >
                  Permission is currently in use
                </h4>
                <p
                  className={`text-xs ${
                    isDark ? "text-rose-300" : "text-rose-700"
                  }`}
                >
                  You cannot delete "<strong>{info.permission}</strong>" because
                  it's assigned to users. Please remove it from all assignments
                  first.
                </p>
              </div>
            </div>
          </div>

          {info.assignedToUsers.length > 0 && (
            <div
              className={`rounded-lg border ${
                isDark
                  ? "border-slate-700 bg-slate-800/30"
                  : "border-slate-200 bg-slate-50/50"
              }`}
            >
              <div
                className={`px-3 py-2 border-b ${
                  isDark
                    ? "border-slate-700 bg-slate-800/50"
                    : "border-slate-200 bg-slate-100"
                }`}
              >
                <h5
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isDark ? "text-slate-200" : "text-slate-700"
                  }`}
                >
                  👤 Assigned to Users ({info.assignedToUsers.length})
                </h5>
              </div>
              <div className="p-3 space-y-2">
                {info.assignedToUsers.map((userName, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      isDark ? "bg-slate-800/50" : "bg-white"
                    }`}
                  >
                    <span className="text-lg">👤</span>
                    <span
                      className={`text-sm font-medium ${
                        isDark ? "text-slate-200" : "text-slate-700"
                      }`}
                    >
                      {userName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            className={`p-3 rounded-lg border ${
              isDark
                ? "border-indigo-700 bg-indigo-900/20"
                : "border-indigo-200 bg-indigo-50"
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="text-lg">💡</span>
              <div className="flex-1">
                <h5
                  className={`text-xs font-bold mb-1 ${
                    isDark ? "text-indigo-200" : "text-indigo-800"
                  }`}
                >
                  How to delete this permission:
                </h5>
                <ol
                  className={`text-xs space-y-1 list-decimal list-inside ${
                    isDark ? "text-indigo-300" : "text-indigo-700"
                  }`}
                >
                  <li>
                    Go to <strong>Users</strong> tab and remove this permission
                    from all users
                  </li>
                  <li>Come back here and try deleting again</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-700">
            <Button variant="secondary" size="md" onClick={onClose}>
              Got it
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}