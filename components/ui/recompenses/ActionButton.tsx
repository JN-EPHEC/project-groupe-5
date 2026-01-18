import { FontFamilies } from "@/constants/fonts";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient"; // ✅ AJOUT
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ActionButtonProps {
  icon: string;
  label: string;
  rewardText: string;
  onPress: () => void;
}

// 🎨 THEME ACTION BUTTON
const actionTheme = {
    glassBg: ["rgba(255, 255, 255, 0.8)", "rgba(255, 255, 255, 0.5)"] as const,
    borderColor: "rgba(255, 255, 255, 0.6)",
    textMain: "#0A3F33",
    textMuted: "#4A665F",
    accent: "#008F6B",
};

export const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  rewardText,
  onPress,
}) => {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";

  // Couleurs dynamiques
  const titleColor = isLight ? actionTheme.textMain : colors.text;
  const accentColor = isLight ? actionTheme.accent : colors.accent;

  // Wrapper conditionnel
  const Wrapper = isLight ? LinearGradient : View;
  const wrapperProps = isLight 
    ? { 
        colors: actionTheme.glassBg, 
        start: { x: 0, y: 0 }, 
        end: { x: 1, y: 1 }, 
        style: [styles.container, styles.glassEffect] 
      }
    : { 
        style: [styles.container, { backgroundColor: "rgba(0, 151, 178, 0.1)", borderColor: "rgba(255,255,255,0.1)", borderWidth: 1 }] 
      };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={{ marginBottom: 12 }}>
      <Wrapper {...(wrapperProps as any)}>
        {/* ICONE ENCADRÉE */}
        <View style={[styles.iconBox, { backgroundColor: isLight ? "#E0F7EF" : "rgba(255,255,255,0.1)" }]}>
            <Ionicons name={icon as any} size={22} color={accentColor} />
        </View>

        {/* TEXTES */}
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, { color: titleColor }]}>{label}</Text>
          <Text style={[styles.reward, { color: accentColor }]}>{rewardText}</Text>
        </View>

        {/* FLÈCHE */}
        <Ionicons name="chevron-forward" size={18} color={isLight ? actionTheme.textMuted : colors.mutedText} />
      </Wrapper>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    padding: 14,
  },
  glassEffect: {
    borderWidth: 1,
    borderColor: actionTheme.borderColor,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  iconBox: {
      width: 44, height: 44, 
      borderRadius: 14, 
      alignItems: 'center', justifyContent: 'center',
      marginRight: 14
  },
  label: { 
      fontSize: 15, 
      fontWeight: "700", 
      fontFamily: FontFamilies.heading,
      marginBottom: 2 
  },
  reward: { 
      fontSize: 13, 
      fontWeight: '600',
      fontFamily: FontFamilies.body 
  },
});