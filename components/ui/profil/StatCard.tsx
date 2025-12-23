import { FontFamilies } from "@/constants/fonts";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface StatCardProps {
  icon: string;
  value?: string;
  label: string;
  accent?: boolean;
}

// 🎨 THEME STAT CARD
const statTheme = {
    glassBg: ["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"] as const,
    accentBg: ["#008F6B", "#10B981"] as const, // Vert Marque dégradé
    borderColor: "rgba(255, 255, 255, 0.6)",
    textMain: "#0A3F33",
    textMuted: "#4A665F",
};

export const StatCard: React.FC<StatCardProps> = ({ icon, value, label, accent }) => {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";

  // Couleurs dynamiques
  const textColor = accent ? "#FFF" : (isLight ? statTheme.textMain : colors.text);
  const subTextColor = accent ? "rgba(255,255,255,0.9)" : (isLight ? statTheme.textMuted : colors.mutedText);
  const iconColor = accent ? "#FFF" : (isLight ? statTheme.textMain : colors.accent);
  const iconBg = accent ? "rgba(255,255,255,0.2)" : (isLight ? "#E0F7EF" : "rgba(255,255,255,0.1)");

  // Wrapper conditionnel
  const Wrapper = isLight ? LinearGradient : View;
  
  // Props du wrapper
  const wrapperProps = isLight
    ? {
        colors: accent ? statTheme.accentBg : statTheme.glassBg,
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
        style: [styles.card, styles.glassEffect, accent && { borderColor: "transparent" }]
      }
    : {
        style: [styles.card, { backgroundColor: accent ? colors.accent : "rgba(0, 151, 178, 0.1)", borderColor: "rgba(255,255,255,0.1)", borderWidth: 1 }]
      };

  return (
    <Wrapper {...(wrapperProps as any)}>
      <View style={[styles.iconBadge, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={22} color={iconColor} />
      </View>
      {value !== undefined && value !== null && <Text style={[styles.number, { color: textColor }]}>{value}</Text>}
      <Text style={[styles.label, { color: subTextColor }]}>{label}</Text>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 5,
    borderRadius: 20,
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  glassEffect: {
    borderWidth: 1,
    borderColor: statTheme.borderColor,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  iconBadge: { 
      width: 42, height: 42, 
      borderRadius: 21, 
      justifyContent: "center", alignItems: "center",
      marginBottom: 10 
  },
  number: { 
      fontSize: 20, 
      fontFamily: FontFamilies.heading, 
      fontWeight: '800',
      marginBottom: 4 
  },
  label: { 
      fontSize: 12, 
      fontFamily: FontFamilies.body, 
      textAlign: 'center',
      fontWeight: '600'
  },
});