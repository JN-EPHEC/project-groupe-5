import { useThemeMode } from "@/hooks/theme-context";
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

export type RankCardProps = {
  value: string;
  label: string;
  style?: ViewStyle;
  active?: boolean;
};

export function RankCard({ value, label, style, active = false }: RankCardProps) {
  const { colors } = useThemeMode();
  return (
    <View style={[styles.card, { backgroundColor: active ? colors.surfaceAlt : colors.surface }, style]}>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.mutedText }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 14 },
  value: { fontWeight: "600", fontSize: 16 },
  label: { marginTop: 4 },
});
