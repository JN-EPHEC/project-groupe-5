// Import ProgressCircle depuis un module commun UI
import { useThemeMode } from "@/hooks/theme-context";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import ProgressCircle from "../common/ProgressCircle";

export type ProgressionCardProps = {
  done: number;
  total: number;
  pointsText: string;
  streakText: string;
  title?: string;
};

export function ProgressionCard({ done, total, pointsText, streakText, title = "Progression de la semaine" }: ProgressionCardProps) {
  const { colors } = useThemeMode();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <View style={styles.row}>
        <ProgressCircle done={done} total={total} />
        <View style={{ marginLeft: 16 }}>
          <Text style={[styles.points, { color: colors.text }]}>{pointsText}</Text>
          <Text style={[styles.streak, { color: colors.mutedText }]}>{streakText}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 14, marginTop: 14 },
  title: { fontWeight: "600", marginBottom: 8, fontSize: 16 },
  row: { flexDirection: "row", alignItems: "center" },
  points: { fontWeight: "600", fontSize: 15 },
  streak: { marginTop: 4 },
});
