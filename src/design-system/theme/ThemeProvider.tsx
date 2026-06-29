// src/design-system/theme/ThemeProvider.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { themeColors } from "../tokens/colors";

type Theme = "light" | "dark";
type ThemeColors = (typeof themeColors)[keyof typeof themeColors];

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme");
    return (saved as Theme) || "light";
  });

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle(
      "dark",
      theme === "dark"
    );
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev =>
      prev === "light" ? "dark" : "light"
    );
  };

  const colors =
    theme === "light"
      ? themeColors.light
      : themeColors.dark;

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, colors }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used within ThemeProvider"
    );
  }

  return context;
}