import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface LargeCardProps {
  icon: string;
  label: string;
  value: string;
}

export const LargeCard: React.FC<LargeCardProps> = ({ icon, label, value }) => {
  const { colors } = useThemeMode();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Ionicons name={icon as any} size={24} color={colors.accent} />
      <Text style={[styles.label, { color: colors.mutedText }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 15, padding: 20, marginVertical: 8, alignItems: "center" },
  label: { fontSize: 12 },
  value: { fontSize: 18, fontWeight: "bold", marginTop: 5 },
});
