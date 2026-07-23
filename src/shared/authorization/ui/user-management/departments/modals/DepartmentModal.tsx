// src/shared/authorization/ui/modals/DepartmentModal.tsx

import { useState, useEffect } from "react";
import { useTheme } from "@app/providers/ThemeProvider";
import type { DBUser } from "@shared/database/types";
import type { Department } from "@shared/authorization";

interface DepartmentModalProps {
  department: Department | null;
  users: DBUser[];
  onClose: () => void;
  onSave: (formData: any) => void;
}

export function DepartmentModal({
  department,
  users,
  onClose,
  onSave,
}: DepartmentModalProps) {
  const { isDark } = useTheme();

  const [formData, setFormData] = useState({
    name: department?.name || "",
    description: department?.description || "",
  });

  // 🔧 NEW: ID management
  const [suggestedId, setSuggestedId] = useState("");
  const [editedId, setEditedId] = useState("");

  // 🔧 NEW: تولید ID پیشنهادی بر اساس نام واحد
  const generateIdFromName = (name: string): string => {
    if (!name.trim()) return "";

    // تبدیل به lowercase و حذف کاراکترهای خاص
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "") // فقط حروف، اعداد، فاصله و خط تیره
      .replace(/\s+/g, "_") // فاصله‌ها را با _ جایگزین کن
      .replace(/_+/g, "_") // چند _ پشت سر هم را یکی کن
      .substring(0, 30); // حداکثر 30 کاراکتر

    const timestamp = Date.now().toString(36).slice(-4);
    return `dept_${slug}_${timestamp}`;
  };

  // 🔧 NEW: آپدیت ID وقتی نام تغییر می‌کند
  useEffect(() => {
    if (!department) {
      const newId = generateIdFromName(formData.name);
      setSuggestedId(newId);
      setEditedId(newId);
    } else {
      setSuggestedId(department.id);
      setEditedId(department.id);
    }
  }, [formData.name, department]);

  // 🔧 FIX: کاربران مرتبط با این department
  const relatedUsers = users.filter((u) => u.department === department?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: editedId.trim() || suggestedId,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div
        className={`rounded-xl shadow-2xl max-w-md w-full ${isDark ? "bg-slate-800" : "bg-white"}`}
      >
        <div
          className={`px-5 py-3 border-b ${isDark ? "border-slate-700" : "border-slate-200"}`}
        >
          <div className="flex items-center justify-between">
            <h2
              className={`text-base font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
            >
              {department ? "✏️ Edit Department" : "➕ Create Department"}
            </h2>
            <button
              onClick={onClose}
              className={`text-xl ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label
              className={`block text-xs font-semibold mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              Department Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              className={`w-full px-3 py-1.5 rounded border text-sm ${isDark ? "border-slate-600 bg-slate-700 text-slate-100" : "border-slate-300 bg-white"}`}
              placeholder="e.g., Oil & Gas Inspection"
            />
          </div>

          {/* 🔧 NEW: ID Preview with Edit */}
          {!department && (
            <div>
              <label
                className={`block text-xs font-semibold mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
              >
                Department ID (Auto-generated from name)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editedId}
                  onChange={(e) => setEditedId(e.target.value)}
                  className={`flex-1 px-3 py-1.5 rounded border text-sm font-mono ${
                    isDark
                      ? "border-slate-600 bg-slate-700 text-slate-100"
                      : "border-slate-300 bg-white"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    const newId = generateIdFromName(formData.name);
                    setSuggestedId(newId);
                    setEditedId(newId);
                  }}
                  className={`px-3 py-1.5 rounded text-xs ${
                    isDark
                      ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                  title="Regenerate ID from name"
                >
                  🔄
                </button>
              </div>
              <p
                className={`text-[10px] mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                💡 ID is generated from department name. You can edit it
                manually.
              </p>
            </div>
          )}

          {/* Description */}
          <div>
            <label
              className={`block text-xs font-semibold mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={2}
              className={`w-full px-3 py-1.5 rounded border text-sm ${isDark ? "border-slate-600 bg-slate-700 text-slate-100" : "border-slate-300 bg-white"}`}
              placeholder="Brief description of the department..."
            />
          </div>

          {/* Related Users (فقط در Edit) */}
          {department && (
            <div>
              <label
                className={`block text-xs font-semibold mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
              >
                Users in this Department ({relatedUsers.length})
              </label>
              <div
                className={`rounded border p-3 max-h-32 overflow-y-auto ${
                  isDark
                    ? "border-slate-700 bg-slate-900/30"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                {relatedUsers.length === 0 ? (
                  <p
                    className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    No users assigned to this department
                  </p>
                ) : (
                  <div className="space-y-2">
                    {/* Manager */}
                    {relatedUsers
                      .filter((u) => u.role === "manager")
                      .map((user) => (
                        <div
                          key={user.id}
                          className={`flex items-center gap-2 text-xs p-2 rounded ${
                            isDark ? "bg-blue-950/30" : "bg-blue-50"
                          }`}
                        >
                          <span className="text-sm">👑</span>
                          <div className="flex-1 min-w-0">
                            <div
                              className={`font-semibold truncate ${
                                isDark ? "text-blue-200" : "text-blue-900"
                              }`}
                            >
                              {user.fullName}
                            </div>
                            <div
                              className={`text-[10px] truncate ${
                                isDark ? "text-blue-300" : "text-blue-700"
                              }`}
                            >
                              @{user.username}
                            </div>
                          </div>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                              isDark
                                ? "bg-blue-900/50 text-blue-300"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            Manager
                          </span>
                        </div>
                      ))}

                    {/* Other Users */}
                    {relatedUsers
                      .filter((u) => u.role !== "manager")
                      .map((user) => (
                        <div
                          key={user.id}
                          className={`flex items-center gap-2 text-xs py-1 ${
                            isDark ? "text-slate-300" : "text-slate-700"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                              isDark
                                ? "bg-indigo-900/30 text-indigo-300"
                                : "bg-indigo-100 text-indigo-700"
                            }`}
                          >
                            {user.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </div>
                          <span className="flex-1 truncate">
                            {user.fullName}
                          </span>
                          <span
                            className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
                          >
                            @{user.username}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div
            className={`flex gap-2 pt-3 border-t ${isDark ? "border-slate-700" : "border-slate-200"}`}
          >
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-3 py-1.5 rounded border text-sm ${isDark ? "border-slate-600 text-slate-300 hover:bg-slate-700" : "border-slate-300 text-slate-700 hover:bg-slate-100"}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.name.trim()}
              className={`flex-1 px-3 py-1.5 rounded text-sm font-medium text-white ${
                !formData.name.trim()
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {department ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
