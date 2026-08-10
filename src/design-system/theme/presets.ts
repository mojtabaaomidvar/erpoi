// ============ THEME PRESET REGISTRY ============
// Single source of truth for full theme presets and accent presets.
// Full theme presets define a complete light + dark palette (neutrals,
// text, accent) so the Theme Engine can render an entire scheme from one
// data-driven definition. Legacy accent presets are preserved here so the
// accent-color picker keeps working with the same ids as before.

export interface ThemePalette {
  background: string;
  surface: string;
  surfaceHover: string;
  border: string;
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
  accent: {
    from: string;
    to: string;
    text: string;
  };
}

export interface ThemePreset {
  id: string;
  name: string;
  light: ThemePalette;
  dark: ThemePalette;
}

export type AccentPreset = {
  from: string;
  to: string;
  text: string;
};

export const THEME_PRESETS: Record<string, ThemePreset> = {
  default: {
    id: "default",
    name: "Default",
    light: {
      background: "#f8fafc",
      surface: "#ffffff",
      surfaceHover: "#f1f5f9",
      border: "#e2e8f0",
      text: { primary: "#0f172a", secondary: "#475569", muted: "#94a3b8" },
      accent: { from: "#6366f1", to: "#8b5cf6", text: "#ffffff" },
    },
    dark: {
      background: "#020617",
      surface: "#0f172a",
      surfaceHover: "#1e293b",
      border: "#334155",
      text: { primary: "#f8fafc", secondary: "#cbd5e1", muted: "#64748b" },
      accent: { from: "#818cf8", to: "#a78bfa", text: "#0f172a" },
    },
  },
  light: {
    id: "light",
    name: "Light",
    light: {
      background: "#f8fafc",
      surface: "#ffffff",
      surfaceHover: "#f1f5f9",
      border: "#e2e8f0",
      text: { primary: "#0f172a", secondary: "#475569", muted: "#94a3b8" },
      accent: { from: "#3b82f6", to: "#60a5fa", text: "#ffffff" },
    },
    dark: {
      background: "#0b1220",
      surface: "#111a2c",
      surfaceHover: "#1b2740",
      border: "#2b3a52",
      text: { primary: "#f1f5f9", secondary: "#b6c2d4", muted: "#6b7a90" },
      accent: { from: "#60a5fa", to: "#93c5fd", text: "#0f172a" },
    },
  },
  dark: {
    id: "dark",
    name: "Dark",
    light: {
      background: "#eef1f5",
      surface: "#f8fafc",
      surfaceHover: "#e2e8f0",
      border: "#cbd5e1",
      text: { primary: "#0f172a", secondary: "#334155", muted: "#64748b" },
      accent: { from: "#334155", to: "#475569", text: "#f8fafc" },
    },
    dark: {
      background: "#020617",
      surface: "#0f172a",
      surfaceHover: "#1e293b",
      border: "#334155",
      text: { primary: "#f8fafc", secondary: "#cbd5e1", muted: "#64748b" },
      accent: { from: "#94a3b8", to: "#cbd5e1", text: "#0f172a" },
    },
  },
  midnight: {
    id: "midnight",
    name: "Midnight",
    light: {
      background: "#eef2f7",
      surface: "#ffffff",
      surfaceHover: "#e2e8f0",
      border: "#cbd5e1",
      text: { primary: "#0f172a", secondary: "#334155", muted: "#64748b" },
      accent: { from: "#1e3a8a", to: "#3b82f6", text: "#ffffff" },
    },
    dark: {
      background: "#0b1220",
      surface: "#0f172a",
      surfaceHover: "#1e293b",
      border: "#27364f",
      text: { primary: "#e6eef8", secondary: "#93a6c4", muted: "#5c6f8f" },
      accent: { from: "#60a5fa", to: "#818cf8", text: "#0b1220" },
    },
  },
  nord: {
    id: "nord",
    name: "Nord",
    light: {
      background: "#eceff4",
      surface: "#ffffff",
      surfaceHover: "#e5e9f0",
      border: "#d8dee9",
      text: { primary: "#2e3440", secondary: "#4c566a", muted: "#8a94a8" },
      accent: { from: "#5e81ac", to: "#81a1c1", text: "#eceff4" },
    },
    dark: {
      background: "#2e3440",
      surface: "#3b4252",
      surfaceHover: "#434c5e",
      border: "#4c566a",
      text: { primary: "#eceff4", secondary: "#d8dee9", muted: "#8a94a8" },
      accent: { from: "#88c0d0", to: "#81a1c1", text: "#2e3440" },
    },
  },
  dracula: {
    id: "dracula",
    name: "Dracula",
    light: {
      background: "#f5f2f7",
      surface: "#ffffff",
      surfaceHover: "#ece5f2",
      border: "#ddd3e6",
      text: { primary: "#282a36", secondary: "#44475a", muted: "#8b8fa8" },
      accent: { from: "#6272a4", to: "#bd93f9", text: "#f8f8f2" },
    },
    dark: {
      background: "#21222c",
      surface: "#282a36",
      surfaceHover: "#343746",
      border: "#44475a",
      text: { primary: "#f8f8f2", secondary: "#c9cbd6", muted: "#8b8fa8" },
      accent: { from: "#bd93f9", to: "#ff79c6", text: "#282a36" },
    },
  },
  solarized: {
    id: "solarized",
    name: "Solarized",
    light: {
      background: "#fdf6e3",
      surface: "#eee8d5",
      surfaceHover: "#e4ddc5",
      border: "#d6ceb8",
      text: { primary: "#073642", secondary: "#586e75", muted: "#93a1a1" },
      accent: { from: "#268bd2", to: "#2aa198", text: "#fdf6e3" },
    },
    dark: {
      background: "#002b36",
      surface: "#073642",
      surfaceHover: "#0d4653",
      border: "#144b58",
      text: { primary: "#eee8d5", secondary: "#93a1a1", muted: "#586e75" },
      accent: { from: "#268bd2", to: "#2aa198", text: "#002b36" },
    },
  },
  gruvbox: {
    id: "gruvbox",
    name: "Gruvbox",
    light: {
      background: "#fbf1c7",
      surface: "#f9f5d7",
      surfaceHover: "#efe4b0",
      border: "#d5c4a1",
      text: { primary: "#3c3836", secondary: "#665c54", muted: "#928374" },
      accent: { from: "#b57614", to: "#d65d0e", text: "#fbf1c7" },
    },
    dark: {
      background: "#282828",
      surface: "#32302f",
      surfaceHover: "#3c3836",
      border: "#504945",
      text: { primary: "#ebdbb2", secondary: "#bdae93", muted: "#928374" },
      accent: { from: "#fb4934", to: "#fabd2f", text: "#282828" },
    },
  },
  monokai: {
    id: "monokai",
    name: "Monokai",
    light: {
      background: "#f3f0ec",
      surface: "#ffffff",
      surfaceHover: "#e8e3dc",
      border: "#d6cfc4",
      text: { primary: "#272822", secondary: "#49483e", muted: "#9a988c" },
      accent: { from: "#f92672", to: "#ae81ff", text: "#f8f8f2" },
    },
    dark: {
      background: "#1f201a",
      surface: "#272822",
      surfaceHover: "#35362e",
      border: "#49483e",
      text: { primary: "#f8f8f2", secondary: "#cfcec2", muted: "#92927e" },
      accent: { from: "#f92672", to: "#fd971f", text: "#272822" },
    },
  },
  "tokyo-night": {
    id: "tokyo-night",
    name: "Tokyo Night",
    light: {
      background: "#eef1f8",
      surface: "#ffffff",
      surfaceHover: "#e2e7f3",
      border: "#cfd6e8",
      text: { primary: "#1a1b26", secondary: "#3b4261", muted: "#7c82a1" },
      accent: { from: "#4c6fc3", to: "#7aa2f7", text: "#ffffff" },
    },
    dark: {
      background: "#16161e",
      surface: "#1a1b26",
      surfaceHover: "#24283b",
      border: "#323a56",
      text: { primary: "#c0caf5", secondary: "#9aa5ce", muted: "#565f89" },
      accent: { from: "#7aa2f7", to: "#bb9af7", text: "#1a1b26" },
    },
  },
  catppuccin: {
    id: "catppuccin",
    name: "Catppuccin",
    light: {
      background: "#eff1f5",
      surface: "#ffffff",
      surfaceHover: "#e6e9ef",
      border: "#dce0e8",
      text: { primary: "#4c4f69", secondary: "#6c6f85", muted: "#9ca0b0" },
      accent: { from: "#1e66f5", to: "#8839ef", text: "#eff1f5" },
    },
    dark: {
      background: "#181825",
      surface: "#1e1e2e",
      surfaceHover: "#313244",
      border: "#45475a",
      text: { primary: "#cdd6f4", secondary: "#a6adc8", muted: "#7f849c" },
      accent: { from: "#89b4fa", to: "#cba6f7", text: "#1e1e2e" },
    },
  },
  github: {
    id: "github",
    name: "GitHub",
    light: {
      background: "#f6f8fa",
      surface: "#ffffff",
      surfaceHover: "#f3f4f6",
      border: "#d0d7de",
      text: { primary: "#1f2328", secondary: "#59636e", muted: "#8c959f" },
      accent: { from: "#0969da", to: "#1f6feb", text: "#ffffff" },
    },
    dark: {
      background: "#0d1117",
      surface: "#161b22",
      surfaceHover: "#21262d",
      border: "#30363d",
      text: { primary: "#f0f6fc", secondary: "#9198a1", muted: "#6e7681" },
      accent: { from: "#4493f8", to: "#58a6ff", text: "#0d1117" },
    },
  },
  material: {
    id: "material",
    name: "Material",
    light: {
      background: "#fafafa",
      surface: "#ffffff",
      surfaceHover: "#f5f5f5",
      border: "#e0e0e0",
      text: { primary: "#212121", secondary: "#616161", muted: "#9e9e9e" },
      accent: { from: "#6200ea", to: "#7c4dff", text: "#ffffff" },
    },
    dark: {
      background: "#121212",
      surface: "#1e1e1e",
      surfaceHover: "#2a2a2a",
      border: "#383838",
      text: { primary: "#ffffff", secondary: "#b3b3b3", muted: "#808080" },
      accent: { from: "#bb86fc", to: "#ce93d8", text: "#121212" },
    },
  },
  corporate: {
    id: "corporate",
    name: "Corporate",
    light: {
      background: "#f7f9fb",
      surface: "#ffffff",
      surfaceHover: "#eef2f6",
      border: "#dbe2ea",
      text: { primary: "#12213a", secondary: "#43536b", muted: "#7c8aa0" },
      accent: { from: "#0e7490", to: "#06b6d4", text: "#ffffff" },
    },
    dark: {
      background: "#0c1524",
      surface: "#111c2e",
      surfaceHover: "#1a2a40",
      border: "#2a3c58",
      text: { primary: "#e8eef7", secondary: "#aab8cc", muted: "#64748b" },
      accent: { from: "#22d3ee", to: "#67e8f9", text: "#0c1524" },
    },
  },
  cyberpunk: {
    id: "cyberpunk",
    name: "Cyberpunk",
    light: {
      background: "#f5efff",
      surface: "#ffffff",
      surfaceHover: "#ece2ff",
      border: "#d8c9f5",
      text: { primary: "#1a0b2e", secondary: "#4b2e6e", muted: "#8a6fb0" },
      accent: { from: "#ff2a6d", to: "#05d9e8", text: "#f5efff" },
    },
    dark: {
      background: "#0d0221",
      surface: "#1a0b2e",
      surfaceHover: "#2b1452",
      border: "#3b1f6e",
      text: { primary: "#f0f6ff", secondary: "#c4b5fd", muted: "#7a6ba8" },
      accent: { from: "#ff2a6d", to: "#05d9e8", text: "#0d0221" },
    },
  },
  ocean: {
    id: "ocean",
    name: "Ocean",
    light: {
      background: "#f0f9ff",
      surface: "#ffffff",
      surfaceHover: "#e0f2fe",
      border: "#bae6fd",
      text: { primary: "#0c4a6e", secondary: "#0369a1", muted: "#7dd3fc" },
      accent: { from: "#0284c7", to: "#06b6d4", text: "#ffffff" },
    },
    dark: {
      background: "#082f49",
      surface: "#0c4a6e",
      surfaceHover: "#075985",
      border: "#0e7490",
      text: { primary: "#f0f9ff", secondary: "#bae6fd", muted: "#38bdf8" },
      accent: { from: "#38bdf8", to: "#22d3ee", text: "#082f49" },
    },
  },
};

// Legacy accent presets (kept with identical ids for backward compatibility).
// These drive the accent color picker; full palettes come from THEME_PRESETS.
export const ACCENT_PRESETS: Record<string, AccentPreset> = {
  default: { from: "#6366f1", to: "#8b5cf6", text: "#ffffff" },
  lavender: { from: "#7c3aed", to: "#c4b5fd", text: "#ffffff" },
  ocean: { from: "#0ea5a4", to: "#06b6d4", text: "#ffffff" },
  sunset: { from: "#fb7185", to: "#f59e0b", text: "#ffffff" },
  forest: { from: "#059669", to: "#10b981", text: "#ffffff" },
  dracula: { from: "#ff6e6e", to: "#7c3aed", text: "#f8fafc" },
  nord: { from: "#88c0d0", to: "#81a1c1", text: "#2e3440" },
  solarized: { from: "#268bd2", to: "#2aa198", text: "#002b36" },
  gruvbox: { from: "#fb4934", to: "#fabd2f", text: "#282828" },
  monokai: { from: "#f92672", to: "#fd971f", text: "#272822" },
  light: { from: "#3b82f6", to: "#60a5fa", text: "#ffffff" },
  dark: { from: "#111827", to: "#374151", text: "#e5e7eb" },
  midnight: { from: "#0f172a", to: "#0b1220", text: "#e6eef8" },
  "tokyo-night": { from: "#7aa2f7", to: "#2a2b5a", text: "#ffffff" },
  catppuccin: { from: "#f5c2e7", to: "#c6a0f6", text: "#1e1e2e" },
  github: { from: "#0366d6", to: "#032f62", text: "#ffffff" },
  material: { from: "#6200ea", to: "#3700b3", text: "#ffffff" },
  oneDark: { from: "#61afef", to: "#98c379", text: "#282c34" },
  corporate: { from: "#0ea5a4", to: "#06b6d4", text: "#ffffff" },
  cyberpunk: { from: "#ff6ec7", to: "#00f5ff", text: "#0f172a" },
};

// Wallpaper pattern registry: name -> CSS background-image value.
// Patterns are lightweight CSS-only repeats (no binary data stored in prefs).
export const WALLPAPER_PATTERNS: Record<string, { name: string; css: string }> =
  {
    none: { name: "None", css: "none" },
    dots: {
      name: "Dots",
      css: "radial-gradient(circle, var(--color-border) 1px, transparent 1px)",
    },
    grid: {
      name: "Grid",
      css: "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
    },
    stripes: {
      name: "Stripes",
      css: "repeating-linear-gradient(45deg, var(--color-border) 0 1px, transparent 1px 12px)",
    },
    diagonal: {
      name: "Diagonal",
      css: "repeating-linear-gradient(-45deg, var(--color-surface-hover) 0 1px, transparent 1px 14px)",
    },
  };

export function listThemePresets(): ThemePreset[] {
  return Object.keys(THEME_PRESETS).map((k) => THEME_PRESETS[k]);
}

export function listAccentPresets(): AccentPreset[] {
  return Object.keys(ACCENT_PRESETS).map((k) => ({
    id: k,
    ...ACCENT_PRESETS[k],
  }));
}

export function listWallpaperPatterns() {
  return Object.keys(WALLPAPER_PATTERNS).map((k) => ({
    id: k,
    name: WALLPAPER_PATTERNS[k].name,
  }));
}
