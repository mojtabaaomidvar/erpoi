// ============ TYPOGRAPHY TOKENS ============
export const typography = {
  fontFamily: {
    system: "Inter, system-ui, -apple-system, sans-serif",
    inter: "Inter, system-ui, -apple-system, sans-serif",
    roboto: "Roboto, system-ui, -apple-system, sans-serif",
    vazirmatn: "Vazirmatn, Tahoma, sans-serif",
    iransansx: "IRANSansX, Tahoma, sans-serif",
    yekan: "Yekan Bakh, Tahoma, sans-serif",
    dana: "Dana, Tahoma, sans-serif",
    shabnam: "Shabnam, Tahoma, sans-serif",
    tahoma: "Tahoma, system-ui, -apple-system, sans-serif",
    mono: "JetBrains Mono, Monaco, monospace",
  },

  fontSize: {
    xs: ["0.75rem", { lineHeight: "1rem" }], // 12px
    sm: ["0.875rem", { lineHeight: "1.25rem" }], // 14px
    base: ["1rem", { lineHeight: "1.5rem" }], // 16px
    lg: ["1.125rem", { lineHeight: "1.75rem" }], // 18px
    xl: ["1.25rem", { lineHeight: "1.75rem" }], // 20px
    "2xl": ["1.5rem", { lineHeight: "2rem" }], // 24px
    "3xl": ["1.875rem", { lineHeight: "2.25rem" }], // 30px
    "4xl": ["2.25rem", { lineHeight: "2.5rem" }], // 36px
  },

  fontWeight: {
    hairline: "100",
    thin: "200",
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
    black: "900",
  },
  // Optional advanced typography controls that consumers may opt into.
  // Kept additive and optional to preserve backward compatibility.
  letterSpacing: {
    tight: "-0.02em",
    normal: "0em",
    wide: "0.02em",
  },
  lineHeight: {
    tight: "1.2",
    normal: "1.5",
    relaxed: "1.75",
  },
} as const;
