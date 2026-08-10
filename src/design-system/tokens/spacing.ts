// ============ SPACING TOKENS ============
// Base spacing scale (used by components and converted by density)
export const spacing = {
  xs: "0.25rem", // 4px
  sm: "0.5rem", // 8px
  md: "1rem", // 16px
  lg: "1.5rem", // 24px
  xl: "2rem", // 32px
  "2xl": "3rem", // 48px
  "3xl": "4rem", // 64px
} as const;

// Density-aware spacing presets. The Theme Engine will pick one of these
// based on user preference (compact / default / comfortable / super).
export const densitySpacing = {
  compact: {
    xs: "0.125rem",
    sm: "0.25rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem",
  },
  default: {
    xs: spacing.xs,
    sm: spacing.sm,
    md: spacing.md,
    lg: spacing.lg,
    xl: spacing.xl,
  },
  comfortable: {
    xs: "0.375rem",
    sm: "0.75rem",
    md: "1.25rem",
    lg: "2rem",
    xl: "2.5rem",
  },
  super: {
    xs: "0.5rem",
    sm: "1rem",
    md: "1.75rem",
    lg: "2.5rem",
    xl: "3rem",
  },
} as const;

// ============ BORDER RADIUS ============
export const borderRadius = {
  none: "0",
  sm: "0.25rem", // 4px
  md: "0.375rem", // 6px
  lg: "0.5rem", // 8px
  xl: "0.75rem", // 12px
  "2xl": "1rem", // 16px
  full: "9999px",
} as const;

// Component-specific radius tokens (so components can request a semantic
// radius rather than numeric values)
export const componentRadii = {
  button: borderRadius.md,
  input: borderRadius.sm,
  card: borderRadius.lg,
  dialog: borderRadius.xl,
  menu: borderRadius.md,
  badge: borderRadius.full,
} as const;
