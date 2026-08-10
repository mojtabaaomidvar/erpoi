import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import type {
  ThemePreferences,
  ThemeMode as DomainThemeMode,
} from "@features/theme/domain/ThemePreferences";
import { defaultThemePreferences as DEFAULT_PREFS } from "@features/theme/domain/ThemePreferences";
import { ProfilePreferencesService } from "@features/profile/application/ProfilePreferencesService";
import {
  buildCssVarsFromPrefs,
  applyCssVars,
  buildLegacyAliases,
  CANONICAL_VARS,
  migrateThemePreferences,
  resolveIsDark,
  systemPrefersDark,
  deriveDirectionFromLocale,
  // profile utilities from the canonical theme engine
  getThemeProfiles,
  getActiveThemeProfileId,
} from "@design-system/theme/engine";

type ThemeMode = DomainThemeMode;

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  themeMode: ThemeMode;
  // accept legacy 'auto' as well
  setThemeMode: (mode: ThemeMode | "auto") => void;
  // Full preferences object
  themePreferences: ThemePreferences;
  setThemePreferences: (patch: Partial<ThemePreferences>) => void;
  // legacy compatibility (no remote calls in this app)
  saveToProfile: (save: boolean) => Promise<void>;
  savingRemote: boolean;
  savePreferenceToProfile: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// use shared registry from design-system to avoid duplication
// (imports at top bring engine helpers)

export function ThemeProvider({ children }: { children: ReactNode }) {
  // load preferences from localStorage or, when absent, fall back to an
  // active theme profile (created by the ThemeSettings UI). This keeps the
  // app backward compatible with older "theme-prefs" storage while allowing
  // users to select a named profile as the authoritative source.
  const initialPrefs: ThemePreferences = (() => {
    try {
      const raw = localStorage.getItem("theme-prefs");
      if (raw) {
        const parsed = JSON.parse(raw);
        // migrate legacy shapes conservatively to our canonical model
        return migrateThemePreferences(parsed as any) as ThemePreferences;
      }

      // no explicit local prefs found: check for an active theme profile
      try {
        const activeId = getActiveThemeProfileId();
        if (activeId) {
          const profiles = getThemeProfiles();
          const act = profiles.find((p) => p.id === activeId);
          if (act)
            return migrateThemePreferences(act.prefs) as ThemePreferences;
        }
      } catch (err) {
        // ignore profile lookup failures and fall back to defaults
      }

      return DEFAULT_PREFS;
    } catch (err) {
      return DEFAULT_PREFS;
    }
  })();

  const [themePreferences, setThemePreferencesState] =
    useState<ThemePreferences>(initialPrefs);

  const [savingRemote, setSavingRemote] = useState(false);
  const [savePreferenceToProfile, setSavePreferenceToProfile] =
    useState<boolean>(() => {
      try {
        return localStorage.getItem("theme-save-to-profile") === "1";
      } catch (err) {
        return false;
      }
    });

  // Apply preferences to document (CSS variables, dir, classes)
  const applyPreferences = (prefs: ThemePreferences) => {
    // direction & simple attributes
    const root = document.documentElement;
    // support auto direction: derive from document language / navigator
    let effectiveDir = prefs.direction ?? "ltr";
    if (effectiveDir === "auto") {
      // prefer explicit document language, fallback to navigator languages
      const docLang = document.documentElement.lang;
      // navigator.languages is readonly string[]; ensure we pass a mutable
      // or compatible shape to the helper by casting to string | string[]
      const nav = navigator.languages as unknown as string[] | undefined;
      effectiveDir = deriveDirectionFromLocale(
        docLang || nav || navigator.language,
      );
    }
    root.setAttribute("dir", effectiveDir);
    root.style.setProperty("--header-height", "4rem");

    // Apply canonical CSS variables via engine (colors, typography, spacing,
    // radii, effects, wallpaper, motion, navigation tokens).
    const vars = buildCssVarsFromPrefs(prefs);
    applyCssVars(vars);

    // Also apply legacy aliases for backward compatibility
    const legacy = buildLegacyAliases(vars);
    applyCssVars(legacy);

    // Accessibility classes: toggle root-level classes to allow CSS-driven
    // behaviors. Using classes keeps runtime updates cheap and lets CSS handle
    // most of the visual changes (reduced motion, high contrast, focus,
    // color-blind filters, large cursor).
    const acc = prefs.accessibility || {};
    root.classList.toggle("pref-reduce-motion", !!acc.reduceMotion);
    root.classList.toggle("pref-high-contrast", !!acc.highContrast);
    // Focus highlight is enabled by default; add a 'no-focus-highlight' class
    // when the preference is explicitly disabled so CSS can remove outlines.
    root.classList.toggle("no-focus-highlight", acc.focusHighlight === false);
    // Large cursor flag (best-effort used by CSS)
    root.classList.toggle("pref-large-cursor", !!acc.largeCursor);

    // Color-blind simulation filter classes (single active class at a time)
    const colorBlindMode =
      acc.colorBlindMode || (acc.colorBlind ? "deuteranopia" : "off");
    const cbClasses = [
      "pref-colorblind-protanopia",
      "pref-colorblind-deuteranopia",
      "pref-colorblind-tritanopia",
      "pref-colorblind-achromatopsia",
    ];
    cbClasses.forEach((c) => root.classList.remove(c));
    if (colorBlindMode && colorBlindMode !== "off") {
      root.classList.add(`pref-colorblind-${colorBlindMode}`);
    }

    // sidebar & content width preserved for layout consumers
    root.style.setProperty("--sidebar-width-expanded", "16rem");
    root.style.setProperty("--sidebar-width-collapsed", "5rem");
    root.style.setProperty(
      "--content-max-width",
      vars[CANONICAL_VARS.contentWidth] || "100%",
    );

    // persist theme-mode separately for backward compat
    localStorage.setItem("theme-mode", prefs.themeMode);

    // dark class determination preserved (system/custom/light/dark)
    const isDark = resolveIsDark(prefs);
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");

    // persist whole preferences
    try {
      localStorage.setItem("theme-prefs", JSON.stringify(prefs));
    } catch (err) {
      console.warn("Failed to persist theme preferences", err);
    }
  };

  // apply on mount and when preferences change
  useEffect(() => {
    applyPreferences(themePreferences);
    // Re-apply when the OS/browser color scheme changes while in system mode
    // (matches VS Code behavior). The interval below is a conservative fallback
    // for environments without matchMedia.
    let mql: MediaQueryList | null = null;
    const onChange = () => {
      if (themePreferences.themeMode === "system")
        applyPreferences(themePreferences);
    };
    if (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function"
    ) {
      try {
        mql = window.matchMedia("(prefers-color-scheme: dark)");
        mql.addEventListener?.("change", onChange);
      } catch (err) {
        mql = null;
      }
    }
    // update every minute in case system time changes and themeMode === 'system'
    const interval = setInterval(onChange, 60000);
    return () => {
      clearInterval(interval);
      mql?.removeEventListener?.("change", onChange);
    };
    // Intentionally excluding applyPreferences from deps to avoid recreating
    // the interval when internal helpers change. We re-run on themePreferences
    // updates which is the meaningful trigger for updating CSS variables.
    // (eslint-disable-next-line react-hooks/exhaustive-deps) -- kept intentionally
  }, [themePreferences]);

  // Listen for storage changes (other tabs or the ThemeSettings UI) and
  // re-apply active profile when it changes. We intentionally do not listen
  // to all keys; instead we re-evaluate the active profile when a storage
  // event occurs so the app stays in sync across windows.
  useEffect(() => {
    const onStorage = (_e: StorageEvent) => {
      try {
        const activeId = getActiveThemeProfileId();
        if (!activeId) return;
        const profiles = getThemeProfiles();
        const act = profiles.find((p) => p.id === activeId);
        if (act) {
          const migrated = migrateThemePreferences(act.prefs as any);
          setThemePreferencesState((prev) => {
            // only apply if different to avoid noisy updates
            if (JSON.stringify(prev) === JSON.stringify(migrated)) return prev;
            applyPreferences(migrated);
            return migrated;
          });
        }
      } catch (err) {
        // noop
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setThemePreferences = (patch: Partial<ThemePreferences>) => {
    // Apply a shallow patch to preferences and persist/apply with minimal
    // re-renders. Avoid noisy debug logs in production.
    setThemePreferencesState((prev) => {
      const next = { ...prev, ...patch } as ThemePreferences;
      // Only apply preferences if something changed to avoid extra CSS writes.
      const changed = JSON.stringify(prev) !== JSON.stringify(next);
      if (changed) applyPreferences(next);
      return next;
    });
  };

  const toggleTheme = () => {
    setThemePreferencesState((prev) => {
      const prevMode = prev.themeMode;
      if (prevMode === "custom") {
        // flip the custom base so the toggle keeps working in custom mode
        const next: ThemePreferences = {
          ...prev,
          customThemeBase: prev.customThemeBase === "dark" ? "light" : "dark",
        };
        applyPreferences(next);
        return next;
      }
      const nextMode = (
        prevMode === "system"
          ? systemPrefersDark()
            ? "light"
            : "dark"
          : prevMode === "dark"
            ? "light"
            : "dark"
      ) as ThemeMode;
      const next: ThemePreferences = { ...prev, themeMode: nextMode };
      applyPreferences(next);
      return next;
    });
  };

  const setThemeMode = (mode: ThemeMode | "auto") => {
    const normalized = mode === "auto" ? "system" : (mode as ThemeMode);
    setThemePreferences({ themeMode: normalized });
  };

  // keep legacy API: toggles local flag and, when enabling, attempts to sync with remote profile
  const saveToProfile = async (save: boolean) => {
    setSavePreferenceToProfile(save);
    try {
      localStorage.setItem("theme-save-to-profile", save ? "1" : "0");
    } catch (err) {
      console.warn("Failed to persist save-to-profile flag", err);
    }

    if (save) {
      setSavingRemote(true);
      try {
        // push current preferences to remote profile
        await ProfilePreferencesService.saveForCurrentUser(themePreferences);
      } catch (err) {
        console.warn(
          "ThemeProvider: failed to save preferences to profile",
          err,
        );
      } finally {
        setSavingRemote(false);
      }
    }
  };

  // If the user previously opted into saving to profile, try to load remote prefs on startup
  // This keeps local and remote in sync when the flag is enabled.
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      if (!savePreferenceToProfile) return;
      setSavingRemote(true);
      try {
        const remote = await ProfilePreferencesService.loadForCurrentUser();
        if (remote && !cancelled) {
          // migrate remote shape before applying to avoid corrupting local prefs
          const migrated = migrateThemePreferences(remote as any);
          setThemePreferences(migrated);
        }
      } catch (err) {
        console.warn(
          "ThemeProvider: failed to load preferences from profile",
          err,
        );
      } finally {
        if (!cancelled) setSavingRemote(false);
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const themeMode = themePreferences.themeMode;
  const isDark = resolveIsDark(themePreferences);

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        toggleTheme,
        themeMode,
        setThemeMode,
        themePreferences,
        setThemePreferences,
        saveToProfile,
        savingRemote,
        savePreferenceToProfile,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
