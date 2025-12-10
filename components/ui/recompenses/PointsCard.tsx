import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface PointsCardProps {
  points: number;
}

export const PointsCard: React.FC<PointsCardProps> = ({ points }) => {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";
  const cardText = isLight ? colors.cardText : colors.text;
  const cardMuted = isLight ? colors.cardMuted : colors.mutedText;

  return (
    <View style={[styles.card, { backgroundColor: isLight ? colors.card : colors.surface }]}> 
      <Ionicons name="leaf" size={22} color={colors.accent} />
      <Text style={[styles.label, { color: cardMuted }]}>Points disponibles</Text>
      <Text style={[styles.value, { color: colors.accent }]}>{points}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 16, alignItems: "center", marginBottom: 20 },
  label: { fontSize: 14, marginTop: 5 },
  value: { fontSize: 32, fontWeight: "bold" },
});
