// ============ COLOR TOKENS ============
export const colors = {
  // Primary Colors
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },
  
  // Neutral Colors
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  
  // Semantic Colors
  success: {
    light: '#10b981',
    main: '#059669',
    dark: '#047857',
  },
  warning: {
    light: '#f59e0b',
    main: '#d97706',
    dark: '#b45309',
  },
  error: {
    light: '#ef4444',
    main: '#dc2626',
    dark: '#b91c1c',
  },
  info: {
    light: '#3b82f6',
    main: '#2563eb',
    dark: '#1d4ed8',
  },
} as const;

// ============ THEME COLORS ============
export const themeColors = {
  light: {
    background: colors.neutral[50],
    surface: '#ffffff',
    surfaceHover: colors.neutral[100],
    border: colors.neutral[200],
    text: {
      primary: colors.neutral[900],
      secondary: colors.neutral[600],
      muted: colors.neutral[400],
    },
  },
  dark: {
    background: colors.neutral[950],
    surface: colors.neutral[900],
    surfaceHover: colors.neutral[800],
    border: colors.neutral[700],
    text: {
      primary: colors.neutral[50],
      secondary: colors.neutral[300],
      muted: colors.neutral[500],
    },
  },
} as const;