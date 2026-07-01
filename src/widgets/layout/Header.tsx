// src/widgets/layout/Header.tsx
import { useState } from 'react';
import { Bell, Menu, PanelLeftClose, Sun, Moon } from 'lucide-react';
import { NotificationCenter } from '@features/notifications';
import { useNotifications } from '@features/notifications';

interface HeaderProps {
  title: string;
  subtitle: string;
  isSidebarExpanded: boolean;
  onToggleSidebar: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export function Header({
  title,
  subtitle,
  isSidebarExpanded,
  onToggleSidebar,
  isDark = false,
  onToggleTheme,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const { stats } = useNotifications();

  const buttonClass = `relative flex h-9 w-9 items-center justify-center rounded-lg border transition-all hover:scale-105 active:scale-95 ${
    isDark
      ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 shadow-md shadow-black/20"
      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-md shadow-slate-200/50"
  }`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Sidebar Toggle + Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
            >
              {isSidebarExpanded ? (
                <PanelLeftClose className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
            
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {title}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Right: Notification + Theme */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={buttonClass}
              >
                <Bell className="h-4 w-4" />
                {stats.unread > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 shadow-lg shadow-rose-500/50" />
                )}
              </button>

              {showNotifications && (
                <NotificationCenter onClose={() => setShowNotifications(false)} />
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className={buttonClass}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-yellow-400" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}