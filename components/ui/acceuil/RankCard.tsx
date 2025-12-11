import { FontFamilies } from "@/constants/fonts";
import { useThemeMode } from "@/hooks/theme-context";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, ViewStyle } from "react-native";

export type RankCardProps = {
  value: string;
  label: string;
  style?: ViewStyle;
  active?: boolean;
};

export function RankCard({ value, label, style, active = false }: RankCardProps) {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";
  const gradientColors = isLight
    ? (active ? ([colors.card, colors.cardAlt] as const) : ([colors.cardAlt, colors.card] as const))
    : (active
        ? ([colors.surfaceAlt, colors.surface] as const)
        : ([colors.surface, colors.surfaceAlt] as const));
  const borderColor = isLight ? "rgba(255,255,255,0.12)" : colors.surfaceAlt;
  const valueColor = isLight ? colors.cardText : colors.text;
  const labelColor = isLight ? colors.cardMuted : colors.mutedText;

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { borderColor }, style]}
    >
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { padding: 20, borderRadius: 22, borderWidth: 1, overflow: "hidden", width: "100%" },
  value: { fontSize: 17, fontFamily: FontFamilies.heading },
  label: { marginTop: 6, fontFamily: FontFamilies.headingMedium },
});
