// src/widgets/layout/Header.tsx

import React, { useState, useRef, useEffect, lazy, Suspense } from "react";
import { useTheme } from "@app/providers/ThemeProvider";
import { useAuth } from "@features/auth/hooks/useAuth";
import { Settings, LogOut, ChevronDown } from "lucide-react";
import { NotificationBell } from "@shared/ui/NotificationBell";
// lazy load ThemeSettingsModal to avoid loading heavy UI in header
const ThemeSettingsModal = lazy(() =>
  import("@features/theme/ui/ThemeSettingsModal").then((m) => ({
    default: m.ThemeSettingsModal,
  })),
);

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
  const {
    isDark,
    toggleTheme,
    saveToProfile,
    savingRemote,
    savePreferenceToProfile,
  } = useTheme();
  const { user } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
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
    <>
      <Suspense fallback={null}>
        <ThemeSettingsModal
          isOpen={showThemeModal}
          onClose={() => setShowThemeModal(false)}
        />
      </Suspense>
      <header
        className="fixed top-0 left-0 right-0 z-40 h-16 transition-all duration-200"
        style={{
          backgroundColor: `color-mix(in srgb, var(--color-surface) 88%, transparent)`,
          backdropFilter: "blur(var(--effect-glass-blur, 12px))",
          WebkitBackdropFilter: "blur(var(--effect-glass-blur, 12px))",
          borderBottom:
            "1px solid color-mix(in srgb, var(--color-border) 40%, transparent)",
        }}
      >
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          {/* Left: Sidebar Toggle + Title */}
          <div className="flex items-center gap-3">
            {/* Sidebar Toggle */}
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg transition-all duration-200"
              style={{
                borderRadius: "var(--radius-button, 8px)",
                color: "var(--color-text-secondary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `color-mix(in srgb, var(--color-text-primary) 6%, transparent)`;
                e.currentTarget.style.color = "var(--color-text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--color-text-secondary)";
              }}
              title={isSidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
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
              className="h-6 w-px"
              style={{
                backgroundColor: `color-mix(in srgb, var(--color-border) 50%, transparent)`,
              }}
            />

            {/* Title - Minimal */}
            <div className="flex items-center gap-2.5">
              <span className="text-lg select-none">{viewInfo.icon}</span>
              <div>
                <h1
                  className="text-sm font-semibold leading-tight"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {viewInfo.title}
                </h1>
                <p
                  className="text-[11px] leading-tight"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {viewInfo.subtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Actions + User Profile - Crystal Minimal */}
          <div className="flex items-center gap-1">
            {/* Notifications */}
            <NotificationBell />

            {/* Settings */}
            {onNavigateSettings && (
              <button
                onClick={onNavigateSettings}
                title="Settings"
                className="p-2 rounded-lg transition-all duration-200"
                style={{
                  borderRadius: "var(--radius-button, 8px)",
                  color: "var(--color-text-secondary)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `color-mix(in srgb, var(--color-text-primary) 6%, transparent)`;
                  e.currentTarget.style.color = "var(--color-text-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "var(--color-text-secondary)";
                }}
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            {/* Theme settings quick access */}
            <button
              onClick={() => setShowThemeModal(true)}
              title="Theme settings"
              className="p-2 rounded-lg transition-all duration-200"
              style={{
                borderRadius: "var(--radius-button, 8px)",
                color: "var(--color-text-secondary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `color-mix(in srgb, var(--color-text-primary) 6%, transparent)`;
                e.currentTarget.style.color = "var(--color-text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--color-text-secondary)";
              }}
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  d="M12 3v3M12 18v3M4.2 5.6l2.1 2.1M17.7 16.4l2.1 2.1M3 12h3M18 12h3M4.2 18.4l2.1-2.1M17.7 7.6l2.1-2.1"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="12" r="3" strokeWidth="1.5" />
              </svg>
            </button>

            {/* Divider */}
            <div
              className="h-6 w-px mx-1"
              style={{
                backgroundColor: `color-mix(in srgb, var(--color-border) 40%, transparent)`,
              }}
            />

            {/* User Profile Dropdown */}
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-lg transition-all duration-200"
                style={{
                  borderRadius: "var(--radius-button, 8px)",
                  backgroundColor: showUserMenu
                    ? `color-mix(in srgb, var(--color-accent-from) 10%, transparent)`
                    : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (!showUserMenu) {
                    e.currentTarget.style.backgroundColor = `color-mix(in srgb, var(--color-text-primary) 6%, transparent)`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showUserMenu) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                {/* Avatar */}
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold text-white"
                  style={{
                    background: `linear-gradient(135deg, var(--color-accent-from), var(--color-accent-to))`,
                  }}
                >
                  {user?.fullName ? getInitials(user.fullName) : "AD"}
                </div>

                {/* User Info */}
                <div className="text-left hidden sm:block">
                  <div
                    className="text-xs font-semibold leading-tight"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {user?.fullName || "Admin User"}
                  </div>
                  <div
                    className="text-[10px] capitalize leading-tight"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {user?.role || "admin"}
                  </div>
                </div>

                <ChevronDown
                  className="w-3.5 h-3.5 transition-transform"
                  style={{
                    transform: showUserMenu ? "rotate(180deg)" : "rotate(0deg)",
                    color: "var(--color-text-muted)",
                  }}
                />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div
                  className="absolute right-0 top-full mt-2 w-64 rounded-xl overflow-hidden z-50"
                  style={{
                    backgroundColor: `color-mix(in srgb, var(--color-surface) 95%, transparent)`,
                    backdropFilter: "blur(var(--effect-glass-blur, 12px))",
                    WebkitBackdropFilter:
                      "blur(var(--effect-glass-blur, 12px))",
                    border:
                      "1px solid color-mix(in srgb, var(--color-border) 50%, transparent)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                  }}
                >
                  {/* Accent line */}
                  <div
                    className="h-[2px]"
                    style={{
                      background: `linear-gradient(90deg, var(--color-accent-from), var(--color-accent-to))`,
                    }}
                  />

                  {/* User Info Card */}
                  <div
                    className="p-4"
                    style={{
                      borderBottom:
                        "1px solid color-mix(in srgb, var(--color-border) 40%, transparent)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                        style={{
                          background: `linear-gradient(135deg, var(--color-accent-from), var(--color-accent-to))`,
                        }}
                      >
                        {user?.fullName ? getInitials(user.fullName) : "AD"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm font-bold truncate"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {user?.fullName || "Admin User"}
                        </div>
                        <div
                          className="text-xs truncate"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {user?.email || "admin@ics.com"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-1.5">
                    {onNavigateSettings && (
                      <button
                        onClick={() => {
                          onNavigateSettings();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200"
                        style={{ color: "var(--color-text-secondary)" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = `color-mix(in srgb, var(--color-text-primary) 6%, transparent)`;
                          e.currentTarget.style.color =
                            "var(--color-text-primary)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color =
                            "var(--color-text-secondary)";
                        }}
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
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200"
                        style={{ color: "#f43f5e" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "rgba(244, 63, 94, 0.08)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">Logout</span>
                      </button>
                    )}
                  </div>

                  {/* Footer */}
                  <div
                    className="px-4 py-2 text-[10px]"
                    style={{
                      borderTop:
                        "1px solid color-mix(in srgb, var(--color-border) 30%, transparent)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    ICS Inspection Platform v1.0
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
