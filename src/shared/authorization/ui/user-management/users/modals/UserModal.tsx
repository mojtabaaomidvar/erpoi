// src/shared/authorization/ui/modals/UserModal.tsx

import { useState, useEffect } from "react";
import { useTheme } from "@app/providers/ThemeProvider";
import { Modal } from "@design-system"; // 🔧 NEW: استفاده از Modal با footer prop
import { DepartmentSelect } from "@shared/authorization/ui/user-management/departments/components/DepartmentSelect";
import { userService } from "@shared/authorization/services/UserService";
import {
  ROLE_CONFIGS,
  ROLES,
  getRoleConfig,
  isManagerRole,
  type UserRole,
} from "@shared/authorization/config/RoleConfig";
import type { DBUser, DBDepartment } from "@shared/database/types";

interface UserModalProps {
  user: DBUser | null;
  departments: DBDepartment[]; // 🔧 NEW: برای پیدا کردن نام دپارتمان
  onClose: () => void;
  onSave: (formData: any) => void;
}

export function UserModal({
  user,
  departments = [],
  onClose,
  onSave,
}: UserModalProps) {
  const { isDark } = useTheme();

  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    fullName: user?.fullName || "",
    password: "",
    role: user?.role || "expert",
    department: user?.department || "",
    status: user?.status || "active",
  });

  const [managerWarning, setManagerWarning] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // 🔧 NEW: آپدیت خودکار ایمیل وقتی یوزرنیم تغییر می‌کند (فقط برای کاربران جدید)
  useEffect(() => {
    if (!user && formData.username) {
      // ساخت ایمیل پیش‌فرض: username@ics.org.ir
      const defaultEmail = `${formData.username}@ics.org.ir`;

      // اگر ایمیل خالی است یا دقیقاً همان ایمیل پیش‌فقد قبلی است، آن را آپدیت کن
      // این کار اجازه می‌دهد اگر کاربر دستی ایمیل را تغییر داد، دیگر اوررایت نشود
      const previousUsername =
        formData.username.length > 1 ? formData.username.slice(0, -1) : "";
      const previousDefault = previousUsername
        ? `${previousUsername}@ics.org.ir`
        : "";

      if (!formData.email || formData.email === previousDefault) {
        setFormData((prev) => ({ ...prev, email: defaultEmail }));
      }
    }
  }, [formData.username, user]);

  // 🔧 NEW: بررسی constraint مدیر وقتی نقش یا دپارتمان تغییر می‌کند
  useEffect(() => {
    const checkManagerConstraint = async () => {
      // 🔧 FIX: اگر Admin است، هیچ چکی لازم نیست
      if (formData.role === "admin") {
        setManagerWarning(null);
        return;
      }

      if (!formData.department || !isManagerRole(formData.role)) {
        setManagerWarning(null);
        return;
      }

      setIsChecking(true);
      try {
        // پیدا کردن نام دپارتمان برای پیام خطای بهتر
        const selectedDept = departments.find(
          (d) => d.id === formData.department,
        );
        const deptName = selectedDept?.name;

        const validation = await userService.validateManagerConstraint(
          formData.department,
          user?.id || "",
          formData.role,
          deptName,
        );

        if (!validation.valid) {
          setManagerWarning(validation.error || null);
        } else {
          setManagerWarning(null);
        }
      } catch (error) {
        console.error("[UserModal] Failed to check manager constraint:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkManagerConstraint();
  }, [formData.department, formData.role, user?.id, departments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (managerWarning) {
      alert("Cannot save: " + managerWarning);
      return;
    }

    onSave(formData);
  };

  const selectedRoleConfig = getRoleConfig(formData.role);
  const isAdmin = formData.role === "admin";

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={user ? "✏️ Edit User" : "➕ Create User"}
      size="md"
      // 🔧 NEW: دکمه‌ها در footer prop - ثابت در پایین
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isDark
                ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!!managerWarning || isChecking}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-all ${
              managerWarning || isChecking
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {isChecking ? "⏳ Checking..." : user ? "Update" : "Create"}
          </button>
        </div>
      }
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
        {/* Full Name */}
        <div>
          <label
            className={`block text-xs font-semibold mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
          >
            Full Name *
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) =>
              setFormData({ ...formData, fullName: e.target.value })
            }
            required
            className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all ${
              isDark
                ? "border-slate-600 bg-slate-700 text-slate-100 focus:border-indigo-400 focus:ring-indigo-900"
                : "border-slate-300 bg-white focus:border-indigo-400 focus:ring-indigo-100"
            }`}
          />
        </div>

        {/* Username & Email */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              className={`block text-xs font-semibold mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              Username *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              required
              className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all ${
                isDark
                  ? "border-slate-600 bg-slate-700 text-slate-100 focus:border-indigo-400 focus:ring-indigo-900"
                  : "border-slate-300 bg-white focus:border-indigo-400 focus:ring-indigo-100"
              }`}
            />
          </div>
          <div>
            <label
              className={`block text-xs font-semibold mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all ${
                isDark
                  ? "border-slate-600 bg-slate-700 text-slate-100 focus:border-indigo-400 focus:ring-indigo-900"
                  : "border-slate-300 bg-white focus:border-indigo-400 focus:ring-indigo-100"
              }`}
            />
          </div>
        </div>

        {/* Password (فقط برای کاربر جدید) */}
        {!user && (
          <div>
            <label
              className={`block text-xs font-semibold mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              Password *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required={!user}
              className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all ${
                isDark
                  ? "border-slate-600 bg-slate-700 text-slate-100 focus:border-indigo-400 focus:ring-indigo-900"
                  : "border-slate-300 bg-white focus:border-indigo-400 focus:ring-indigo-100"
              }`}
            />
          </div>
        )}

        {/* Role Selector */}
        <div>
          <label
            className={`block text-xs font-semibold mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
          >
            📋 Role *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((roleKey) => {
              const roleConfig = ROLE_CONFIGS[roleKey];
              const isSelected = formData.role === roleKey;

              return (
                <button
                  key={roleKey}
                  type="button"
                  onClick={() => setFormData({ ...formData, role: roleKey })}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    isSelected
                      ? isDark
                        ? "border-indigo-500 bg-indigo-950/50"
                        : "border-indigo-500 bg-indigo-50"
                      : isDark
                        ? "border-slate-600 bg-slate-700 hover:border-slate-500"
                        : "border-slate-300 bg-white hover:border-slate-400"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{roleConfig.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-xs font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}
                      >
                        {roleConfig.label}
                      </div>
                      {roleConfig.isManager && (
                        <div
                          className={`text-[9px] ${isDark ? "text-amber-300" : "text-amber-700"}`}
                        >
                          👑 Manager Role
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* نمایش توضیحات نقش */}
          <div
            className={`mt-3 p-3 rounded-lg border ${isDark ? "border-slate-600 bg-slate-700/50" : "border-slate-200 bg-slate-50"}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{selectedRoleConfig.icon}</span>
              <div className="flex-1">
                <div
                  className={`text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}
                >
                  {selectedRoleConfig.label}
                </div>
                <div
                  className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  {selectedRoleConfig.description}
                </div>
                <div
                  className={`text-[10px] mt-2 ${isDark ? "text-cyan-300" : "text-cyan-700"}`}
                >
                  🔐 {selectedRoleConfig.defaultPermissions.length} default
                  permissions
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Department (فقط اگر Admin نباشد) */}
        {!isAdmin && (
          <div>
            <label
              className={`block text-xs font-semibold mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              Department
            </label>
            <DepartmentSelect
              value={formData.department}
              onChange={(value) =>
                setFormData({ ...formData, department: value })
              }
              className="text-sm py-2"
              placeholder="Select department..."
            />
          </div>
        )}

        {/* هشدار مدیر */}
        {managerWarning && (
          <div
            className={`p-3 rounded-lg border ${isDark ? "border-rose-700 bg-rose-950/30" : "border-rose-200 bg-rose-50"}`}
          >
            <div className="flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <div className="flex-1">
                <div
                  className={`text-xs font-semibold ${isDark ? "text-rose-200" : "text-rose-900"}`}
                >
                  Cannot Assign Manager Role
                </div>
                <div
                  className={`text-[10px] mt-1 ${isDark ? "text-rose-300" : "text-rose-800"}`}
                >
                  {managerWarning}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status */}
        <div>
          <label
            className={`block text-xs font-semibold mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
          >
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as "active" | "inactive" | "suspended",
              })
            }
            className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all ${
              isDark
                ? "border-slate-600 bg-slate-700 text-slate-100 focus:border-indigo-400 focus:ring-indigo-900"
                : "border-slate-300 bg-white focus:border-indigo-400 focus:ring-indigo-100"
            }`}
          >
            <option value="active">✅ Active</option>
            <option value="inactive">⏸️ Inactive</option>
            <option value="suspended">🚫 Suspended</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}
