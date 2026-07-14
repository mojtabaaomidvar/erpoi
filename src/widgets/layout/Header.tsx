// src/widgets/layout/Header.tsx

import { useState, useRef, useEffect } from "react";
import { useTheme } from "@app/providers/ThemeProvider";
import { useAuth } from "@features/auth/hooks/useAuth";
import { Settings, LogOut, Moon, Sun, ChevronDown } from "lucide-react";
import { NotificationBell } from "@shared/ui/NotificationBell";

interface HeaderProps {
  activeView: string;
  onToggleSidebar: () => void;
  isSidebarExpanded: boolean;
  onNavigateSettings?: () => void;
  onLogout?: () => void | Promise<void>;
}

const viewTitles: Record<
  string,
  { title: string; icon: string; subtitle: string }
> = {
  dashboard: {
    title: "Dashboard",
    icon: "📊",
    subtitle: "Overview & Analytics",
  },
  clients: { title: "Clients", icon: "👥", subtitle: "Client Management" },
  contracts: {
    title: "Agreements",
    icon: "📄",
    subtitle: "Contracts & Work Orders",
  },
  inspectors: {
    title: "Inspectors",
    icon: "👷",
    subtitle: "Inspector Management",
  },
  inspections: {
    title: "Workflow",
    icon: "🔍",
    subtitle: "Inspection Workflow",
  },
  billing: { title: "Billing", icon: "💰", subtitle: "Invoices & Payments" },
  reports: { title: "Reports", icon: "📈", subtitle: "Analytics & Reports" },
  audit: { title: "Audit Log", icon: "🛡️", subtitle: "System Audit Trail" },
  "user-management": {
    title: "User Management",
    icon: "🛡️",
    subtitle: "Users, Roles & Permissions",
  },
  settings: { title: "Settings", icon: "⚙️", subtitle: "Application Settings" },
};

export function Header({
  activeView,
  onToggleSidebar,
  isSidebarExpanded,
  onNavigateSettings,
  onLogout,
}: HeaderProps) {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const viewInfo = viewTitles[activeView] || {
    title: "Dashboard",
    icon: "📊",
    subtitle: "Overview",
  };

  // Click outside to close user menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initials from user name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 h-16 border-b backdrop-blur-xl transition-all ${
        isDark
          ? "bg-slate-900/95 border-slate-800/50 shadow-lg shadow-black/20"
          : "bg-white/95 border-slate-200/70 shadow-lg shadow-slate-200/50"
      }`}
    >
      {/* Gradient Top Line */}
      <div
        className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${
          isDark
            ? "from-indigo-500 via-purple-500 to-pink-500"
            : "from-indigo-400 via-purple-400 to-pink-400"
        }`}
      />

      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left: Sidebar Toggle + Title */}
        <div className="flex items-center gap-4">
          {/* Sidebar Toggle */}
          <button
            onClick={onToggleSidebar}
            className={`p-2 rounded-xl transition-all ${
              isDark
                ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title={isSidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  isSidebarExpanded
                    ? "M11 19l-7-7 7-7m8 14l-7-7 7-7"
                    : "M13 5l7 7-7 7M5 5l7 7-7 7"
                }
              />
            </svg>
          </button>

          {/* Divider */}
          <div
            className={`h-8 w-px ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
          />

          {/* Title */}
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                isDark
                  ? "bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/30"
                  : "bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/20"
              }`}
            >
              {viewInfo.icon}
            </div>
            <div>
              <h1
                className={`text-base font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                {viewInfo.title}
              </h1>
              <p
                className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                {viewInfo.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Actions + User Profile */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl transition-all ${
              isDark
                ? "text-slate-400 hover:bg-slate-800 hover:text-amber-400"
                : "text-slate-600 hover:bg-slate-100 hover:text-indigo-600"
            }`}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Notifications */}
          <NotificationBell />

          {/* Settings */}
          {onNavigateSettings && (
            <button
              onClick={onNavigateSettings}
              className={`p-2 rounded-xl transition-all ${
                isDark
                  ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}

          {/* Divider */}
          <div
            className={`h-8 w-px mx-1 ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
          />

          {/* User Profile Dropdown */}
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`flex items-center gap-2.5 p-1.5 pr-3 rounded-xl transition-all ${
                showUserMenu
                  ? isDark
                    ? "bg-slate-800 ring-2 ring-indigo-500/30"
                    : "bg-slate-100 ring-2 ring-indigo-300/50"
                  : isDark
                    ? "hover:bg-slate-800"
                    : "hover:bg-slate-100"
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  isDark
                    ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30"
                    : "bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/20"
                }`}
              >
                {user?.fullName ? getInitials(user.fullName) : "AD"}
              </div>

              {/* User Info */}
              <div className="text-left hidden sm:block">
                <div
                  className={`text-xs font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}
                >
                  {user?.fullName || "Admin User"}
                </div>
                <div
                  className={`text-[10px] capitalize ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  {user?.role || "admin"}
                </div>
              </div>

              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  showUserMenu ? "rotate-180" : ""
                } ${isDark ? "text-slate-400" : "text-slate-500"}`}
              />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div
                className={`absolute right-0 top-full mt-2 w-64 rounded-2xl shadow-2xl border overflow-hidden z-50 ${
                  isDark
                    ? "bg-slate-900/98 border-slate-700/70 shadow-black/70"
                    : "bg-white/98 border-slate-200/80 shadow-slate-400/40"
                } backdrop-blur-xl`}
              >
                {/* Gradient Top */}
                <div
                  className={`h-1 bg-gradient-to-r ${
                    isDark
                      ? "from-indigo-500 via-purple-500 to-pink-500"
                      : "from-indigo-400 via-purple-400 to-pink-400"
                  }`}
                />

                {/* User Info Card */}
                <div
                  className={`p-4 border-b ${isDark ? "border-slate-700/50" : "border-slate-200/70"}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold ${
                        isDark
                          ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white"
                          : "bg-gradient-to-br from-indigo-500 to-violet-500 text-white"
                      }`}
                    >
                      {user?.fullName ? getInitials(user.fullName) : "AD"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm font-bold truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}
                      >
                        {user?.fullName || "Admin User"}
                      </div>
                      <div
                        className={`text-xs truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        {user?.email || "admin@ics.com"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  {onNavigateSettings && (
                    <button
                      onClick={() => {
                        onNavigateSettings();
                        setShowUserMenu(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                        isDark
                          ? "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <Settings className="w-4 h-4" />
                      <span className="text-sm font-medium">Settings</span>
                    </button>
                  )}

                  {onLogout && (
                    <button
                      onClick={() => {
                        onLogout();
                        setShowUserMenu(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                        isDark
                          ? "text-rose-400 hover:bg-rose-900/30 hover:text-rose-300"
                          : "text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      }`}
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  )}
                </div>

                {/* Footer */}
                <div
                  className={`px-4 py-2 border-t text-[10px] ${
                    isDark
                      ? "border-slate-700/50 bg-slate-800/30 text-slate-500"
                      : "border-slate-200/70 bg-slate-50/50 text-slate-400"
                  }`}
                >
                  ICS Inspection Platform v1.0
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
