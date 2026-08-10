export * from "@shared/ui";
export { CardHeader } from "./components/CardHeader";

// Re-export a lightweight compatibility hook from the design-system so
// consumers that haven't migrated away from the old ThemeProvider can
// still access CSS-driven theme values without pulling in the application
// provider. The real single source of truth remains the application-level
// ThemeProvider (src/app/providers/ThemeProvider.tsx) which drives CSS
// variables via the canonical theme engine.
export { useThemeCssVars } from "./theme/ThemeProvider";

// re-export theme engine helpers for design-system consumers
export * from "./theme/engine";
