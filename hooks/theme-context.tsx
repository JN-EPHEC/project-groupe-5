import React, { createContext, useContext, useMemo, useState } from "react";

type ThemeMode = "light" | "dark";

type Palette = {
  background: string;
  text: string;
  mutedText: string;
  accent: string;
  surface: string;
  surfaceAlt: string;
  card: string;
  cardAlt: string;
  cardText: string;
  cardMuted: string;
  pill: string;
  pillActive: string;
  success: string;
};

type ThemeContextType = {
  mode: ThemeMode;
  colors: Palette;
  toggle: () => void;
  set: (m: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const palettes: Record<ThemeMode, Palette> = {
  dark: {
    background: "#0C3327",
    text: "#F2F6F4",
    mutedText: "#9FB9AE",
    accent: "#19D07D",
    surface: "#111F1B",
    surfaceAlt: "#152922",
    card: "#111F1B",
    cardAlt: "#152922",
    cardText: "#F2F6F4",
    cardMuted: "#9FB9AE",
    pill: "#111F1B",
    pillActive: "#D4F7E7",
    success: "#7DCAB0",
  },
  light: {
    background: "#F7FAF9",
    text: "#0F3327",
    mutedText: "#5B7D72",
    accent: "#19D07D",
    surface: "#FFFFFF",
    surfaceAlt: "#ECF5F1",
    card: "#0C3327",
    cardAlt: "#134434",
    cardText: "#F2F6F4",
    cardMuted: "#B4D3C8",
    pill: "#ECF5F1",
    pillActive: "#0F3327",
    success: "#19D07D",
  },
};

export function ThemeProviderCustom({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("dark");

  const value = useMemo(
    () => ({
      mode,
      colors: palettes[mode],
      toggle: () => setMode((prev) => (prev === "dark" ? "light" : "dark")),
      set: (m: ThemeMode) => setMode(m),
    }),
    [mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeMode must be used within ThemeProviderCustom");
  return ctx;
}
