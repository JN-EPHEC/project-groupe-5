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

export const StatCard: React.FC<StatCardProps> = ({ icon, value, label, accent }) => {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";
  const gradient = accent
    ? [colors.accent, colors.success]
    : isLight
    ? [colors.cardAlt, colors.card]
    : [colors.surfaceAlt, colors.surface];
  const textColor = accent ? "#0F3327" : isLight ? colors.cardText : colors.text;
  const subTextColor = accent ? "#0F3327" : isLight ? colors.cardMuted : colors.mutedText;
  const iconTint = accent ? "#0F3327" : isLight ? colors.cardText : colors.accent;
  const badgeFill = accent ? "rgba(15, 51, 39, 0.12)" : isLight ? colors.cardAlt : "rgba(0, 255, 90, 0.15)";
  const cardBorderColor = accent ? "rgba(15,51,39,0.1)" : isLight ? "rgba(255,255,255,0.12)" : colors.surfaceAlt;
  const shadowShade = accent ? colors.accent : isLight ? colors.card : colors.accent;
  return (
    <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, { shadowColor: shadowShade, borderColor: cardBorderColor }]}>
      <View
        style={[styles.iconBadge, { backgroundColor: badgeFill }]}
      >
        <Ionicons name={icon as any} size={20} color={iconTint} />
      </View>
      {value && <Text style={[styles.number, { color: textColor }]}>{value}</Text>}
      <Text style={[styles.label, { color: subTextColor }]}>{label}</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 5,
    borderRadius: 22,
    alignItems: "center",
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    position: "relative",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  iconBadge: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  number: { fontSize: 18, fontFamily: FontFamilies.heading, marginTop: 8 },
  label: { fontSize: 13, fontFamily: FontFamilies.bodyStrong, marginTop: 6 },
});
