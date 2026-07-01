// src/widgets/layout/UserDropdown.tsx

import { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, Shield, ChevronDown } from 'lucide-react';
import { useRole } from '@shared/authorization';

interface Props {
  userName?: string;
  userEmail?: string;
  onNavigateSettings: () => void;
  onLogout?: () => void | Promise<void>;
  isExpanded?: boolean;
}

export function UserDropdown({ 
  userName = 'Admin User', 
  userEmail = 'admin@ics.com',
  onNavigateSettings,
  onLogout,
  isExpanded = true
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { role, roleName } = useRole();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfile = () => {
    setIsOpen(false);
  };

  const handleSettings = () => {
    setIsOpen(false);
    onNavigateSettings();
  };

  const handleLogout = async () => {
    setIsOpen(false);
    if (onLogout) {
      await onLogout();
    }
  };

	const roleColors: Record<string, string> = {
	  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
	  manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
	  inspector: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
	  accountant: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
	  viewer: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
	};
	
	const roleColor = roleColors[role] || roleColors.viewer;
	
  if (isExpanded) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold shrink-0 shadow-md">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {userName}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {userEmail}
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
            <div className="px-4 py-3 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700">
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {userName}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {userEmail}
              </div>
              <div className="mt-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${roleColor}`}>
                  <Shield className="w-3 h-3" />
                  {roleName}
                </span>
              </div>
            </div>

            <div className="py-1">
              <button onClick={handleProfile} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <User className="w-4 h-4" />
                <span>Profile</span>
              </button>

              <button onClick={handleSettings} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>

              <div className="my-1 border-t border-slate-200 dark:border-slate-700" />

              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex justify-center" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold hover:scale-105 active:scale-95 transition-all shadow-md"
        title={userName}
      >
        {userName.charAt(0).toUpperCase()}
      </button>

      {isOpen && (
        <div className="fixed left-20 bottom-4 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-[100]">
          <div className="px-4 py-3 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700">
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {userName}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {userEmail}
            </div>
            <div className="mt-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${roleColors[role] || roleColors.viewer}`}>
                <Shield className="w-3 h-3" />
                {roleName}
              </span>
            </div>
          </div>

          <div className="py-1">
            <button onClick={handleProfile} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <User className="w-4 h-4" />
              <span>Profile</span>
            </button>

            <button onClick={handleSettings} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>

            <div className="my-1 border-t border-slate-200 dark:border-slate-700" />

            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}