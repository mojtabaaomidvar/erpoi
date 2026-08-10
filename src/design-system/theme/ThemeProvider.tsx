// src/design-system/theme/ThemeProvider.tsx

// The design-system specific ThemeProvider is deprecated. The application-level
// ThemeProvider (src/app/providers/ThemeProvider.tsx) is the single source of
// truth for themes in the application. To avoid having two providers we export
// a thin compatibility hook that reads CSS variables directly. This keeps the
// design-system decoupled from app-level context and avoids circular deps.

export function useThemeCssVars() {
  const root =
    typeof document !== "undefined" ? document.documentElement : null;
  const get = (name: string) =>
    root ? getComputedStyle(root).getPropertyValue(name).trim() : "";
  return {
    accentFrom: get("--color-accent-from") || get("--accent-from"),
    accentTo: get("--color-accent-to") || get("--accent-to"),
    accentText: get("--color-accent-text") || get("--accent-text"),
    background: get("--color-background") || get("--bg-app"),
    surface: get("--color-surface") || get("--bg-surface"),
    textPrimary: get("--color-text-primary") || get("--text-primary"),
  };
}

export default undefined as unknown as void;
