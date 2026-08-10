// src/features/theme/domain/ThemePreferences.ts

// Canonical theme preference shapes used across the application. We keep the
// model conservative and backward-compatible while adding fields that are
// required by the Enterprise Theme Engine.

export type ThemeMode = "system" | "light" | "dark" | "custom";

export type Density = "compact" | "default" | "comfortable" | "super";

export type SidebarStyle = "inset" | "floating" | "sidebar";

export type SidebarState = "expanded" | "collapsed" | "mini" | "overlay";

export type LayoutMode = "default" | "compact" | "full";

// Legacy values (full | centered) are preserved as aliases; the canonical
// values are fluid | boxed | wide | ultra.
export type ContentWidth =
  | "fluid"
  | "boxed"
  | "wide"
  | "ultra"
  | "full"
  | "centered";

// Font preference: keep legacy values (auto/sans/serif) but allow arbitrary
// token keys or raw CSS font-family strings for extensibility.
export type FontPref = string;

export type BorderRadiusNumeric = 0 | 0.3 | 0.5 | 0.75 | 1;

export type ShadowLevel = "none" | "small" | "medium" | "large" | "extra";

export type MotionLevel = "off" | "fast" | "normal" | "smooth" | "fancy";

export type NavMode = "sidebar" | "topbar" | "bottom" | "mixed";

export interface TypographyPrefs {
  fontFamily?: string;
  baseSize?: string; // e.g. '1rem' or '16px'
  headingScale?: number; // multiplier for heading sizes
  fontWeight?: string; // e.g. '400' | '500' | '600' | '700'
  letterSpacing?: string; // e.g. 'normal' | '-0.01em' | '0.02em'
  lineHeight?: string; // e.g. '1.5'
  // keep flexible for future controls
  [k: string]: any;
}

// Blur / glass / transparency effects consumed by CSS variables.
export interface EffectsPrefs {
  blur?: string; // backdrop blur amount, e.g. '8px'
  glassOpacity?: number; // 0..1
  transparency?: number; // 0..1 surface transparency
}

export interface AccessibilityPrefs {
  reduceMotion?: boolean;
  highContrast?: boolean;
  focusHighlight?: boolean;
  largeCursor?: boolean;
  // legacy boolean kept for compatibility; colorBlindMode provides finer control
  colorBlind?: boolean;
  colorBlindMode?:
    | "off"
    | "protanopia"
    | "deuteranopia"
    | "tritanopia"
    | "achromatopsia";
}

export interface AnimationPrefs {
  enabled?: boolean;
  speed?: "slow" | "normal" | "fast";
  // Added for more granular motion controls
  motionLevel?: MotionLevel;
}

export interface ComponentStylesPrefs {
  button?: "square" | "rounded" | "pill" | "minimal";
  input?: "outlined" | "filled" | "underlined" | "rounded";
  card?: "flat" | "bordered" | "elevated" | "glass";
  checkbox?: "default" | "square" | "round";
  switch?: "default" | "round";
  scrollbar?: "default" | "thin" | "auto";
  table?: "default" | "compact";
}

export interface WallpaperPrefs {
  type?: "none" | "gradient" | "image" | "pattern";
  gradient?: { from?: string; to?: string; angle?: number };
  image?: { url?: string; opacity?: number; position?: string; size?: string };
  pattern?: { name?: string; opacity?: number };
  opacity?: number;
}

export interface RadiiPrefs {
  global?: string;
  button?: string;
  input?: string;
  card?: string;
  dialog?: string;
  table?: string;
}

export interface DashboardPrefs {
  grid?: { columns?: number; gap?: string };
  cards?: { style?: "compact" | "comfortable"; elevation?: ShadowLevel };
  widgets?: { density?: Density };
  kanban?: { laneCompact?: boolean };
}

export interface ChartPrefs {
  palette?: string[];
  default?: string[];
}

export interface ThemePreferences {
  // schemaVersion allows safe migrations from older persisted shapes
  schemaVersion?: number;

  // Core appearance
  themeMode: ThemeMode;
  // Full theme preset id (see THEME_PRESETS registry in design-system/theme)
  themePreset?: string;
  // For themeMode === "custom": which neutral base to keep (light or dark)
  customThemeBase?: "light" | "dark";
  colorPreset?: string; // accent preset id or custom HEX string
  // Recently used custom accent colors (for the color picker "recent" list)
  accentHistory?: string[];
  // Optional explicit color overrides (engine will accept and map these)
  accentColor?: string;
  primaryColor?: string;
  secondaryColor?: string;

  // Typography
  font?: FontPref;
  typography?: TypographyPrefs;

  // Radii / borders
  // legacy numeric radius kept for backward-compat
  borderRadius?: number; // 0 | 0.3 | 0.5 | 0.75 | 1
  radii?: RadiiPrefs;

  // Density & layout
  density?: Density;
  sidebarStyle?: SidebarStyle;
  sidebarState?: SidebarState;
  layout?: LayoutMode;
  contentWidth?: ContentWidth;
  navigationMode?: NavMode;

  // Direction
  direction?: "auto" | "ltr" | "rtl";

  // Accessibility & motion
  accessibility?: AccessibilityPrefs;
  animation?: AnimationPrefs;

  // Components style variants
  componentStyles?: ComponentStylesPrefs;

  // Wallpaper / background
  wallpaper?: WallpaperPrefs;

  // Shadows & elevation
  shadowLevel?: ShadowLevel;

  // Blur / glass / transparency effects
  effects?: EffectsPrefs;

  // Dashboard & charts tokens (kept optional; components may opt-in)
  dashboard?: DashboardPrefs;
  charts?: ChartPrefs;

  // Extensibility bag for future/experimental options
  extra?: Record<string, any>;
}

export const defaultThemePreferences: ThemePreferences = {
  // bump schemaVersion to reflect newer fields (presets, effects, custom mode)
  schemaVersion: 5,
  themeMode: "system",
  themePreset: "default",
  customThemeBase: "light",
  colorPreset: "default",
  accentHistory: [],
  font: "auto",
  typography: {
    baseSize: "1rem",
    headingScale: 1.25,
    fontWeight: "400",
    letterSpacing: "normal",
    lineHeight: "1.5",
  },
  borderRadius: 0.75,
  radii: {
    global: "0.75rem",
    button: "0.375rem",
    input: "0.25rem",
    card: "0.5rem",
    dialog: "0.75rem",
    table: "0.375rem",
  },
  density: "default",
  sidebarStyle: "floating",
  sidebarState: "expanded",
  layout: "default",
  contentWidth: "centered",
  navigationMode: "sidebar",
  direction: "ltr",
  accessibility: {
    reduceMotion: false,
    highContrast: false,
    focusHighlight: true,
    largeCursor: false,
    colorBlind: false,
    colorBlindMode: "off",
  },
  animation: { enabled: true, speed: "normal", motionLevel: "normal" as any },
  componentStyles: { button: "rounded", input: "outlined", card: "elevated" },
  wallpaper: { type: "none", opacity: 1 },
  shadowLevel: "medium",
  effects: { blur: "8px", glassOpacity: 0.6, transparency: 1 },
  dashboard: {},
  charts: {},
  extra: {},
};
