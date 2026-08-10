// src/features/theme/ui/ThemeSettingsModal.tsx
// Enterprise Theme Manager: full settings UI wired to the canonical theme
// engine. All controls write ThemePreferences patches through the app-level
// ThemeProvider (single source of truth). Colors/layout use design-system CSS
// variables so the modal itself live-previews the active theme.
import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "@app/providers/ThemeProvider";
import type { ThemePreferences } from "@features/theme/domain/ThemePreferences";
import { defaultThemePreferences as DEFAULTS } from "@features/theme/domain/ThemePreferences";
import {
  listThemePresets,
  listColorPresets,
  listWallpaperPatterns,
  importThemeFromJson,
  getThemeProfiles,
  addThemeProfile,
  removeThemeProfile,
  duplicateThemeProfile,
  renameThemeProfile,
  exportThemeProfileToJson,
  importThemeProfileFromJson,
  getActiveThemeProfileId,
  setActiveThemeProfileId,
  getDefaultThemeProfileId,
  setDefaultThemeProfileId,
  getRecentAccentColors,
  saveRecentAccentColor,
  getSectionDefaults,
} from "@design-system/theme/engine";
import type {
  ThemeSectionId,
  ThemeProfile,
  ThemePreset,
} from "@design-system/theme/engine";

// ---------------------------------------------------------------------------
// Section registry (id + label + search keywords)
// ---------------------------------------------------------------------------
interface SectionDef {
  id: ThemeSectionId;
  label: string;
  keywords: string;
}

const SECTIONS: SectionDef[] = [
  {
    id: "appearance",
    label: "Appearance",
    keywords: "mode light dark system custom auto",
  },
  {
    id: "presets",
    label: "Theme Presets",
    keywords: "preset nord dracula solarized midnight tokyo catppuccin",
  },
  {
    id: "colors",
    label: "Colors",
    keywords: "accent color preset hex recent custom",
  },
  {
    id: "typography",
    label: "Typography",
    keywords: "font family base size heading weight letter spacing line height",
  },
  {
    id: "density",
    label: "Density & Spacing",
    keywords: "density compact normal comfortable large spacing",
  },
  {
    id: "radius",
    label: "Borders & Radius",
    keywords: "radius rounded border corners",
  },
  { id: "shadows", label: "Shadows", keywords: "shadow elevation depth" },
  {
    id: "effects",
    label: "Effects",
    keywords: "blur glass transparency translucent",
  },
  {
    id: "components",
    label: "Components",
    keywords: "button input card checkbox switch scrollbar table",
  },
  {
    id: "motion",
    label: "Motion",
    keywords: "animation speed reduce motion transitions",
  },
  {
    id: "sidebar",
    label: "Sidebar & Navigation",
    keywords: "sidebar nav topbar bottom mixed floating overlay",
  },
  {
    id: "layout",
    label: "Layout",
    keywords: "content width fluid boxed wide ultra layout",
  },
  {
    id: "dashboard",
    label: "Dashboard",
    keywords: "grid cards widgets kanban columns gap",
  },
  {
    id: "wallpaper",
    label: "Wallpaper",
    keywords: "background image gradient pattern opacity",
  },
  {
    id: "accessibility",
    label: "Accessibility",
    keywords: "contrast cursor colorblind focus reduce motion",
  },
  {
    id: "direction",
    label: "Direction",
    keywords: "rtl ltr auto direction locale",
  },
  {
    id: "advanced",
    label: "Advanced",
    keywords: "import export profile reset json",
  },
];

const SECTION_LABEL: Record<string, string> = Object.fromEntries(
  SECTIONS.map((s) => [s.id, s.label]),
);

// ---------------------------------------------------------------------------
// Small presentational controls (pure UI, no business logic)
// ---------------------------------------------------------------------------
function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  size = "md",
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label?: string;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-sm text-[var(--color-text-primary)]">
          {label}
        </span>
      )}
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-[var(--radius-button)] border transition-colors ${
              value === o.value
                ? "ring-2 ring-[var(--color-accent-from)] border-[var(--color-accent-from)] bg-[var(--color-selection)] text-[var(--color-text-primary)]"
                : "border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]"
            } ${size === "sm" ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-sm"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-1.5 cursor-pointer">
      <span className="flex flex-col">
        <span className="text-sm text-[var(--color-text-primary)]">
          {label}
        </span>
        {hint && (
          <span className="text-xs text-[var(--color-text-muted)]">{hint}</span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-[var(--color-accent-from)]" : "bg-[var(--color-border)]"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </label>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 py-1">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--color-text-primary)]">
          {label}
        </span>
        <span className="text-xs text-[var(--color-text-secondary)]">
          {display ?? value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--color-accent-from)]"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 py-1">
      <span className="text-sm text-[var(--color-text-primary)]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 text-sm rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:border-[var(--color-accent-from)] focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SectionBlock({
  title,
  onReset,
  children,
}: {
  title: string;
  onReset?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="p-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
          {title}
        </h4>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs px-2 py-1 rounded-[var(--radius-button)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent-from)] hover:text-[var(--color-accent-from)]"
          >
            Reset section
          </button>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function ThemeSettingsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const {
    themePreferences,
    setThemePreferences,
    setThemeMode,
    saveToProfile,
    savingRemote,
    savePreferenceToProfile,
  } = useTheme();

  const [prefs, setPrefs] = useState<ThemePreferences>(
    themePreferences ?? (DEFAULTS as ThemePreferences),
  );

  useEffect(() => {
    setPrefs(themePreferences);
  }, [themePreferences]);

  const [activeSection, setActiveSection] =
    useState<ThemeSectionId>("appearance");
  const [search, setSearch] = useState("");

  // Profiles management
  const [profiles, setProfiles] = useState<ThemeProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(
    getActiveThemeProfileId(),
  );
  const [defaultProfileId, setDefaultProfileId] = useState<string | null>(
    getDefaultThemeProfileId(),
  );
  const [recentColors, setRecentColors] = useState<string[]>(
    getRecentAccentColors(),
  );
  const [importError, setImportError] = useState<string | null>(null);

  const themePresets = useMemo(() => listThemePresets(), []);
  const accentPresets = useMemo(() => listColorPresets(), []);
  const wallpaperPatterns = useMemo(() => listWallpaperPatterns(), []);

  useEffect(() => {
    try {
      const p = getThemeProfiles();
      setProfiles(p);
      const a = getActiveThemeProfileId();
      setActiveProfileId(a);
      if (a) {
        const act = p.find((x) => x.id === a);
        if (act) {
          setPrefs(act.prefs);
          setThemePreferences(act.prefs);
        }
      }
      setDefaultProfileId(getDefaultThemeProfileId());
    } catch (err) {
      console.warn("Failed to load theme profiles", err);
    }
  }, []);

  // Keep profiles in sync with storage events from other tabs
  useEffect(() => {
    const onStorage = () => {
      try {
        setProfiles(getThemeProfiles());
        setActiveProfileId(getActiveThemeProfileId());
        setDefaultProfileId(getDefaultThemeProfileId());
        setRecentColors(getRecentAccentColors());
      } catch {
        // noop
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!isOpen) return null;

  // Apply a shallow top-level patch: update local UI state and notify the
  // provider (which persists + re-applies CSS variables).
  const setPref = (patch: Partial<ThemePreferences>) => {
    const next = { ...prefs, ...patch } as ThemePreferences;
    setPrefs(next);
    setThemePreferences(patch);
    if (patch.themeMode) setThemeMode(patch.themeMode as any);
  };

  // Canonical section reset (defaults come from the engine registry).
  const resetSection = (id: ThemeSectionId) => {
    const patch = getSectionDefaults(id);
    setPref(patch);
  };

  const resetAll = () => {
    setPrefs(DEFAULTS as ThemePreferences);
    setThemePreferences(DEFAULTS as ThemePreferences);
  };

  const pickAccent = (hex: string) => {
    const v = hex.trim();
    if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) return;
    setPref({ colorPreset: v });
    saveRecentAccentColor(v);
    setRecentColors(getRecentAccentColors());
  };

  // ---------- profile operations (reuse engine persistence) ----------
  const handleCreateProfile = () => {
    const name = prompt("Profile name:");
    if (!name) return;
    const profile = addThemeProfile(name, prefs);
    setProfiles(getThemeProfiles());
    setActiveProfileId(profile.id);
    setActiveThemeProfileId(profile.id);
    setThemePreferences(profile.prefs);
  };

  const handleSelectProfile = (id: string) => {
    const p = profiles.find((x) => x.id === id);
    if (!p) return;
    setPrefs(p.prefs);
    setThemePreferences(p.prefs);
    setActiveProfileId(id);
    setActiveThemeProfileId(id);
  };

  const handleRenameProfile = (id: string) => {
    const p = profiles.find((x) => x.id === id);
    if (!p) return;
    const name = prompt("Rename profile:", p.name);
    if (!name || name === p.name) return;
    renameThemeProfile(id, name);
    setProfiles(getThemeProfiles());
  };

  const handleDeleteProfile = (id: string) => {
    if (!confirm("Delete profile?")) return;
    removeThemeProfile(id);
    setProfiles(getThemeProfiles());
    if (activeProfileId === id) {
      setActiveProfileId(null);
      setActiveThemeProfileId(null);
    }
    if (defaultProfileId === id) {
      setDefaultProfileId(null);
      setDefaultThemeProfileId(null);
    }
  };

  const handleDuplicateProfile = (id: string) => {
    const dup = duplicateThemeProfile(id);
    if (!dup) return;
    setProfiles(getThemeProfiles());
    setActiveProfileId(dup.id);
    setActiveThemeProfileId(dup.id);
    setPrefs(dup.prefs);
    setThemePreferences(dup.prefs);
  };

  const handleToggleDefaultProfile = (id: string) => {
    const next = defaultProfileId === id ? null : id;
    setDefaultProfileId(next);
    setDefaultThemeProfileId(next);
  };

  const handleExportProfile = (id: string) => {
    const json = exportThemeProfileToJson(id);
    if (!json) return alert("Profile not found");
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `theme-profile-${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportProfile = async (file?: File) => {
    try {
      setImportError(null);
      if (!file) {
        const input = document.getElementById(
          "profile-import-input",
        ) as HTMLInputElement | null;
        input?.click();
        return;
      }
      const raw = await file.text();
      const res = importThemeProfileFromJson(raw);
      if (!res.ok) {
        const msg = Array.isArray(res.errors)
          ? res.errors.join("\n")
          : String(res.errors || "Unknown error");
        console.warn("Invalid profile JSON:\n", res.errors);
        setImportError(msg);
        return;
      }
      setProfiles(getThemeProfiles());
      const np = res.profile;
      if (np) {
        setActiveProfileId(np.id);
        setActiveThemeProfileId(np.id);
        setThemePreferences(np.prefs);
        setPrefs(np.prefs);
      }
    } catch (err: any) {
      console.warn("Failed to import profile", err);
      setImportError(String(err));
    }
  };

  const handleExport = () => {
    try {
      const json = import.meta.env?.DEV
        ? JSON.stringify(prefs, null, 2)
        : JSON.stringify(prefs);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `theme-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn("Failed to export theme", err);
    }
  };

  const handleImport = async (file?: File) => {
    try {
      setImportError(null);
      let raw = "";
      if (!file) {
        const input = document.getElementById(
          "theme-import-input",
        ) as HTMLInputElement | null;
        input?.click();
        return;
      }
      raw = await file.text();
      const res = importThemeFromJson(raw as any);
      if (!res.ok) {
        const msg = Array.isArray(res.errors)
          ? res.errors.join("\n")
          : String(res.errors || "Unknown error");
        console.warn("Theme import validation failed:", res.errors);
        setImportError(msg);
        return;
      }
      const merged = { ...DEFAULTS, ...res.prefs } as ThemePreferences;
      setPrefs(merged);
      setThemePreferences(merged);
    } catch (err) {
      console.warn("Failed to import theme", err);
      setImportError(String(err));
    }
  };

  // ---------- filtered sections (search) ----------
  const query = search.trim().toLowerCase();
  const visibleSections = query
    ? SECTIONS.filter(
        (s) =>
          s.label.toLowerCase().includes(query) ||
          s.keywords.toLowerCase().includes(query),
      )
    : SECTIONS;

  const dir = prefs.direction ?? "ltr";
  const sideClass = dir === "rtl" ? "right-0" : "left-0";
  const T = (id: ThemeSectionId) => SECTION_LABEL[id] ?? id;

  return (
    <div
      className={`fixed top-0 ${sideClass} z-50 h-full w-full max-w-[1200px] p-4 lg:p-6`}
    >
      <div className="h-full flex flex-col rounded-2xl shadow-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-hover)]">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
              Theme Manager
            </h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              Live preview · changes apply instantly
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="search"
              placeholder="Search settings…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-52 px-3 py-1.5 text-sm rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]"
            />
            <button
              onClick={resetAll}
              className="px-3 py-1.5 rounded-[var(--radius-button)] text-sm bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300"
            >
              Reset all
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-[var(--radius-button)] text-sm bg-[var(--color-accent-from)] text-[var(--color-accent-text)]"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Left navigation */}
          <aside className="w-60 shrink-0 border-r border-[var(--color-border)] overflow-y-auto p-3">
            <nav className="flex flex-col gap-1">
              {visibleSections.length === 0 && (
                <div className="text-sm text-[var(--color-text-muted)] p-2">
                  No matching settings
                </div>
              )}
              {visibleSections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`text-left px-3 py-2 rounded-[var(--radius-button)] text-sm transition-colors ${
                    activeSection === s.id
                      ? "bg-[var(--color-selection)] ring-1 ring-[var(--color-accent-from)] text-[var(--color-text-primary)]"
                      : "hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </nav>

            {/* Profiles */}
            <div className="mt-5 border-t border-[var(--color-border)] pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Profiles
                </div>
                <button
                  onClick={handleCreateProfile}
                  className="text-xs px-2 py-1 rounded-[var(--radius-button)] border border-[var(--color-border)] text-[var(--color-text-secondary)]"
                >
                  New
                </button>
              </div>
              <div className="flex flex-col gap-1.5 max-h-[240px] overflow-auto pr-1">
                {profiles.length === 0 && (
                  <div className="text-xs text-[var(--color-text-muted)] px-1">
                    No saved profiles yet.
                  </div>
                )}
                {profiles.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-1 rounded-[var(--radius-button)] border border-transparent hover:border-[var(--color-border)]"
                  >
                    <button
                      onClick={() => handleSelectProfile(p.id)}
                      title={
                        defaultProfileId === p.id ? "Default profile" : p.name
                      }
                      className={`flex-1 text-left truncate px-2 py-1.5 rounded-[var(--radius-button)] text-sm ${
                        activeProfileId === p.id
                          ? "ring-1 ring-[var(--color-accent-from)] bg-[var(--color-selection)] text-[var(--color-text-primary)]"
                          : "hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]"
                      }`}
                    >
                      {defaultProfileId === p.id ? "★ " : ""}
                      {p.name}
                    </button>
                    <div className="flex gap-0.5 shrink-0">
                      <button
                        title="Set/unset default"
                        onClick={() => handleToggleDefaultProfile(p.id)}
                        className="px-1.5 py-1 rounded text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                      >
                        ★
                      </button>
                      <button
                        title="Rename"
                        onClick={() => handleRenameProfile(p.id)}
                        className="px-1.5 py-1 rounded text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                      >
                        ✎
                      </button>
                      <button
                        title="Duplicate"
                        onClick={() => handleDuplicateProfile(p.id)}
                        className="px-1.5 py-1 rounded text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                      >
                        ⧉
                      </button>
                      <button
                        title="Export"
                        onClick={() => handleExportProfile(p.id)}
                        className="px-1.5 py-1 rounded text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                      >
                        ⇩
                      </button>
                      <button
                        title="Delete"
                        onClick={() => handleDeleteProfile(p.id)}
                        className="px-1.5 py-1 rounded text-xs text-[var(--color-text-muted)] hover:text-rose-500"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-1 mt-3">
                <input
                  id="profile-import-input"
                  type="file"
                  accept="application/json"
                  className="text-xs"
                  onChange={(e) =>
                    e.target.files?.[0] &&
                    handleImportProfile(e.target.files[0])
                  }
                />
                {importError && (
                  <div className="text-xs text-rose-500">{importError}</div>
                )}
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 overflow-y-auto p-4 lg:p-5">
            <div className="max-w-3xl space-y-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {T(activeSection)}
                </h3>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                    <input
                      type="checkbox"
                      checked={savePreferenceToProfile}
                      onChange={(e) => saveToProfile(e.target.checked)}
                      className="accent-[var(--color-accent-from)]"
                    />
                    <span>Sync to remote</span>
                  </label>
                  {savingRemote && (
                    <span className="text-xs text-[var(--color-text-muted)]">
                      Saving…
                    </span>
                  )}
                  <button
                    onClick={handleExport}
                    className="px-3 py-1.5 rounded-[var(--radius-button)] border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)]"
                  >
                    Export
                  </button>
                  <button
                    onClick={() =>
                      document.getElementById("theme-import-input")?.click()
                    }
                    className="px-3 py-1.5 rounded-[var(--radius-button)] border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)]"
                  >
                    Import
                  </button>
                </div>
              </div>

              {/* ================= APPEARANCE ================= */}
              {activeSection === "appearance" && (
                <SectionBlock
                  title="Appearance"
                  onReset={() => resetSection("appearance")}
                >
                  <Segmented
                    label="Theme mode"
                    value={prefs.themeMode ?? "system"}
                    options={[
                      { value: "system", label: "System" },
                      { value: "light", label: "Light" },
                      { value: "dark", label: "Dark" },
                      { value: "custom", label: "Custom" },
                    ]}
                    onChange={(v) =>
                      setPref({ themeMode: v as ThemePreferences["themeMode"] })
                    }
                  />
                  {prefs.themeMode === "custom" && (
                    <Segmented
                      label="Custom base (keeps your palette, switches neutrals)"
                      value={prefs.customThemeBase ?? "light"}
                      options={[
                        { value: "light", label: "Light" },
                        { value: "dark", label: "Dark" },
                      ]}
                      onChange={(v) =>
                        setPref({ customThemeBase: v as "light" | "dark" })
                      }
                    />
                  )}
                  <Segmented
                    label="Active theme preset"
                    value={prefs.themePreset ?? "default"}
                    options={themePresets.map((p) => ({
                      value: p.id,
                      label: p.name,
                    }))}
                    onChange={(v) => setPref({ themePreset: v })}
                  />
                  <p className="text-xs text-[var(--color-text-muted)]">
                    System follows your OS/browser preference. Custom keeps your
                    chosen palette and only switches the neutral base.
                  </p>
                </SectionBlock>
              )}

              {activeSection === "colors" && (
                <SectionBlock
                  title="Colors"
                  onReset={() => resetSection("colors")}
                >
                  <div className="flex flex-wrap gap-2.5">
                    {accentPresets.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        title={p.id}
                        onClick={() => setPref({ colorPreset: p.id })}
                        className={`w-12 h-10 rounded-[var(--radius-button)] border flex items-center justify-center ${
                          prefs.colorPreset === p.id
                            ? "ring-2 ring-[var(--color-accent-from)]"
                            : "border-[var(--color-border)]"
                        }`}
                        style={{
                          background: `linear-gradient(90deg, ${p.from}, ${p.to})`,
                        }}
                      >
                        {prefs.colorPreset === p.id && (
                          <span className="text-xs" style={{ color: p.text }}>
                            ✓
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-end gap-3">
                    <div>
                      <div className="mb-1 text-sm text-[var(--color-text-primary)]">
                        Custom color
                      </div>
                      <input
                        type="color"
                        value={
                          typeof prefs.colorPreset === "string" &&
                          prefs.colorPreset.startsWith("#")
                            ? prefs.colorPreset
                            : "#6366f1"
                        }
                        onChange={(e) => pickAccent(e.target.value)}
                        className="w-14 h-10 rounded-[var(--radius-button)] border border-[var(--color-border)] cursor-pointer"
                      />
                    </div>
                    <div className="flex-1 min-w-[160px]">
                      <input
                        type="text"
                        placeholder="#rrggbb"
                        className="w-full p-2 rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] text-sm"
                        value={
                          typeof prefs.colorPreset === "string" &&
                          prefs.colorPreset.startsWith("#")
                            ? prefs.colorPreset
                            : ""
                        }
                        onChange={(e) => pickAccent(e.target.value)}
                      />
                    </div>
                  </div>

                  {recentColors.length > 0 && (
                    <div>
                      <div className="mb-1 text-sm text-[var(--color-text-primary)]">
                        Recent
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentColors.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => pickAccent(c)}
                            className="w-8 h-8 rounded-full border border-[var(--color-border)]"
                            style={{ background: c }}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </SectionBlock>
              )}

              {activeSection === "typography" && (
                <SectionBlock
                  title="Typography"
                  onReset={() => resetSection("typography")}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <SelectField
                      label="Font family"
                      value={
                        typeof prefs.font === "string" ? prefs.font : "auto"
                      }
                      options={[
                        { value: "auto", label: "System (auto)" },
                        { value: "sans", label: "Sans" },
                        { value: "serif", label: "Serif" },
                        { value: "Inter", label: "Inter" },
                        { value: "Roboto", label: "Roboto" },
                        { value: "Vazirmatn", label: "Vazirmatn" },
                        { value: "IRANSansX", label: "IRANSansX" },
                        { value: "Yekan Bakh", label: "Yekan Bakh" },
                        { value: "Dana", label: "Dana" },
                        { value: "Shabnam", label: "Shabnam" },
                        { value: "Tahoma", label: "Tahoma" },
                        { value: "mono", label: "Monospace" },
                      ]}
                      onChange={(v) => setPref({ font: v })}
                    />
                    <SelectField
                      label="Base size"
                      value={prefs.typography?.baseSize ?? "1rem"}
                      options={[
                        { value: "0.875rem", label: "14px" },
                        { value: "1rem", label: "16px" },
                        { value: "1.125rem", label: "18px" },
                      ]}
                      onChange={(v) =>
                        setPref({
                          typography: {
                            ...(prefs.typography || {}),
                            baseSize: v,
                          },
                        })
                      }
                    />
                    <SelectField
                      label="Font weight"
                      value={prefs.typography?.fontWeight ?? "400"}
                      options={[
                        { value: "300", label: "Light (300)" },
                        { value: "400", label: "Normal (400)" },
                        { value: "500", label: "Medium (500)" },
                        { value: "600", label: "Semibold (600)" },
                        { value: "700", label: "Bold (700)" },
                      ]}
                      onChange={(v) =>
                        setPref({
                          typography: {
                            ...(prefs.typography || {}),
                            fontWeight: v,
                          },
                        })
                      }
                    />
                    <SelectField
                      label="Letter spacing"
                      value={prefs.typography?.letterSpacing ?? "normal"}
                      options={[
                        { value: "-0.02em", label: "Tight" },
                        { value: "normal", label: "Normal" },
                        { value: "0.02em", label: "Wide" },
                        { value: "0.05em", label: "Extra wide" },
                      ]}
                      onChange={(v) =>
                        setPref({
                          typography: {
                            ...(prefs.typography || {}),
                            letterSpacing: v,
                          },
                        })
                      }
                    />
                    <SelectField
                      label="Line height"
                      value={prefs.typography?.lineHeight ?? "1.5"}
                      options={[
                        { value: "1.2", label: "Tight (1.2)" },
                        { value: "1.5", label: "Normal (1.5)" },
                        { value: "1.75", label: "Relaxed (1.75)" },
                      ]}
                      onChange={(v) =>
                        setPref({
                          typography: {
                            ...(prefs.typography || {}),
                            lineHeight: v,
                          },
                        })
                      }
                    />
                  </div>
                  <SliderField
                    label="Heading scale"
                    value={prefs.typography?.headingScale ?? 1.25}
                    min={1}
                    max={1.8}
                    step={0.05}
                    onChange={(v) =>
                      setPref({
                        typography: {
                          ...(prefs.typography || {}),
                          headingScale: v,
                        },
                      })
                    }
                    display={`${(prefs.typography?.headingScale ?? 1.25).toFixed(2)}×`}
                  />
                </SectionBlock>
              )}

              {activeSection === "density" && (
                <SectionBlock
                  title="Density & Spacing"
                  onReset={() => resetSection("density")}
                >
                  <Segmented
                    label="UI density"
                    value={prefs.density ?? "default"}
                    options={[
                      { value: "compact", label: "Compact" },
                      { value: "default", label: "Normal" },
                      { value: "comfortable", label: "Comfortable" },
                      { value: "super", label: "Large" },
                    ]}
                    onChange={(v) =>
                      setPref({ density: v as ThemePreferences["density"] })
                    }
                  />
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Scales spacing and component padding tokens (--spacing-*,
                    --density-*) used by cards, tables, forms and toolbars.
                  </p>
                </SectionBlock>
              )}

              {activeSection === "radius" && (
                <SectionBlock
                  title="Borders & Radius"
                  onReset={() => resetSection("radius")}
                >
                  <Segmented
                    label="Global radius"
                    value={String(prefs.borderRadius ?? 0.75)}
                    options={[
                      { value: "0", label: "0" },
                      { value: "0.3", label: "0.3" },
                      { value: "0.5", label: "0.5" },
                      { value: "0.75", label: "0.75" },
                      { value: "1", label: "1" },
                    ]}
                    onChange={(v) => setPref({ borderRadius: Number(v) })}
                  />
                  <div className="flex flex-col gap-2">
                    {(
                      [
                        ["button", "Button"],
                        ["input", "Input"],
                        ["card", "Card"],
                        ["dialog", "Dialog"],
                        ["table", "Table"],
                      ] as const
                    ).map(([key, label]) => (
                      <SelectField
                        key={key}
                        label={`${label} radius`}
                        value={prefs.radii?.[key] ?? ""}
                        options={[
                          { value: "", label: "Inherit global" },
                          { value: "0px", label: "None" },
                          { value: "0.25rem", label: "Small" },
                          { value: "0.375rem", label: "Medium" },
                          { value: "0.5rem", label: "Large" },
                          { value: "0.75rem", label: "X-Large" },
                          { value: "1rem", label: "2X" },
                          { value: "9999px", label: "Full" },
                        ]}
                        onChange={(v) =>
                          setPref({
                            radii: {
                              ...(prefs.radii || {}),
                              [key]: v || undefined,
                            },
                          })
                        }
                      />
                    ))}
                  </div>
                </SectionBlock>
              )}

              {activeSection === "components" && (
                <SectionBlock
                  title="Components"
                  onReset={() => resetSection("components")}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Segmented
                      label="Buttons"
                      value={prefs.componentStyles?.button ?? "rounded"}
                      options={[
                        { value: "square", label: "Square" },
                        { value: "rounded", label: "Rounded" },
                        { value: "pill", label: "Pill" },
                        { value: "minimal", label: "Minimal" },
                      ]}
                      onChange={(v) =>
                        setPref({
                          componentStyles: {
                            ...(prefs.componentStyles || {}),
                            button: v,
                          },
                        })
                      }
                    />
                    <Segmented
                      label="Inputs"
                      value={prefs.componentStyles?.input ?? "outlined"}
                      options={[
                        { value: "outlined", label: "Outlined" },
                        { value: "filled", label: "Filled" },
                        { value: "underlined", label: "Underlined" },
                        { value: "rounded", label: "Rounded" },
                      ]}
                      onChange={(v) =>
                        setPref({
                          componentStyles: {
                            ...(prefs.componentStyles || {}),
                            input: v,
                          },
                        })
                      }
                    />
                    <Segmented
                      label="Cards"
                      value={prefs.componentStyles?.card ?? "elevated"}
                      options={[
                        { value: "flat", label: "Flat" },
                        { value: "bordered", label: "Bordered" },
                        { value: "elevated", label: "Elevated" },
                        { value: "glass", label: "Glass" },
                      ]}
                      onChange={(v) =>
                        setPref({
                          componentStyles: {
                            ...(prefs.componentStyles || {}),
                            card: v,
                          },
                        })
                      }
                    />
                    <Segmented
                      label="Checkboxes"
                      value={prefs.componentStyles?.checkbox ?? "default"}
                      options={[
                        { value: "default", label: "Default" },
                        { value: "square", label: "Square" },
                        { value: "round", label: "Round" },
                      ]}
                      onChange={(v) =>
                        setPref({
                          componentStyles: {
                            ...(prefs.componentStyles || {}),
                            checkbox: v,
                          },
                        })
                      }
                    />
                    <Segmented
                      label="Switches"
                      value={prefs.componentStyles?.switch ?? "default"}
                      options={[
                        { value: "default", label: "Default" },
                        { value: "round", label: "Round" },
                      ]}
                      onChange={(v) =>
                        setPref({
                          componentStyles: {
                            ...(prefs.componentStyles || {}),
                            switch: v,
                          },
                        })
                      }
                    />
                    <Segmented
                      label="Tables"
                      value={prefs.componentStyles?.table ?? "default"}
                      options={[
                        { value: "default", label: "Default" },
                        { value: "compact", label: "Compact" },
                      ]}
                      onChange={(v) =>
                        setPref({
                          componentStyles: {
                            ...(prefs.componentStyles || {}),
                            table: v,
                          },
                        })
                      }
                    />
                    <Segmented
                      label="Scrollbar"
                      value={prefs.componentStyles?.scrollbar ?? "default"}
                      options={[
                        { value: "default", label: "Default" },
                        { value: "thin", label: "Thin" },
                        { value: "auto", label: "Auto" },
                      ]}
                      onChange={(v) =>
                        setPref({
                          componentStyles: {
                            ...(prefs.componentStyles || {}),
                            scrollbar: v,
                          },
                        })
                      }
                    />
                  </div>
                </SectionBlock>
              )}

              {activeSection === "layout" && (
                <SectionBlock
                  title="Layout"
                  onReset={() => resetSection("layout")}
                >
                  <Segmented
                    label="Content width"
                    value={prefs.contentWidth ?? "fluid"}
                    options={[
                      { value: "fluid", label: "Fluid" },
                      { value: "boxed", label: "Boxed" },
                      { value: "wide", label: "Wide" },
                      { value: "ultra", label: "Ultra wide" },
                    ]}
                    onChange={(v) =>
                      setPref({
                        contentWidth: v as ThemePreferences["contentWidth"],
                      })
                    }
                  />
                  <Segmented
                    label="Layout mode"
                    value={prefs.layout ?? "default"}
                    options={[
                      { value: "default", label: "Default" },
                      { value: "compact", label: "Compact" },
                      { value: "full", label: "Full" },
                    ]}
                    onChange={(v) =>
                      setPref({ layout: v as ThemePreferences["layout"] })
                    }
                  />
                </SectionBlock>
              )}

              {activeSection === "accessibility" && (
                <SectionBlock
                  title="Accessibility"
                  onReset={() => resetSection("accessibility")}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Toggle
                      label="Reduce motion"
                      checked={prefs.accessibility?.reduceMotion ?? false}
                      onChange={(v) =>
                        setPref({
                          accessibility: {
                            ...(prefs.accessibility || {}),
                            reduceMotion: v,
                          },
                        })
                      }
                    />
                    <Toggle
                      label="High contrast"
                      checked={prefs.accessibility?.highContrast ?? false}
                      onChange={(v) =>
                        setPref({
                          accessibility: {
                            ...(prefs.accessibility || {}),
                            highContrast: v,
                          },
                        })
                      }
                    />
                    <Toggle
                      label="Focus highlight"
                      checked={prefs.accessibility?.focusHighlight ?? true}
                      onChange={(v) =>
                        setPref({
                          accessibility: {
                            ...(prefs.accessibility || {}),
                            focusHighlight: v,
                          },
                        })
                      }
                    />
                    <Toggle
                      label="Large cursor"
                      checked={prefs.accessibility?.largeCursor ?? false}
                      onChange={(v) =>
                        setPref({
                          accessibility: {
                            ...(prefs.accessibility || {}),
                            largeCursor: v,
                          },
                        })
                      }
                    />
                  </div>
                  <Segmented
                    label="Color vision simulation"
                    value={
                      prefs.accessibility?.colorBlindMode ??
                      (prefs.accessibility?.colorBlind ? "deuteranopia" : "off")
                    }
                    options={[
                      { value: "off", label: "Off" },
                      { value: "protanopia", label: "Protanopia" },
                      { value: "deuteranopia", label: "Deuteranopia" },
                      { value: "tritanopia", label: "Tritanopia" },
                      { value: "achromatopsia", label: "Achromatopsia" },
                    ]}
                    onChange={(v) =>
                      setPref({
                        accessibility: {
                          ...(prefs.accessibility || {}),
                          colorBlindMode: v,
                          colorBlind: v !== "off",
                        },
                      })
                    }
                  />
                </SectionBlock>
              )}

              {activeSection === "advanced" && (
                <SectionBlock title="Import / Export">
                  <div className="flex flex-wrap gap-2 items-center">
                    <button
                      onClick={handleExport}
                      className="px-3 py-1.5 rounded-[var(--radius-button)] border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)]"
                    >
                      Export theme JSON
                    </button>
                    <button
                      onClick={() =>
                        document.getElementById("theme-import-input")?.click()
                      }
                      className="px-3 py-1.5 rounded-[var(--radius-button)] border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)]"
                    >
                      Import theme JSON
                    </button>
                    <input
                      id="theme-import-input"
                      type="file"
                      accept="application/json"
                      className="hidden"
                      onChange={(e) =>
                        e.target.files?.[0] && handleImport(e.target.files[0])
                      }
                    />
                    {importError && (
                      <span className="text-sm text-rose-500">
                        {importError}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Profiles (create, rename, duplicate, import, export, mark as
                    default) are managed in the left column. Per-section resets
                    restore canonical defaults.
                  </p>
                </SectionBlock>
              )}

              {/* ================= THEME PRESETS ================= */}
              {activeSection === "presets" && (
                <SectionBlock
                  title="Theme Presets"
                  onReset={() => resetSection("presets")}
                >
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Full color schemes (light + dark variants). Selecting a
                    preset updates the entire palette; the active mode decides
                    which variant is shown.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {themePresets.map((p: ThemePreset) => (
                      <button
                        key={p.id}
                        type="button"
                        title={p.name}
                        onClick={() => setPref({ themePreset: p.id })}
                        className={`rounded-[var(--radius-card)] border overflow-hidden text-left transition-shadow ${
                          prefs.themePreset === p.id
                            ? "ring-2 ring-[var(--color-accent-from)] border-[var(--color-accent-from)]"
                            : "border-[var(--color-border)] hover:shadow-md"
                        }`}
                      >
                        {/* Light / dark mini preview built from the preset palette */}
                        <div className="grid grid-cols-2 h-14">
                          <div
                            className="flex flex-col justify-between p-1.5"
                            style={{ background: p.light.background }}
                          >
                            <div
                              className="h-1.5 w-8 rounded-full"
                              style={{ background: p.light.accent.from }}
                            />
                            <div
                              className="h-1.5 w-3/4 rounded-sm"
                              style={{ background: p.light.surface }}
                            />
                            <div
                              className="h-1 w-1/2 rounded-sm"
                              style={{ background: p.light.text.primary }}
                            />
                          </div>
                          <div
                            className="flex flex-col justify-between p-1.5"
                            style={{ background: p.dark.background }}
                          >
                            <div
                              className="h-1.5 w-8 rounded-full"
                              style={{ background: p.dark.accent.from }}
                            />
                            <div
                              className="h-1.5 w-3/4 rounded-sm"
                              style={{ background: p.dark.surface }}
                            />
                            <div
                              className="h-1 w-1/2 rounded-sm"
                              style={{ background: p.dark.text.primary }}
                            />
                          </div>
                        </div>
                        <div className="px-2 py-1 text-xs font-medium truncate text-[var(--color-text-primary)] bg-[var(--color-surface)]">
                          {p.name}
                          {prefs.themePreset === p.id ? " ✓" : ""}
                        </div>
                      </button>
                    ))}
                  </div>
                </SectionBlock>
              )}

              {/* ================= SHADOWS ================= */}
              {activeSection === "shadows" && (
                <SectionBlock
                  title="Shadows"
                  onReset={() => resetSection("shadows")}
                >
                  <Segmented
                    label="Shadow level"
                    value={prefs.shadowLevel ?? "medium"}
                    options={[
                      { value: "none", label: "None" },
                      { value: "small", label: "Small" },
                      { value: "medium", label: "Medium" },
                      { value: "large", label: "Large" },
                      { value: "extra", label: "Extra" },
                    ]}
                    onChange={(v) =>
                      setPref({
                        shadowLevel: v as ThemePreferences["shadowLevel"],
                      })
                    }
                  />
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Controls the global shadow token consumed by cards and
                    dialogs.
                  </p>
                </SectionBlock>
              )}

              {/* ================= EFFECTS ================= */}
              {activeSection === "effects" && (
                <SectionBlock
                  title="Effects"
                  onReset={() => resetSection("effects")}
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <SelectField
                      label="Backdrop blur"
                      value={prefs.effects?.blur ?? "8px"}
                      options={[
                        { value: "0px", label: "None" },
                        { value: "4px", label: "Subtle" },
                        { value: "8px", label: "Default" },
                        { value: "16px", label: "Medium" },
                        { value: "24px", label: "Strong" },
                      ]}
                      onChange={(v) =>
                        setPref({
                          effects: { ...(prefs.effects || {}), blur: v },
                        })
                      }
                    />
                    <SliderField
                      label="Glass opacity"
                      value={prefs.effects?.glassOpacity ?? 0.6}
                      min={0}
                      max={1}
                      step={0.05}
                      onChange={(v) =>
                        setPref({
                          effects: {
                            ...(prefs.effects || {}),
                            glassOpacity: v,
                          },
                        })
                      }
                      display={`${Math.round((prefs.effects?.glassOpacity ?? 0.6) * 100)}%`}
                    />
                    <SliderField
                      label="Surface transparency"
                      value={prefs.effects?.transparency ?? 1}
                      min={0}
                      max={1}
                      step={0.05}
                      onChange={(v) =>
                        setPref({
                          effects: {
                            ...(prefs.effects || {}),
                            transparency: v,
                          },
                        })
                      }
                      display={`${Math.round((prefs.effects?.transparency ?? 1) * 100)}%`}
                    />
                  </div>
                </SectionBlock>
              )}

              {/* ================= MOTION ================= */}
              {activeSection === "motion" && (
                <SectionBlock
                  title="Motion"
                  onReset={() => resetSection("motion")}
                >
                  <Segmented
                    label="Motion level"
                    value={
                      prefs.animation?.motionLevel ??
                      (prefs.animation?.speed as any) ??
                      "normal"
                    }
                    options={[
                      { value: "off", label: "Off" },
                      { value: "fast", label: "Fast" },
                      { value: "normal", label: "Normal" },
                      { value: "smooth", label: "Smooth" },
                      { value: "fancy", label: "Fancy" },
                    ]}
                    onChange={(v) =>
                      setPref({
                        animation: {
                          ...(prefs.animation || {}),
                          motionLevel: v,
                          speed:
                            v === "normal" || v === "fast"
                              ? (v as "normal" | "fast")
                              : "normal",
                        },
                      })
                    }
                  />
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Maps to the --motion-duration token consumed by transitions.
                  </p>
                </SectionBlock>
              )}

              {/* ================= SIDEBAR & NAVIGATION ================= */}
              {activeSection === "sidebar" && (
                <SectionBlock
                  title="Sidebar & Navigation"
                  onReset={() => resetSection("sidebar")}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Segmented
                      label="Sidebar style"
                      value={prefs.sidebarStyle ?? "floating"}
                      options={[
                        { value: "inset", label: "Inset" },
                        { value: "floating", label: "Floating" },
                        { value: "sidebar", label: "Sidebar" },
                      ]}
                      onChange={(v) =>
                        setPref({
                          sidebarStyle: v as ThemePreferences["sidebarStyle"],
                        })
                      }
                    />
                    <Segmented
                      label="Sidebar state"
                      value={prefs.sidebarState ?? "expanded"}
                      options={[
                        { value: "expanded", label: "Expanded" },
                        { value: "collapsed", label: "Collapsed" },
                        { value: "mini", label: "Mini" },
                        { value: "overlay", label: "Overlay" },
                      ]}
                      onChange={(v) =>
                        setPref({
                          sidebarState: v as ThemePreferences["sidebarState"],
                        })
                      }
                    />
                    <Segmented
                      label="Navigation mode"
                      value={prefs.navigationMode ?? "sidebar"}
                      options={[
                        { value: "sidebar", label: "Sidebar" },
                        { value: "topbar", label: "Topbar" },
                        { value: "bottom", label: "Bottom" },
                        { value: "mixed", label: "Mixed" },
                      ]}
                      onChange={(v) =>
                        setPref({
                          navigationMode:
                            v as ThemePreferences["navigationMode"],
                        })
                      }
                    />
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Navigation mode is emitted as a token for layout consumers;
                    the app shell currently implements sidebar mode.
                  </p>
                </SectionBlock>
              )}

              {/* ================= DASHBOARD ================= */}
              {activeSection === "dashboard" && (
                <SectionBlock
                  title="Dashboard"
                  onReset={() => resetSection("dashboard")}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <SliderField
                      label="Grid columns"
                      value={prefs.dashboard?.grid?.columns ?? 12}
                      min={6}
                      max={24}
                      step={1}
                      onChange={(v) =>
                        setPref({
                          dashboard: {
                            ...(prefs.dashboard || {}),
                            grid: {
                              ...(prefs.dashboard?.grid || {}),
                              columns: v,
                            },
                          },
                        })
                      }
                    />
                    <Segmented
                      label="Card style"
                      value={prefs.dashboard?.cards?.style ?? "comfortable"}
                      options={[
                        { value: "compact", label: "Compact" },
                        { value: "comfortable", label: "Comfortable" },
                      ]}
                      onChange={(v) =>
                        setPref({
                          dashboard: {
                            ...(prefs.dashboard || {}),
                            cards: {
                              ...(prefs.dashboard?.cards || {}),
                              style: v,
                            },
                          },
                        })
                      }
                    />
                    <Segmented
                      label="Widget density"
                      value={prefs.dashboard?.widgets?.density ?? "default"}
                      options={[
                        { value: "compact", label: "Compact" },
                        { value: "default", label: "Normal" },
                        { value: "comfortable", label: "Comfortable" },
                      ]}
                      onChange={(v) =>
                        setPref({
                          dashboard: {
                            ...(prefs.dashboard || {}),
                            widgets: {
                              ...(prefs.dashboard?.widgets || {}),
                              density: v,
                            },
                          },
                        })
                      }
                    />
                    <div>
                      <Toggle
                        label="Compact kanban lanes"
                        checked={prefs.dashboard?.kanban?.laneCompact ?? false}
                        onChange={(v) =>
                          setPref({
                            dashboard: {
                              ...(prefs.dashboard || {}),
                              kanban: {
                                ...(prefs.dashboard?.kanban || {}),
                                laneCompact: v,
                              },
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Dashboard tokens are extension points for dashboard widgets.
                  </p>
                </SectionBlock>
              )}

              {/* ================= WALLPAPER ================= */}
              {activeSection === "wallpaper" && (
                <SectionBlock
                  title="Wallpaper"
                  onReset={() => resetSection("wallpaper")}
                >
                  <Segmented
                    label="Type"
                    value={prefs.wallpaper?.type ?? "none"}
                    options={[
                      { value: "none", label: "None" },
                      { value: "gradient", label: "Gradient" },
                      { value: "image", label: "Image" },
                      { value: "pattern", label: "Pattern" },
                    ]}
                    onChange={(v) =>
                      setPref({
                        wallpaper: {
                          ...(prefs.wallpaper || {}),
                          type: v as NonNullable<
                            ThemePreferences["wallpaper"]
                          >["type"],
                        },
                      })
                    }
                  />

                  {prefs.wallpaper?.type === "gradient" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-[var(--color-text-secondary)]">
                          From
                        </span>
                        <input
                          type="color"
                          value={prefs.wallpaper?.gradient?.from ?? "#6366f1"}
                          onChange={(e) =>
                            setPref({
                              wallpaper: {
                                ...(prefs.wallpaper || {}),
                                gradient: {
                                  ...(prefs.wallpaper?.gradient || {}),
                                  from: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-12 h-10 border border-[var(--color-border)] rounded-[var(--radius-input)] cursor-pointer"
                        />
                        <span className="text-sm text-[var(--color-text-secondary)]">
                          To
                        </span>
                        <input
                          type="color"
                          value={prefs.wallpaper?.gradient?.to ?? "#8b5cf6"}
                          onChange={(e) =>
                            setPref({
                              wallpaper: {
                                ...(prefs.wallpaper || {}),
                                gradient: {
                                  ...(prefs.wallpaper?.gradient || {}),
                                  to: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-12 h-10 border border-[var(--color-border)] rounded-[var(--radius-input)] cursor-pointer"
                        />
                      </div>
                      <SliderField
                        label="Angle"
                        value={prefs.wallpaper?.gradient?.angle ?? 135}
                        min={0}
                        max={360}
                        step={5}
                        onChange={(v) =>
                          setPref({
                            wallpaper: {
                              ...(prefs.wallpaper || {}),
                              gradient: {
                                ...(prefs.wallpaper?.gradient || {}),
                                angle: v,
                              },
                            },
                          })
                        }
                        display={`${prefs.wallpaper?.gradient?.angle ?? 135}°`}
                      />
                    </div>
                  )}

                  {prefs.wallpaper?.type === "image" && (
                    <div className="flex flex-col gap-3">
                      <input
                        type="text"
                        placeholder="https://…/background.jpg"
                        defaultValue={prefs.wallpaper?.image?.url ?? ""}
                        onBlur={(e) =>
                          setPref({
                            wallpaper: {
                              ...(prefs.wallpaper || {}),
                              image: {
                                ...(prefs.wallpaper?.image || {}),
                                url: e.target.value,
                              },
                            },
                          })
                        }
                        className="px-3 py-2 text-sm rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                      />
                      <SliderField
                        label="Image opacity"
                        value={prefs.wallpaper?.image?.opacity ?? 1}
                        min={0}
                        max={1}
                        step={0.05}
                        onChange={(v) =>
                          setPref({
                            wallpaper: {
                              ...(prefs.wallpaper || {}),
                              image: {
                                ...(prefs.wallpaper?.image || {}),
                                opacity: v,
                              },
                            },
                          })
                        }
                        display={`${Math.round((prefs.wallpaper?.image?.opacity ?? 1) * 100)}%`}
                      />
                    </div>
                  )}

                  {prefs.wallpaper?.type === "pattern" && (
                    <div className="flex flex-col gap-3">
                      <SelectField
                        label="Pattern"
                        value={prefs.wallpaper?.pattern?.name ?? "dots"}
                        options={wallpaperPatterns.map((w) => ({
                          value: w.id,
                          label: w.name,
                        }))}
                        onChange={(v) =>
                          setPref({
                            wallpaper: {
                              ...(prefs.wallpaper || {}),
                              pattern: {
                                ...(prefs.wallpaper?.pattern || {}),
                                name: v,
                              },
                            },
                          })
                        }
                      />
                      <SliderField
                        label="Pattern opacity"
                        value={prefs.wallpaper?.pattern?.opacity ?? 0.4}
                        min={0}
                        max={1}
                        step={0.05}
                        onChange={(v) =>
                          setPref({
                            wallpaper: {
                              ...(prefs.wallpaper || {}),
                              pattern: {
                                ...(prefs.wallpaper?.pattern || {}),
                                opacity: v,
                              },
                            },
                          })
                        }
                        display={`${Math.round((prefs.wallpaper?.pattern?.opacity ?? 0.4) * 100)}%`}
                      />
                    </div>
                  )}

                  {prefs.wallpaper?.type !== "none" && (
                    <SliderField
                      label="Overall opacity"
                      value={prefs.wallpaper?.opacity ?? 1}
                      min={0}
                      max={1}
                      step={0.05}
                      onChange={(v) =>
                        setPref({
                          wallpaper: { ...(prefs.wallpaper || {}), opacity: v },
                        })
                      }
                      display={`${Math.round((prefs.wallpaper?.opacity ?? 1) * 100)}%`}
                    />
                  )}
                </SectionBlock>
              )}

              {/* ================= DIRECTION ================= */}
              {activeSection === "direction" && (
                <SectionBlock
                  title="Direction"
                  onReset={() => resetSection("direction")}
                >
                  <Segmented
                    label="Text direction"
                    value={prefs.direction ?? "auto"}
                    options={[
                      { value: "auto", label: "Auto" },
                      { value: "ltr", label: "LTR" },
                      { value: "rtl", label: "RTL" },
                    ]}
                    onChange={(v) =>
                      setPref({ direction: v as ThemePreferences["direction"] })
                    }
                  />
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Auto derives direction from the document/OS language (e.g.
                    fa/ar → RTL).
                  </p>
                </SectionBlock>
              )}

              {/* Live preview */}
              <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
                <h4 className="font-semibold mb-2 text-[var(--color-text-primary)]">
                  Preview
                </h4>
                <div
                  className="p-4 rounded-[var(--radius-card)] border border-[var(--color-border)] flex flex-wrap gap-4 items-center"
                  style={{
                    background: "var(--color-surface, var(--bg-card))",
                  }}
                >
                  <button
                    style={{
                      background:
                        "var(--color-accent-from, var(--accent-from))",
                      color: "var(--color-accent-text, var(--accent-text))",
                      borderRadius: "var(--radius-button)",
                    }}
                    className="px-4 py-2"
                  >
                    Accent Button
                  </button>
                  <input
                    className="p-2 rounded-[var(--radius-input)] border text-sm"
                    placeholder="Input preview"
                    style={{
                      borderColor: "var(--color-border, var(--border-color))",
                      background: "var(--color-surface)",
                      color: "var(--color-text-primary)",
                    }}
                  />
                  <div
                    className="p-3 rounded-[var(--radius-card)] border"
                    style={{
                      background: "var(--color-card, var(--bg-card))",
                      borderColor: "var(--color-border, var(--border-color))",
                      boxShadow: "var(--elevation-card, var(--shadow-sm))",
                    }}
                  >
                    Card preview
                  </div>
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {prefs.themePreset ?? "default"} ·{" "}
                    {prefs.themeMode ?? "system"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-[var(--radius-button)] text-white"
                  style={{
                    background: "var(--color-accent-from, #6366f1)",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
