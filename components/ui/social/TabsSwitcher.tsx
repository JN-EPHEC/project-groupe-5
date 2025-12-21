import { FontFamilies } from "@/constants/fonts"; // Assure-toi d'avoir cet import ou retire fontFamily si non utilisé
import { useThemeMode } from "@/hooks/theme-context";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Tab = "clubs" | "amis";

interface TabsSwitcherProps {
  selectedTab: Tab;
  onChange: (tab: Tab) => void;
}

// 🎨 THEME SWITCHER
const theme = {
    glassBg: ["rgba(240, 253, 244, 0.95)", "rgba(255, 255, 255, 0.85)"] as const,
    glassBorder: "rgba(255, 255, 255, 0.6)",
    activeBg: "#008F6B", // Vert Marque
    activeText: "#FFFFFF",
    inactiveText: "#4A665F", // Gris Vert
};

export const TabsSwitcher: React.FC<TabsSwitcherProps> = ({ selectedTab, onChange }) => {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";
  const tabs: Tab[] = ["clubs", "amis"];

  // Wrapper conditionnel (Gradient en Light, View en Dark)
  const Wrapper = isLight ? LinearGradient : View;
  const wrapperProps = isLight 
    ? { 
        colors: theme.glassBg, 
        start: { x: 0, y: 0 }, 
        end: { x: 1, y: 1 }, 
        style: [styles.container, styles.glassEffect] 
      }
    : { 
        style: [styles.container, { backgroundColor: "rgba(0, 151, 178, 0.1)", borderColor: "rgba(255,255,255,0.1)", borderWidth: 1 }] 
      };

  return (
    <Wrapper {...(wrapperProps as any)}>
      {tabs.map((tab) => {
        const isActive = selectedTab === tab;
        
        // Couleurs dynamiques
        const activeBg = isLight ? theme.activeBg : colors.accent;
        const textColor = isActive 
            ? theme.activeText 
            : (isLight ? theme.inactiveText : colors.mutedText);

        return (
            <TouchableOpacity
              key={tab}
              onPress={() => onChange(tab)}
              style={[
                styles.tab,
                isActive && { 
                    backgroundColor: activeBg,
                    shadowColor: "#000", 
                    shadowOpacity: 0.1, 
                    shadowRadius: 4, 
                    elevation: 2 
                },
              ]}
            >
              <Text style={[styles.tabText, { color: textColor }]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
        );
      })}
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 6,
    borderRadius: 24,
    marginBottom: 16,
    width: "100%", // Prend toute la largeur
  },
  glassEffect: {
    borderWidth: 1,
    borderColor: theme.glassBorder,
  },
  tab: {
    flex: 1, // Distribution égale
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontWeight: "600",
    textTransform: "capitalize",
    fontFamily: FontFamilies.headingMedium, // Optionnel si tu as la police
    fontSize: 15,
  },
});