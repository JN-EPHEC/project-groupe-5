import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface PointsCardProps {
  points: number;
}

export const PointsCard: React.FC<PointsCardProps> = ({ points }) => {
  const { colors } = useThemeMode();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Ionicons name="leaf" size={22} color={colors.accent} />
      <Text style={[styles.label, { color: colors.mutedText }]}>Mes points</Text>
      <Text style={[styles.value, { color: colors.accent }]}>{points}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 16, alignItems: "center", marginBottom: 20 },
  label: { fontSize: 14, marginTop: 5 },
  value: { fontSize: 32, fontWeight: "bold" },
});
