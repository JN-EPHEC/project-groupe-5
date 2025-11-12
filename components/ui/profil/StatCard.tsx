import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface StatCardProps {
  icon: string;
  value?: string;
  label: string;
  accent?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ icon, value, label, accent }) => {
  const { colors } = useThemeMode();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: accent ? colors.accent : colors.surface },
      ]}
    >
      <Ionicons name={icon as any} size={24} color={accent ? colors.surface : colors.accent} />
      {value && <Text style={[styles.number, { color: colors.text }]}>{value}</Text>}
      <Text style={[styles.label, { color: accent ? colors.surface : colors.mutedText }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { flex: 1, margin: 5, borderRadius: 15, alignItems: "center", paddingVertical: 15 },
  number: { fontSize: 18, fontWeight: "bold", marginTop: 4 },
  label: { fontSize: 12 },
});
