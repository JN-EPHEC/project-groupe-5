import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";

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
  glass: string;
  glassBorder: string;
  border: string;
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
    background: "#021114",
    text: "#F2F6F4",
    mutedText: "#9FB9AE",
    accent: "#00D68F",
    surface: "#111F1B",
    surfaceAlt: "#0F242A",
    card: "rgba(0, 151, 178, 0.1)",
    cardAlt: "rgba(0, 151, 178, 0.05)",
    cardText: "#F2F6F4",
    cardMuted: "#9FB9AE",
    pill: "#111F1B",
    pillActive: "#D4F7E7",
    success: "#7DCAB0",
    glass: "rgba(0, 151, 178, 0.15)",
    glassBorder: "rgba(0, 151, 178, 0.3)",
    border: "rgba(0, 151, 178, 0.3)",
  },
  light: {
    background: "#E9EEF1",
    text: "#4A4F54",
    mutedText: "#9BA4AB",
    accent: "#00D68F",
    surface: "#FFFFFF",
    surfaceAlt: "#F0F3F5",
    card: "#FFFFFF",
    cardAlt: "#F7F9FA",
    cardText: "#4A4F54",
    cardMuted: "#9BA4AB",
    pill: "#FFFFFF",
    pillActive: "#4A4F54",
    success: "#00D68F",
    glass: "rgba(255, 255, 255, 0.75)",
    glassBorder: "rgba(255, 255, 255, 1.0)",
    border: "#E0E0E0",
  },
};

export function ThemeProviderCustom({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(systemScheme === "dark" ? "dark" : "light");

  // Sync with system theme changes
  useEffect(() => {
    if (systemScheme) {
      setMode(systemScheme === "dark" ? "dark" : "light");
    }
  }, [systemScheme]);

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
