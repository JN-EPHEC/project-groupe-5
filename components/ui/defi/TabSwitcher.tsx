// components/ui/defi/TabSwitcher.tsx
import { useThemeMode } from "@/hooks/theme-context";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { TabKey } from "./types";

type Props = {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
};

// 🎨 THEME SWITCHER
const switcherTheme = {
    glassBg: ["rgba(240, 253, 244, 0.95)", "rgba(255, 255, 255, 0.85)"] as const,
    borderColor: "rgba(255, 255, 255, 0.6)",
    activeBg: "#008F6B", // Vert Marque
    activeText: "#FFFFFF",
    inactiveText: "#4A665F",
};

export function TabSwitcher({ activeTab, onChange }: Props) {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";

  // Wrapper conditionnel
  const Wrapper = isLight ? LinearGradient : View;
  const wrapperProps = isLight 
    ? { 
        colors: switcherTheme.glassBg, 
        start: { x: 0, y: 0 }, 
        end: { x: 1, y: 1 }, 
        style: [styles.tabSwitcher, styles.glassEffect] 
      }
    : { 
        style: [styles.tabSwitcher, { backgroundColor: "rgba(0, 151, 178, 0.1)", borderColor: "rgba(255,255,255,0.1)", borderWidth: 1 }] 
      };

  return (
    <Wrapper {...(wrapperProps as any)}>
      {(["perso", "club"] as TabKey[]).map((tab) => {
        const isActive = activeTab === tab;
        
        // Couleur du texte
        const textColor = isActive
            ? switcherTheme.activeText
            : (isLight ? switcherTheme.inactiveText : colors.mutedText);

        // Couleur de fond de l'onglet actif
        const activeButtonStyle = isActive 
            ? { 
                backgroundColor: isLight ? switcherTheme.activeBg : colors.accent,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 3
              } 
            : {};

        return (
            <TouchableOpacity
              key={tab}
              style={[styles.switcherButton, activeButtonStyle]}
              onPress={() => onChange(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.switcherText, { color: textColor }]}>
                {tab === "perso" ? "Perso" : "Club"}
              </Text>
            </TouchableOpacity>
        );
      })}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  tabSwitcher: {
    flexDirection: "row",
    borderRadius: 24,
    padding: 6,
    marginBottom: 20, // Remplace le marginTop: 20 du code précédent pour mieux s'intégrer
  },
  glassEffect: {
    borderWidth: 1,
    borderColor: switcherTheme.borderColor,
  },
  switcherButton: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  switcherText: {
    fontWeight: "700",
    fontSize: 15,
  },
});