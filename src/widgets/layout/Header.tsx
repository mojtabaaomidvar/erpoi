import { Bell, HelpCircle, Menu, PanelLeftClose, ShieldCheck, Sun, Moon, Zap } from"lucide-react";
import { useTheme } from"@app/providers/ThemeProvider";
import { useState, useEffect } from"react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  isSidebarExpanded: boolean;
  onToggleSidebar: () => void;
}

export function Header({ title, subtitle, action, isSidebarExpanded, onToggleSidebar }: HeaderProps) {
  const { isDark, toggleTheme, themeMode, setThemeMode } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  // بستن منو با کلیک بیرون
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.theme-menu-container')) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-between border-b px-4 lg:px-6 backdrop-blur-xl transition-all ${
      isDark 
        ?"bg-slate-900/80 border-slate-800 shadow-lg shadow-black/20":"bg-white/80 border-slate-200 shadow-lg shadow-slate-200/50"}`}>
      {/* سمت چپ: دکمه Toggle + لوگو + عنوان */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={onToggleSidebar}
          className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all hover:scale-105 active:scale-95 shrink-0 ${
            isDark
              ?"border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white shadow-md shadow-black/20":"border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-indigo-600 shadow-md shadow-slate-200/50"}`}
          title={isSidebarExpanded ?"Collapse sidebar":"Expand sidebar"}
        >
          {isSidebarExpanded ? <PanelLeftClose className="h-4 w-4"/> : <Menu className="h-4 w-4"/>}
        </button>

        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 shadow-lg shadow-indigo-500/50">
            <ShieldCheck className="h-4 w-4 text-white"/>
          </div>
          <div className="min-w-0 hidden sm:block">
            <h1 className={`text-sm font-bold truncate leading-tight ${isDark ?"text-white":"text-slate-900"}`}>
              Offshore & Energy Inspection Platform
            </h1>
            {subtitle && (
              <p className={`text-[10px] truncate leading-tight ${isDark ?"text-slate-400":"text-slate-500"}`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* سمت راست: تم، آیکون‌ها، action */}
      <div className="flex items-center gap-2 shrink-0">
        {/* دکمه تغییر تم با منوی ۳ حالته */}
        <div className="relative theme-menu-container">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all hover:scale-110 active:scale-95 ${
              isDark
                ?"border-slate-700 bg-slate-800 text-amber-400 hover:bg-slate-700 shadow-md shadow-black/20":"border-slate-200 bg-white text-slate-600 hover:bg-slate-100 shadow-md shadow-slate-200/50"}`}
            title={`Theme: ${themeMode}`}
          >
            {themeMode ==='auto'? <Zap className="h-4 w-4"/> : isDark ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}
          </button>

          {/* منوی انتخاب تم */}
          {showThemeMenu && (
            <div className={`absolute right-0 top-full mt-2 w-44 rounded-lg border shadow-lg z-50 py-1 ${
              isDark ?"bg-slate-800 border-slate-700":"bg-white border-slate-200"}`}>
              <button
                onClick={() => { setThemeMode('light'); setShowThemeMenu(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                  themeMode ==='light'? (isDark ?"bg-indigo-900/40 text-indigo-300":"bg-indigo-50 text-indigo-700")
                    : (isDark ?"text-slate-300 hover:bg-slate-700":"text-slate-700 hover:bg-slate-50")
                }`}
              >
                <Moon className="h-4 w-4"/>
                <span>Light</span>
              </button>
              <button
                onClick={() => { setThemeMode('dark'); setShowThemeMenu(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                  themeMode ==='dark'? (isDark ?"bg-indigo-900/40 text-indigo-300":"bg-indigo-50 text-indigo-700")
                    : (isDark ?"text-slate-300 hover:bg-slate-700":"text-slate-700 hover:bg-slate-50")
                }`}
              >
                <Sun className="h-4 w-4"/>
                <span>Dark</span>
              </button>
              <button
                onClick={() => { setThemeMode('auto'); setShowThemeMenu(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                  themeMode ==='auto'? (isDark ?"bg-indigo-900/40 text-indigo-300":"bg-indigo-50 text-indigo-700")
                    : (isDark ?"text-slate-300 hover:bg-slate-700":"text-slate-700 hover:bg-slate-50")
                }`}
              >
                <Zap className="h-4 w-4"/>
                <span>Auto (Time)</span>
              </button>
            </div>
          )}
        </div>

        <button className={`relative flex h-9 w-9 items-center justify-center rounded-lg border transition-all hover:scale-105 active:scale-95 ${
          isDark ?"border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 shadow-md shadow-black/20":"border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-md shadow-slate-200/50"}`}>
          <Bell className="h-4 w-4"/>
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 shadow-lg shadow-rose-500/50"/>
        </button>
        <button className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all hover:scale-105 active:scale-95 ${
          isDark ?"border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 shadow-md shadow-black/20":"border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-md shadow-slate-200/50"}`}>
          <HelpCircle className="h-4 w-4"/>
        </button>
        {action}
      </div>
    </header>
  );
}




