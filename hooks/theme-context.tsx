import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";

// On garde "ThemeMode" pour compatibilité, mais on exporte aussi "Theme"
export type ThemeMode = "light" | "dark";
export type Theme = ThemeMode; 

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
  pill: string;       // Gardé pour social.tsx
  pillActive: string; // Gardé pour social.tsx
  success: string;
  glass: string;
  glassBorder: string;
  border: string;
  error: string;      // AJOUTÉ pour l'admin
};

type ThemeContextType = {
  mode: ThemeMode;
  theme: ThemeMode;   // AJOUTÉ pour l'admin
  colors: Palette;
  toggle: () => void;
  toggleTheme: () => void; // AJOUTÉ pour l'admin (alias de toggle)
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
    error: "#F45B69", // Rouge sombre
  },
  light: {
    // 🎨 NOUVEAU THÈME NATURE / BEIGE
    background: "#FAF7F2", // Beige crème
    text: "#3E2723",        // Brun foncé
    mutedText: "#8D6E63",   // Brun clair
    accent: "#10B981",      // Vert GreenUp
    surface: "#FFFFFF",     // Blanc
    surfaceAlt: "#F2ECE4",  // Beige plus foncé
    card: "#FFFFFF",
    cardAlt: "#F2ECE4",
    cardText: "#3E2723",
    cardMuted: "#8D6E63",
    pill: "#FFFFFF",        // Pour social.tsx
    pillActive: "#3E2723",  // Pour social.tsx
    success: "#10B981",
    glass: "rgba(255, 255, 255, 0.75)",
    glassBorder: "rgba(255, 255, 255, 0.5)",
    border: "#E7DED0",
    error: "#EF4444",       // Rouge standard
  },
};

// On garde le nom "ThemeProviderCustom" pour ne pas casser _layout.tsx
export function ThemeProviderCustom({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(systemScheme === "dark" ? "dark" : "light");

  useEffect(() => {
    if (systemScheme) {
      setMode(systemScheme === "dark" ? "dark" : "light");
    }
  }, [systemScheme]);

  const value = useMemo(
    () => ({
      mode,
      theme: mode, // Alias pour compatibilité
      colors: palettes[mode],
      toggle: () => setMode((prev) => (prev === "dark" ? "light" : "dark")),
      toggleTheme: () => setMode((prev) => (prev === "dark" ? "light" : "dark")), // Alias
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