import { createContext, useContext, useState, useEffect, ReactNode } from'react';

type ThemeMode ='light'|'dark'|'auto';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// تشخیص تم بر اساس ساعت سیستم (۶ صبح تا ۶ عصر = روشن)
const isNightTime = (): boolean => {
  const hour = new Date().getHours();
  return hour < 6 || hour >= 18;
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme-mode');
    return (saved as ThemeMode) ||'auto';
  });

  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  // آپدیت ساعت هر دقیقه (برای تغییر خودکار تم)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000); // هر ۱ دقیقه
    return () => clearInterval(interval);
  }, []);

  // تعیین حالت تاریک
  const isDark = themeMode ==='auto'? isNightTime() : themeMode ==='dark';

  // اعمال کلاس dark
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme-mode', themeMode);
  }, [isDark, themeMode]);

  const toggleTheme = () => {
    setThemeModeState(prev => {
      if (prev ==='auto') return isNightTime() ?'light':'dark';
      return prev ==='dark'?'light':'dark';
    });
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, themeMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}