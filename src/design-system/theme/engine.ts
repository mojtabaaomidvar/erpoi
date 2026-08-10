// Central Theme Engine: tokens, presets and helpers

import { colors, themeColors } from "../tokens/colors";
import { spacing, borderRadius as radiusTokens } from "../tokens/spacing";
import { densitySpacing, componentRadii } from "../tokens/spacing";
import { typography } from "../tokens/typography";
import {
  THEME_PRESETS,
  ACCENT_PRESETS,
  WALLPAPER_PATTERNS,
  listThemePresets,
  listAccentPresets,
  listWallpaperPatterns,
} from "./presets";
import type { ThemePalette, ThemePreset } from "./presets";
import type { ThemePreferences } from "@features/theme/domain/ThemePreferences";
import { defaultThemePreferences as DEFAULT_PREFS } from "@features/theme/domain/ThemePreferences";

// Backward-compatible alias: the accent preset registry previously lived here.
// It now lives in the data-driven preset registry (presets.ts) and is re-exported
// under the legacy name so existing consumers (listColorPresets, provider, UI) keep working.
export const COLOR_PRESETS = ACCENT_PRESETS;

export const CANONICAL_VARS = {
  // Colors
  accentFrom: "--color-accent-from",
  accentTo: "--color-accent-to",
  accentText: "--color-accent-text",
  accentHover: "--color-accent-hover",
  accentActive: "--color-accent-active",
  // primary / semantic
  primary: "--color-primary",
  secondary: "--color-secondary",
  card: "--color-card",
  sidebar: "--color-sidebar",
  header: "--color-header",
  footer: "--color-footer",
  divider: "--color-divider",
  disabled: "--color-disabled",
  overlay: "--color-overlay",
  selection: "--color-selection",
  focus: "--color-focus",
  // semantic colors
  success: "--color-success",
  warning: "--color-warning",
  error: "--color-error",
  info: "--color-info",
  background: "--color-background",
  surface: "--color-surface",
  surfaceHover: "--color-surface-hover",
  border: "--color-border",
  textPrimary: "--color-text-primary",
  textSecondary: "--color-text-secondary",
  textMuted: "--color-text-muted",

  // Spacing
  spacingXs: "--spacing-xs",
  spacingSm: "--spacing-sm",
  spacingMd: "--spacing-md",
  spacingLg: "--spacing-lg",
  spacingXl: "--spacing-xl",

  // Density component tokens
  densityTable: "--density-table",
  densityForm: "--density-form",
  densityCard: "--density-card",
  densityToolbar: "--density-toolbar",
  densityButton: "--density-button",
  densityInput: "--density-input",
  densityList: "--density-list",

  // Radius
  radiusBase: "--radius-base",
  radiusButton: "--radius-button",
  radiusInput: "--radius-input",
  radiusCard: "--radius-card",
  radiusDialog: "--radius-dialog",
  radiusTable: "--radius-table",

  // Typography
  fontFamily: "--font-family",
  fontSizeBase: "--font-size-base",
  // typography extended
  headingScale: "--heading-scale",
  fontWeightBase: "--font-weight-base",
  letterSpacing: "--letter-spacing",
  lineHeight: "--line-height",
  // accessibility & animation
  reduceMotion: "--pref-reduce-motion",
  motionHint: "--motion-speed-hint",
  motionDuration: "--motion-duration",
  colorBlindMode: "--pref-colorblind-mode",
  // effects
  transparency: "--effect-transparency",
  // wallpaper
  wallpaperImage: "--wallpaper-image",
  wallpaperGradient: "--wallpaper-gradient",
  wallpaperPattern: "--wallpaper-pattern",
  wallpaperOpacity: "--wallpaper-opacity",
  // chart palette
  chart0: "--color-chart-0",
  chart1: "--color-chart-1",
  chart2: "--color-chart-2",
  chart3: "--color-chart-3",
  chart4: "--color-chart-4",
  chart5: "--color-chart-5",
  chart6: "--color-chart-6",
  chart7: "--color-chart-7",
  // global shadow token (semantic)
  globalShadow: "--global-shadow-level",
  // glass / effects
  glassBlur: "--effect-glass-blur",
  glassOpacity: "--effect-glass-opacity",
  // navigation / layout
  sidebarStyle: "--sidebar-style",
  sidebarState: "--sidebar-state",
  navigationMode: "--navigation-mode",
  layoutMode: "--layout-mode",
  contentWidth: "--content-max-width",
  motionSpeed: "--pref-motion-speed",
  // shadow / elevation
  shadowNone: "--shadow-none",
  shadowSm: "--shadow-sm",
  shadowMd: "--shadow-md",
  shadowLg: "--shadow-lg",
  shadowXl: "--shadow-xl",
};

export type CssVars = Record<string, string>;

// Resolve the effective light/dark state from preferences.
// - system  -> follows the OS/browser preference (matchMedia with time fallback)
// - custom  -> uses the user-selected custom base (light | dark)
// - light/dark -> explicit
export function resolveIsDark(prefs: ThemePreferences): boolean {
  const mode = prefs.themeMode ?? "system";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  if (mode === "custom") return prefs.customThemeBase === "dark";
  return systemPrefersDark();
}

export function systemPrefersDark(): boolean {
  if (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function"
  ) {
    try {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch (err) {
      // fall through to time-based heuristic
    }
  }
  return isNightTime();
}

// Resolve the full palette for a given preference + light/dark state.
// Falls back to the canonical themeColors registry when no preset is selected
// or the preset id is unknown (forward compatibility for imported themes).
export function getThemePalette(
  prefs: ThemePreferences,
  isDark: boolean,
): ThemePalette {
  const presetId = prefs.themePreset || "default";
  const preset: ThemePreset | undefined = THEME_PRESETS[presetId];
  if (!preset) {
    const t = isDark ? themeColors.dark : themeColors.light;
    return {
      background: t.background,
      surface: t.surface,
      surfaceHover: t.surfaceHover,
      border: t.border,
      text: {
        primary: t.text.primary,
        secondary: t.text.secondary,
        muted: t.text.muted,
      },
      accent: {
        from: ACCENT_PRESETS.default.from,
        to: ACCENT_PRESETS.default.to,
        text: ACCENT_PRESETS.default.text,
      },
    };
  }
  return isDark ? preset.dark : preset.light;
}

export function buildCssVarsFromPrefs(prefs: ThemePreferences): CssVars {
  const vars: CssVars = {};

  // Direction handled elsewhere by provider

  // Typography
  // Map legacy preference values (auto | sans | serif | named fonts) to the
  // token registry. Custom font-family strings pass through untouched.
  const fontKey = (prefs.font || "auto").toLowerCase();
  const registry = typography.fontFamily as Record<string, string>;
  let fontFamily: string;
  if (fontKey === "serif") {
    fontFamily = "Georgia, 'Times New Roman', serif";
  } else if (fontKey === "auto" || fontKey === "sans" || !registry[fontKey]) {
    fontFamily =
      registry.inter || registry.system || typography.fontFamily.system;
  } else {
    fontFamily = registry[fontKey];
  }
  vars[CANONICAL_VARS.fontFamily] = fontFamily;
  vars[CANONICAL_VARS.fontSizeBase] =
    prefs.typography?.baseSize ?? typography.fontSize.base[0];
  vars[CANONICAL_VARS.headingScale] = String(
    prefs.typography?.headingScale ?? 1.25,
  );
  vars[CANONICAL_VARS.fontWeightBase] =
    prefs.typography?.fontWeight ?? typography.fontWeight.normal;
  vars[CANONICAL_VARS.letterSpacing] =
    prefs.typography?.letterSpacing ?? typography.letterSpacing.normal;
  vars[CANONICAL_VARS.lineHeight] =
    prefs.typography?.lineHeight ?? typography.lineHeight.normal;

  // Spacing: select density map
  const density = (prefs.density as any) || "default";
  const densityMap = (densitySpacing as any)[density] || densitySpacing.default;
  vars[CANONICAL_VARS.spacingXs] = densityMap.xs;
  vars[CANONICAL_VARS.spacingSm] = densityMap.sm;
  vars[CANONICAL_VARS.spacingMd] = densityMap.md;
  vars[CANONICAL_VARS.spacingLg] = densityMap.lg;
  vars[CANONICAL_VARS.spacingXl] = densityMap.xl;

  // Density component tokens (consumed by tables, forms, cards, toolbars,
  // buttons, inputs and lists). Scaled from the base density map.
  const scale = (v: string) => {
    const rem = parseFloat(v);
    return Number.isFinite(rem) ? `${rem}rem` : v;
  };
  const densityScale: Record<string, number> = {
    compact: 0.72,
    default: 1,
    comfortable: 1.25,
    super: 1.5,
  };
  const factor = densityScale[density] ?? 1;
  const mkDensity = (baseRem: number) => scale(`${baseRem * factor}`);
  vars[CANONICAL_VARS.densityTable] = mkDensity(0.625);
  vars[CANONICAL_VARS.densityForm] = mkDensity(0.75);
  vars[CANONICAL_VARS.densityCard] = mkDensity(1);
  vars[CANONICAL_VARS.densityToolbar] = mkDensity(0.625);
  vars[CANONICAL_VARS.densityButton] = mkDensity(0.5);
  vars[CANONICAL_VARS.densityInput] = mkDensity(0.5);
  vars[CANONICAL_VARS.densityList] = mkDensity(0.5);

  // Border radius (map numeric radii to tokens conservatively)
  const radiusMap: Record<number, string> = {
    0: "0px",
    0.3: radiusTokens.sm,
    0.5: radiusTokens.md,
    0.75: radiusTokens.lg,
    1: radiusTokens.xl || "16px",
  };
  vars[CANONICAL_VARS.radiusBase] = radiusMap[prefs.borderRadius ?? 0.75];

  // Component radii: user overrides (prefs.radii) fall back to the numeric
  // global radius and the token defaults. Button style overrides the radius
  // for square / pill variants so the component token stays in sync.
  const globalRadius = vars[CANONICAL_VARS.radiusBase];
  const r = prefs.radii ?? {};
  const comp = componentRadii;
  const buttonStyle = prefs.componentStyles?.button ?? "rounded";
  let buttonRadius = r.button || globalRadius || comp.button;
  if (buttonStyle === "square") buttonRadius = "0px";
  else if (buttonStyle === "pill") buttonRadius = "9999px";
  vars[CANONICAL_VARS.radiusButton] = buttonRadius;
  vars[CANONICAL_VARS.radiusInput] = r.input || globalRadius || comp.input;
  vars[CANONICAL_VARS.radiusCard] = r.card || globalRadius || comp.card;
  vars[CANONICAL_VARS.radiusDialog] = r.dialog || globalRadius || comp.dialog;
  vars[CANONICAL_VARS.radiusTable] = r.table || globalRadius || comp.dialog;

  // component token: scrollbar style (semantic)
  vars["--scrollbar-style"] =
    (prefs.componentStyles?.scrollbar as any) ||
    (prefs.extra && prefs.extra.scrollbar) ||
    "default";

  // Full palette resolution from the data-driven preset registry.
  const isDark = resolveIsDark(prefs);
  const palette = getThemePalette(prefs, isDark);

  // Accent color resolution priority:
  // 1. explicit accentColor override
  // 2. colorPreset (accent preset id or HEX)
  // 3. preset palette accent
  let accentFrom = palette.accent.from;
  let accentTo = palette.accent.to;
  let accentText = palette.accent.text;

  if (prefs.colorPreset && COLOR_PRESETS[prefs.colorPreset]) {
    const p = COLOR_PRESETS[prefs.colorPreset];
    accentFrom = p.from;
    accentTo = p.to;
    accentText = p.text;
  } else if (prefs.colorPreset && typeof prefs.colorPreset === "string") {
    // simple HEX color support (#rgb or #rrggbb)
    const v = prefs.colorPreset.trim();
    const hexMatch = v.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
    if (hexMatch) {
      accentFrom = v;
      accentTo = v;
      accentText = getReadableTextColorFromHex(v);
    }
  }

  vars[CANONICAL_VARS.accentFrom] = accentFrom;
  vars[CANONICAL_VARS.accentTo] = accentTo;
  vars[CANONICAL_VARS.accentText] = accentText;

  // allow explicit overrides (accentColor / primaryColor / secondaryColor)
  if (prefs.accentColor) vars[CANONICAL_VARS.accentFrom] = prefs.accentColor;
  if (prefs.primaryColor) vars[CANONICAL_VARS.primary] = prefs.primaryColor;
  if (prefs.secondaryColor)
    vars[CANONICAL_VARS.secondary] = prefs.secondaryColor;

  // derived accent states (hover/active)
  try {
    vars[CANONICAL_VARS.accentHover] = adjustHexLightness(accentFrom, -0.08);
    vars[CANONICAL_VARS.accentActive] = adjustHexLightness(accentFrom, -0.14);
    vars[CANONICAL_VARS.selection] = hexToRgba(accentFrom, 0.12);
    // focus color - slightly darker than accent for outlines
    vars[CANONICAL_VARS.focus] = adjustHexLightness(accentFrom, -0.2);
  } catch (err) {
    // fallback gracefully
    vars[CANONICAL_VARS.accentHover] = accentFrom;
    vars[CANONICAL_VARS.accentActive] = accentFrom;
    vars[CANONICAL_VARS.selection] = hexToRgba(accentFrom, 0.12);
    vars[CANONICAL_VARS.focus] = accentFrom;
  }

  // Semantic surface/text from the resolved preset palette
  vars[CANONICAL_VARS.background] = palette.background;
  vars[CANONICAL_VARS.surface] = palette.surface;
  vars[CANONICAL_VARS.surfaceHover] = palette.surfaceHover;
  vars[CANONICAL_VARS.border] = palette.border;
  vars[CANONICAL_VARS.textPrimary] = palette.text.primary;
  vars[CANONICAL_VARS.textSecondary] = palette.text.secondary;
  vars[CANONICAL_VARS.textMuted] = palette.text.muted;

  // Provide some semantic aliases that components can rely on
  vars["--color-accent"] = vars[CANONICAL_VARS.accentFrom];
  vars["--color-accent-text"] = vars[CANONICAL_VARS.accentText];
  vars["--color-border"] = vars[CANONICAL_VARS.border];
  vars["--color-selection"] = vars[CANONICAL_VARS.selection];

  // semantic tokens mapped from palette
  vars[CANONICAL_VARS.primary] = accentFrom;
  vars[CANONICAL_VARS.secondary] = accentTo;
  vars[CANONICAL_VARS.card] = palette.surface;
  vars[CANONICAL_VARS.sidebar] = isDark
    ? palette.surfaceHover
    : palette.surfaceHover;
  vars[CANONICAL_VARS.header] = palette.surface;
  vars[CANONICAL_VARS.footer] = palette.surface;
  vars[CANONICAL_VARS.divider] = palette.border;
  vars[CANONICAL_VARS.disabled] = colors.neutral[300];
  vars[CANONICAL_VARS.overlay] = isDark
    ? "rgba(0,0,0,0.6)"
    : "rgba(0,0,0,0.35)";

  // semantic colors
  vars[CANONICAL_VARS.success] = colors.success.main;
  vars[CANONICAL_VARS.warning] = colors.warning.main;
  vars[CANONICAL_VARS.error] = colors.error.main;
  vars[CANONICAL_VARS.info] = colors.info.main;

  // shadows / elevation (semantic)
  vars[CANONICAL_VARS.shadowNone] = "none";
  vars[CANONICAL_VARS.shadowSm] = "0 1px 2px rgba(16,24,40,0.04)";
  vars[CANONICAL_VARS.shadowMd] = "0 4px 12px rgba(16,24,40,0.08)";
  vars[CANONICAL_VARS.shadowLg] = "0 12px 40px rgba(16,24,40,0.12)";
  vars[CANONICAL_VARS.shadowXl] = "0 24px 80px rgba(16,24,40,0.16)";

  // component elevation semantic tokens
  vars["--elevation-card"] = vars[CANONICAL_VARS.shadowMd];
  vars["--elevation-dialog"] = vars[CANONICAL_VARS.shadowLg];

  // Apply chosen shadow level to a semantic var so components can easily use it
  const shadowLevel = prefs.shadowLevel || "medium";
  const shadowMap: Record<string, string> = {
    none: vars[CANONICAL_VARS.shadowNone],
    small: vars[CANONICAL_VARS.shadowSm],
    medium: vars[CANONICAL_VARS.shadowMd],
    large: vars[CANONICAL_VARS.shadowLg],
    extra: vars[CANONICAL_VARS.shadowXl],
  } as any;
  vars["--global-shadow-level"] = shadowMap[shadowLevel] || shadowMap.medium;

  // accessibility and animation
  vars[CANONICAL_VARS.reduceMotion] = prefs.accessibility?.reduceMotion
    ? "1"
    : "0";
  // motion speed mapping - expose both a friendly token and a numeric hint
  const motionSpeed =
    prefs.animation?.motionLevel || (prefs.animation?.speed as any) || "normal";
  vars[CANONICAL_VARS.motionSpeed] = motionSpeed as string;
  const motionHint =
    motionSpeed === "off"
      ? "0"
      : motionSpeed === "fast"
        ? "0.6"
        : motionSpeed === "smooth"
          ? "1.2"
          : motionSpeed === "fancy"
            ? "1.6"
            : "1";
  vars["--motion-speed-hint"] = motionHint;
  // Duration token in seconds so CSS can scale transitions.
  const durationMap: Record<string, string> = {
    off: "0.001s",
    fast: "0.1s",
    normal: "0.2s",
    smooth: "0.3s",
    fancy: "0.45s",
  };
  vars[CANONICAL_VARS.motionDuration] =
    durationMap[motionSpeed] || durationMap.normal;

  // Color-blind mode token (consumed by CSS filters on the root element)
  const colorBlindMode =
    prefs.accessibility?.colorBlindMode ||
    (prefs.accessibility?.colorBlind ? "deuteranopia" : "off");
  vars[CANONICAL_VARS.colorBlindMode] = colorBlindMode || "off";

  // Effects: blur / glass / transparency
  const fx = prefs.effects ?? {};
  vars[CANONICAL_VARS.glassBlur] = fx.blur ?? "8px";
  vars[CANONICAL_VARS.glassOpacity] = String(fx.glassOpacity ?? 0.6);
  vars[CANONICAL_VARS.transparency] = String(fx.transparency ?? 1);

  // Wallpaper tokens: engine renders all wallpaper variants so the provider
  // only needs to toggle the wallpaper class on the root element.
  const wp = prefs.wallpaper ?? {};
  vars[CANONICAL_VARS.wallpaperOpacity] = String(wp.opacity ?? 1);
  if (wp.type === "image" && wp.image?.url) {
    vars[CANONICAL_VARS.wallpaperImage] = `url('${wp.image.url}')`;
  } else {
    vars[CANONICAL_VARS.wallpaperImage] = "none";
  }
  if (wp.type === "gradient" && wp.gradient) {
    const g = wp.gradient;
    vars[CANONICAL_VARS.wallpaperGradient] = `linear-gradient(${
      g.angle ?? 135
    }deg, ${g.from || accentFrom}, ${g.to || accentTo})`;
  } else {
    vars[CANONICAL_VARS.wallpaperGradient] = "none";
  }
  if (wp.type === "pattern" && wp.pattern?.name) {
    const pattern = WALLPAPER_PATTERNS[wp.pattern.name];
    vars[CANONICAL_VARS.wallpaperPattern] = pattern ? pattern.css : "none";
    // pattern opacity piggybacks on the same opacity token
    if (wp.pattern.opacity != null) {
      vars[CANONICAL_VARS.wallpaperOpacity] = String(wp.pattern.opacity);
    }
  } else {
    vars[CANONICAL_VARS.wallpaperPattern] = "none";
  }

  // Chart palette: expose up to 8 colors from preferences or token defaults
  const chartPalette =
    prefs.charts && prefs.charts.palette && prefs.charts.palette.length
      ? prefs.charts.palette
      : colors.chart && colors.chart.palette
        ? colors.chart.palette
        : [];
  for (let i = 0; i < 8; i++) {
    vars[CANONICAL_VARS[("chart" + i) as keyof typeof CANONICAL_VARS] as any] =
      chartPalette[i] ??
      chartPalette[i % (chartPalette.length || 1)] ??
      "transparent";
  }

  // Navigation / layout tokens
  vars[CANONICAL_VARS.sidebarStyle] = prefs.sidebarStyle ?? "floating";
  vars[CANONICAL_VARS.sidebarState] = prefs.sidebarState ?? "expanded";
  vars[CANONICAL_VARS.navigationMode] = prefs.navigationMode ?? "sidebar";
  vars[CANONICAL_VARS.layoutMode] = prefs.layout ?? "default";
  // Content width: fluid | boxed | wide | ultra (legacy full | centered aliases)
  const contentWidthMap: Record<string, string> = {
    fluid: "100%",
    full: "100%",
    boxed: "1200px",
    centered: "1200px",
    wide: "1400px",
    ultra: "1600px",
  };
  vars[CANONICAL_VARS.contentWidth] =
    contentWidthMap[prefs.contentWidth || "fluid"] || "100%";

  // Expose a semantic global shadow var for components
  vars[CANONICAL_VARS.globalShadow] = vars["--global-shadow-level"];

  // component-level style tokens (so components can react without app-level logic)
  vars["--component-button-style"] = prefs.componentStyles?.button ?? "rounded";
  vars["--component-input-style"] = prefs.componentStyles?.input ?? "outlined";
  vars["--component-card-style"] = prefs.componentStyles?.card ?? "elevated";
  vars["--component-checkbox-style"] =
    prefs.componentStyles?.checkbox ?? "default";
  vars["--component-switch-style"] = prefs.componentStyles?.switch ?? "default";
  vars["--component-table-style"] = prefs.componentStyles?.table ?? "default";

  // accessibility flags exposed as vars for CSS-driven behaviors
  vars["--pref-high-contrast"] = prefs.accessibility?.highContrast ? "1" : "0";
  vars["--pref-focus-highlight"] = prefs.accessibility?.focusHighlight
    ? "1"
    : "0";
  vars["--pref-large-cursor"] = prefs.accessibility?.largeCursor ? "1" : "0";

  return vars;
}

export function isNightTime(): boolean {
  const hour = new Date().getHours();
  return hour < 6 || hour >= 18;
}

export function applyCssVars(vars: CssVars) {
  const root =
    typeof document !== "undefined" ? document.documentElement : null;
  if (!root) return;
  // Batch and avoid unnecessary style writes by checking current computed value.
  const computed = getComputedStyle(root);
  for (const k in vars) {
    const next = String(vars[k] ?? "").trim();
    const cur = computed.getPropertyValue(k).trim();
    if (cur !== next) {
      root.style.setProperty(k, next);
    }
  }
}

export function buildLegacyAliases(vars: CssVars): CssVars {
  // provide backward-compatible legacy names used in theme.css
  const legacy: CssVars = {};
  if (vars[CANONICAL_VARS.background])
    legacy["--bg-app"] = vars[CANONICAL_VARS.background];
  if (vars[CANONICAL_VARS.surface])
    legacy["--bg-surface"] = vars[CANONICAL_VARS.surface];
  if (vars[CANONICAL_VARS.surfaceHover])
    legacy["--bg-surface-hover"] = vars[CANONICAL_VARS.surfaceHover];
  // Map some additional legacy background variables used across the app CSS
  if (vars[CANONICAL_VARS.card])
    legacy["--bg-card"] = vars[CANONICAL_VARS.card];
  if (vars[CANONICAL_VARS.header])
    legacy["--bg-header"] = vars[CANONICAL_VARS.header];
  if (vars[CANONICAL_VARS.sidebar])
    legacy["--bg-sidebar"] = vars[CANONICAL_VARS.sidebar];
  if (vars[CANONICAL_VARS.footer])
    legacy["--bg-footer"] = vars[CANONICAL_VARS.footer];
  if (vars[CANONICAL_VARS.textPrimary])
    legacy["--text-primary"] = vars[CANONICAL_VARS.textPrimary];
  if (vars[CANONICAL_VARS.textSecondary])
    legacy["--text-secondary"] = vars[CANONICAL_VARS.textSecondary];
  if (vars[CANONICAL_VARS.textMuted])
    legacy["--text-muted"] = vars[CANONICAL_VARS.textMuted];
  // Sidebar text tokens (legacy)
  if (vars[CANONICAL_VARS.textSecondary])
    legacy["--text-sidebar"] = vars[CANONICAL_VARS.textSecondary];
  if (vars[CANONICAL_VARS.textPrimary])
    legacy["--text-sidebar-active"] = vars[CANONICAL_VARS.textPrimary];
  if (vars[CANONICAL_VARS.border])
    legacy["--border-color"] = vars[CANONICAL_VARS.border];
  // Common legacy border variables used by existing styles
  if (vars[CANONICAL_VARS.border])
    legacy["--border-sidebar"] = vars[CANONICAL_VARS.border];
  if (vars[CANONICAL_VARS.border])
    legacy["--border-input"] = vars[CANONICAL_VARS.border];
  if (vars[CANONICAL_VARS.border])
    legacy["--border-hover"] = vars[CANONICAL_VARS.border];
  if (vars[CANONICAL_VARS.radiusBase])
    legacy["--radius-base"] = vars[CANONICAL_VARS.radiusBase];
  // accent
  if (vars[CANONICAL_VARS.accentFrom])
    legacy["--accent-from"] = vars[CANONICAL_VARS.accentFrom];
  if (vars[CANONICAL_VARS.accentTo])
    legacy["--accent-to"] = vars[CANONICAL_VARS.accentTo];
  if (vars[CANONICAL_VARS.accentText])
    legacy["--accent-text"] = vars[CANONICAL_VARS.accentText];
  // spacing
  if (vars[CANONICAL_VARS.spacingXs])
    legacy["--spacing-xs"] = vars[CANONICAL_VARS.spacingXs];
  if (vars[CANONICAL_VARS.spacingSm])
    legacy["--spacing-sm"] = vars[CANONICAL_VARS.spacingSm];
  if (vars[CANONICAL_VARS.spacingMd])
    legacy["--spacing-md"] = vars[CANONICAL_VARS.spacingMd];
  if (vars[CANONICAL_VARS.spacingLg])
    legacy["--spacing-lg"] = vars[CANONICAL_VARS.spacingLg];
  if (vars[CANONICAL_VARS.spacingXl])
    legacy["--spacing-xl"] = vars[CANONICAL_VARS.spacingXl];
  // typography
  if (vars[CANONICAL_VARS.fontFamily])
    legacy["--font-family"] = vars[CANONICAL_VARS.fontFamily];
  if (vars[CANONICAL_VARS.fontSizeBase])
    legacy["--font-size-base"] = vars[CANONICAL_VARS.fontSizeBase];

  // Provide some convenience aliases for older components that expect these
  // names (they will be no-ops if not present in vars)
  if (vars[CANONICAL_VARS.accentHover])
    legacy["--accent-hover"] = vars[CANONICAL_VARS.accentHover];
  if (vars[CANONICAL_VARS.accentActive])
    legacy["--accent-active"] = vars[CANONICAL_VARS.accentActive];
  if (vars[CANONICAL_VARS.selection])
    legacy["--selection-color"] = vars[CANONICAL_VARS.selection];
  if (vars[CANONICAL_VARS.focus])
    legacy["--focus-color"] = vars[CANONICAL_VARS.focus];

  return legacy;
}

// ---------------------- Import/Export & Validation ----------------------

function hexToRgb(hex: string) {
  const v = hex.replace("#", "");
  if (v.length === 3) {
    const r = parseInt(v[0] + v[0], 16);
    const g = parseInt(v[1] + v[1], 16);
    const b = parseInt(v[2] + v[2], 16);
    return { r, g, b };
  }
  if (v.length === 6) {
    const r = parseInt(v.slice(0, 2), 16);
    const g = parseInt(v.slice(2, 4), 16);
    const b = parseInt(v.slice(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

function getLuminanceFromRgb({ r, g, b }: { r: number; g: number; b: number }) {
  // convert sRGB channel [0..255] to linear value
  const srgb = [r, g, b]
    .map((v) => v / 255)
    .map((c) => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function getReadableTextColorFromHex(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#ffffff";
  const lum = getLuminanceFromRgb(rgb);
  // threshold chosen conservatively
  return lum > 0.45 ? "#000000" : "#ffffff";
}

// Convert RGB to HSL (all channels in [0..255])
function rgbToHsl({ r, g, b }: { r: number; g: number; b: number }) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      case bn:
        h = (rn - gn) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb({ h, s, l }: { h: number; s: number; l: number }) {
  // h: 0..360, s,l: 0..100
  const hn = h / 360;
  const sn = s / 100;
  const ln = l / 100;
  if (sn === 0) {
    const v = Math.round(ln * 255);
    return { r: v, g: v, b: v };
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;
  const r = Math.round(hue2rgb(p, q, hn + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, hn) * 255);
  const b = Math.round(hue2rgb(p, q, hn - 1 / 3) * 255);
  return { r, g, b };
}

function clamp(v: number, a = 0, b = 1) {
  return Math.min(b, Math.max(a, v));
}

function adjustHexLightness(hex: string, delta: number) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const hsl = rgbToHsl(rgb);
  // delta is fraction (-1 .. 1) representing change in lightness
  const nextL = clamp(hsl.l / 100 + delta, 0, 1) * 100;
  const nextRgb = hslToRgb({ h: hsl.h, s: hsl.s, l: nextL });
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(nextRgb.r)}${toHex(nextRgb.g)}${toHex(nextRgb.b)}`;
}

function hexToRgba(hex: string, alpha = 1) {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(0,0,0,${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

export function exportThemeToJson(prefs: ThemePreferences) {
  return JSON.stringify(prefs, null, 2);
}

export function validateThemePreferences(obj: any) {
  const errors: string[] = [];
  if (!obj || typeof obj !== "object") {
    errors.push("Theme is not an object");
    return { valid: false, errors };
  }
  const modes = ["system", "light", "dark", "custom"];
  if (obj.themeMode !== undefined && !modes.includes(obj.themeMode))
    errors.push("themeMode must be one of system, light, dark or custom");

  if (
    obj.customThemeBase !== undefined &&
    !["light", "dark"].includes(obj.customThemeBase)
  )
    errors.push("customThemeBase must be light or dark");

  if (obj.themePreset !== undefined && typeof obj.themePreset !== "string")
    errors.push("themePreset must be a string");

  // font is extensible: allow legacy values (auto,sans,serif) or any string
  if (obj.font !== undefined && typeof obj.font !== "string")
    errors.push("font must be a string");

  if (
    obj.borderRadius !== undefined &&
    ![0, 0.3, 0.5, 0.75, 1].includes(obj.borderRadius)
  )
    errors.push("borderRadius must be one of 0, 0.3, 0.5, 0.75, 1");

  if (
    obj.density !== undefined &&
    !["compact", "default", "comfortable", "super"].includes(obj.density)
  )
    errors.push("density has invalid value");

  if (
    obj.sidebarStyle !== undefined &&
    !["inset", "floating", "sidebar"].includes(obj.sidebarStyle)
  )
    errors.push("sidebarStyle has invalid value");

  if (
    obj.sidebarState !== undefined &&
    !["expanded", "collapsed", "mini", "overlay"].includes(obj.sidebarState)
  )
    errors.push("sidebarState has invalid value");

  if (
    obj.navigationMode !== undefined &&
    !["sidebar", "topbar", "bottom", "mixed"].includes(obj.navigationMode)
  )
    errors.push("navigationMode has invalid value");

  if (
    obj.shadowLevel !== undefined &&
    !["none", "small", "medium", "large", "extra"].includes(obj.shadowLevel)
  )
    errors.push("shadowLevel has invalid value");

  if (
    obj.layout !== undefined &&
    !["default", "compact", "full"].includes(obj.layout)
  )
    errors.push("layout has invalid value");

  if (
    obj.contentWidth !== undefined &&
    !["fluid", "boxed", "wide", "ultra", "full", "centered"].includes(
      obj.contentWidth,
    )
  )
    errors.push("contentWidth has invalid value");

  // allow automatic locale-based direction detection
  if (
    obj.direction !== undefined &&
    !["ltr", "rtl", "auto"].includes(obj.direction)
  )
    errors.push("direction must be ltr, rtl or auto");

  if (obj.extra !== undefined && typeof obj.extra !== "object")
    errors.push("extra must be an object");

  // Validate accessibility shape
  if (obj.accessibility !== undefined && typeof obj.accessibility !== "object")
    errors.push("accessibility must be an object");

  // Validate typography
  if (obj.typography !== undefined && typeof obj.typography !== "object")
    errors.push("typography must be an object");

  // Validate effects / radii / wallpaper shapes
  if (obj.effects !== undefined && typeof obj.effects !== "object")
    errors.push("effects must be an object");
  if (obj.radii !== undefined && typeof obj.radii !== "object")
    errors.push("radii must be an object");
  if (obj.wallpaper !== undefined && typeof obj.wallpaper !== "object")
    errors.push("wallpaper must be an object");
  if (
    obj.componentStyles !== undefined &&
    typeof obj.componentStyles !== "object"
  )
    errors.push("componentStyles must be an object");

  return { valid: errors.length === 0, errors };
}

// derive a direction based on locale/language heuristics. Exported so the
// application provider can compute the effective dir when prefs.direction === 'auto'.
export function deriveDirectionFromLocale(locale?: string | string[]) {
  const l = Array.isArray(locale) ? locale[0] : locale;
  if (!l || typeof l !== "string") return "ltr";
  // Common RTL language prefixes
  const rtlPrefixes = ["ar", "fa", "he", "ur", "yi"]; // Arabic, Persian, Hebrew, Urdu, Yiddish
  const prefix = l.split("-")[0].toLowerCase();
  return rtlPrefixes.includes(prefix) ? "rtl" : "ltr";
}

export function importThemeFromJson(raw: string) {
  try {
    const parsed = JSON.parse(raw);
    const { valid, errors } = validateThemePreferences(parsed);
    if (!valid) return { ok: false, errors };
    // Ensure the imported shape is migrated into our canonical model so
    // callers can rely on a stable ThemePreferences object. This protects
    // against older exported files which may be missing fields or use
    // legacy names.
    const prefs = migrateThemePreferences(parsed);
    return { ok: true, prefs };
  } catch (err: any) {
    return {
      ok: false,
      errors: ["Invalid JSON: " + String(err.message || err)],
    };
  }
}

// ---------------------- Token Catalog & Preset Utilities ----------------------
export function getTokenCatalog() {
  return {
    colors,
    themeColors,
    spacing,
    densitySpacing,
    borderRadius: radiusTokens,
    componentRadii,
    typography,
  };
}

export function listColorPresets() {
  return Object.keys(COLOR_PRESETS).map((k) => ({
    id: k,
    ...COLOR_PRESETS[k],
  }));
}

export function getCssVarsForPreset(preset: string) {
  const p = COLOR_PRESETS[preset];
  if (!p) return null;
  const base: CssVars = {};
  base[CANONICAL_VARS.accentFrom] = p.from;
  base[CANONICAL_VARS.accentTo] = p.to;
  base[CANONICAL_VARS.accentText] = p.text;
  try {
    base[CANONICAL_VARS.accentHover] = adjustHexLightness(p.from, -0.08);
    base[CANONICAL_VARS.accentActive] = adjustHexLightness(p.from, -0.14);
    base[CANONICAL_VARS.selection] = hexToRgba(p.from, 0.12);
    base[CANONICAL_VARS.focus] = adjustHexLightness(p.from, -0.2);
  } catch (err) {
    base[CANONICAL_VARS.accentHover] = p.from;
    base[CANONICAL_VARS.accentActive] = p.from;
    base[CANONICAL_VARS.selection] = hexToRgba(p.from, 0.12);
    base[CANONICAL_VARS.focus] = p.from;
  }
  return base;
}

// ---------------------- Migration Helpers ----------------------
// Provide a conservative migration path for older persisted preference
// shapes. The function attempts a safe merge with defaults and bumps the
// schemaVersion so callers can rely on a stable shape.
export function migrateThemePreferences(obj: any): ThemePreferences {
  // If invalid, return defaults
  if (!obj || typeof obj !== "object") return { ...DEFAULT_PREFS };

  const currentVersion = DEFAULT_PREFS.schemaVersion ?? 0;
  const incomingVersion = obj.schemaVersion ?? 0;

  // Conservative migration: merge with defaults and set schemaVersion to
  // current. Avoid destructive transformations.
  const migrated: ThemePreferences = {
    ...DEFAULT_PREFS,
    ...obj,
    schemaVersion: currentVersion,
  } as ThemePreferences;

  // v4 -> v5: legacy density aliases (checked as string because "normal" /
  // "large" predate the canonical Density union)
  if ((migrated.density as string) === "normal") migrated.density = "default";
  if ((migrated.density as string) === "large") migrated.density = "super";

  // Legacy content width values are kept as aliases; canonical values are
  // fluid | boxed | wide | ultra. No transformation needed, but ensure the
  // field exists.
  if (!migrated.contentWidth) migrated.contentWidth = "fluid";

  // Legacy themes have no themePreset -> default preset
  if (!migrated.themePreset) migrated.themePreset = "default";

  // Legacy themes have no effects group -> conservative defaults
  if (!migrated.effects) {
    migrated.effects = {
      blur: "8px",
      glassOpacity: 0.6,
      transparency: 1,
    };
  }

  // Legacy themes have no accentHistory
  if (!Array.isArray(migrated.accentHistory)) migrated.accentHistory = [];

  // Merge typography defaults for new fields
  migrated.typography = {
    ...(DEFAULT_PREFS.typography as object),
    ...(migrated.typography as object),
  };

  return migrated;
}

// ---------------------- Local Theme Profiles (CRUD) ----------------------

export type ThemeProfile = {
  id: string;
  name: string;
  prefs: ThemePreferences;
  createdAt: number;
  updatedAt: number;
};

const PROFILES_KEY = "theme-profiles-v1";
const ACTIVE_PROFILE_KEY = "theme-active-profile-v1";

function generateId() {
  return "tp_" + Math.random().toString(36).slice(2, 9);
}

export function getThemeProfiles(): ThemeProfile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as ThemeProfile[];

    // migrate legacy object format (name -> prefs)
    const arr: ThemeProfile[] = Object.keys(parsed).map((k) => ({
      id: generateId(),
      name: k,
      prefs: { ...DEFAULT_PREFS, ...(parsed as any)[k] },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
    saveThemeProfiles(arr);
    return arr;
  } catch (err) {
    console.warn("Failed to read theme profiles", err);
    return [];
  }
}

export function saveThemeProfiles(profiles: ThemeProfile[]) {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch (err) {
    console.warn("Failed to persist theme profiles", err);
  }
}

export function addThemeProfile(name: string, prefs: ThemePreferences) {
  const profiles = getThemeProfiles();
  const now = Date.now();
  const profile: ThemeProfile = {
    id: generateId(),
    name,
    prefs: { ...DEFAULT_PREFS, ...prefs },
    createdAt: now,
    updatedAt: now,
  };
  profiles.push(profile);
  saveThemeProfiles(profiles);
  return profile;
}

export function updateThemeProfile(
  id: string,
  patch: Partial<{ name: string; prefs: ThemePreferences }>,
) {
  const profiles = getThemeProfiles();
  const idx = profiles.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const cur = profiles[idx];
  const updated: ThemeProfile = {
    ...cur,
    name: patch.name ?? cur.name,
    prefs: patch.prefs ? { ...DEFAULT_PREFS, ...patch.prefs } : cur.prefs,
    updatedAt: Date.now(),
  };
  profiles[idx] = updated;
  saveThemeProfiles(profiles);
  return updated;
}

export function removeThemeProfile(id: string) {
  const profiles = getThemeProfiles();
  const next = profiles.filter((p) => p.id !== id);
  saveThemeProfiles(next);
  return profiles.length !== next.length;
}

export function duplicateThemeProfile(id: string, newName?: string) {
  const profiles = getThemeProfiles();
  const p = profiles.find((t) => t.id === id);
  if (!p) return null;
  const now = Date.now();
  const dup: ThemeProfile = {
    id: generateId(),
    name: newName ?? `${p.name} (copy)`,
    prefs: { ...p.prefs },
    createdAt: now,
    updatedAt: now,
  };
  profiles.push(dup);
  saveThemeProfiles(profiles);
  return dup;
}

export function getActiveThemeProfileId(): string | null {
  try {
    const v = localStorage.getItem(ACTIVE_PROFILE_KEY);
    return v || null;
  } catch (err) {
    return null;
  }
}

export function setActiveThemeProfileId(id: string | null) {
  try {
    if (id) localStorage.setItem(ACTIVE_PROFILE_KEY, id);
    else localStorage.removeItem(ACTIVE_PROFILE_KEY);
  } catch (err) {
    console.warn("Failed to set active theme profile id", err);
  }
}

export function exportThemeProfileToJson(id: string) {
  const profiles = getThemeProfiles();
  const p = profiles.find((t) => t.id === id);
  if (!p) return null;
  return exportThemeToJson(p.prefs);
}

export function importThemeProfileFromJson(raw: string, name?: string) {
  const res = importThemeFromJson(raw);
  if (!res.ok) return { ok: false, errors: res.errors };
  // Migrate the parsed preferences so the stored profile is canonical.
  const prefs = migrateThemePreferences(res.prefs ?? DEFAULT_PREFS);
  const profile = addThemeProfile(name ?? `Imported ${Date.now()}`, prefs);
  return { ok: true, profile };
}

// Rename an existing theme profile (name only; prefs untouched).
export function renameThemeProfile(id: string, name: string) {
  const profiles = getThemeProfiles();
  const idx = profiles.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const updated: ThemeProfile = {
    ...profiles[idx],
    name: name.trim() || profiles[idx].name,
    updatedAt: Date.now(),
  };
  profiles[idx] = updated;
  saveThemeProfiles(profiles);
  return updated;
}

// ---------------------- Default Theme Profile ----------------------
const DEFAULT_PROFILE_KEY = "theme-default-profile-v1";

export function setDefaultThemeProfileId(id: string | null) {
  try {
    if (id) localStorage.setItem(DEFAULT_PROFILE_KEY, id);
    else localStorage.removeItem(DEFAULT_PROFILE_KEY);
  } catch (err) {
    console.warn("Failed to set default theme profile id", err);
  }
}

export function getDefaultThemeProfileId(): string | null {
  try {
    return localStorage.getItem(DEFAULT_PROFILE_KEY);
  } catch (err) {
    return null;
  }
}

// ---------------------- Recent Accent Colors ----------------------
const RECENT_ACCENT_KEY = "theme-recent-accent-colors";

export function getRecentAccentColors(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_ACCENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((c) => typeof c === "string")
      : [];
  } catch (err) {
    return [];
  }
}

export function saveRecentAccentColor(hex: string) {
  try {
    const v = (hex || "").trim().toLowerCase();
    if (!/^#[0-9a-f]{6}$/.test(v)) return;
    const next = [v, ...getRecentAccentColors().filter((c) => c !== v)].slice(
      0,
      8,
    );
    localStorage.setItem(RECENT_ACCENT_KEY, JSON.stringify(next));
  } catch (err) {
    console.warn("Failed to persist recent accent color", err);
  }
}

// ---------------------- Section Defaults (canonical resets) ----------------------
// Each logical settings section maps to a set of canonical preference keys.
// Resets pull values from DEFAULT_PREFS only (never duplicated literals).
export type ThemeSectionId =
  | "appearance"
  | "presets"
  | "colors"
  | "typography"
  | "density"
  | "radius"
  | "shadows"
  | "effects"
  | "components"
  | "motion"
  | "sidebar"
  | "layout"
  | "dashboard"
  | "wallpaper"
  | "accessibility"
  | "direction"
  | "advanced";

const SECTION_KEYS: Record<ThemeSectionId, (keyof ThemePreferences)[]> = {
  appearance: ["themeMode", "themePreset", "customThemeBase"],
  presets: ["themePreset", "colorPreset"],
  colors: ["colorPreset", "accentColor", "primaryColor", "secondaryColor"],
  typography: ["font", "typography"],
  density: ["density"],
  radius: ["borderRadius", "radii"],
  shadows: ["shadowLevel"],
  effects: ["effects"],
  components: ["componentStyles"],
  motion: ["animation"],
  sidebar: ["sidebarStyle", "sidebarState", "navigationMode"],
  layout: ["layout", "contentWidth"],
  dashboard: ["dashboard"],
  wallpaper: ["wallpaper"],
  accessibility: ["accessibility"],
  direction: ["direction"],
  advanced: ["extra"],
};

export function getSectionDefaults(section: ThemeSectionId) {
  const keys = SECTION_KEYS[section] ?? [];
  const patch: Record<string, unknown> = {};
  for (const k of keys) {
    patch[k] = (DEFAULT_PREFS as unknown as Record<string, unknown>)[k];
  }
  return patch as Partial<ThemePreferences>;
}

export function listThemeSections() {
  return Object.keys(SECTION_KEYS) as ThemeSectionId[];
}

// Re-export preset registry helpers for UI consumers.
export { listThemePresets, listAccentPresets, listWallpaperPatterns };
export type { ThemePreset, ThemePalette } from "./presets";
