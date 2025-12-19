import { FontFamilies } from "@/constants/fonts";
import { useThemeMode } from "@/hooks/theme-context";
import { LinearGradient } from "expo-linear-gradient";
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

// NOUVEAU THEME "Camaïeu de Verts"
const greenTheme = {
  cardTitle: "#15803D", // Vert Forêt moderne
  statText: "#0F172A", // Gris Foncé
  mutedText: "#64748B", // Gris
};

export function ProgressionCard({
  done,
  total,
  pointsText,
  streakText,
  title = "Progression de la semaine",
}: ProgressionCardProps) {
  const { mode, colors } = useThemeMode();
  const isLight = mode === "light";

  if (!isLight) {
    const gradientColors = ["rgba(0, 151, 178, 0.2)", "rgba(0, 151, 178, 0.05)"];
    return (
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { borderWidth: 1, borderColor: 'rgba(0, 151, 178, 0.3)' }]}
      >
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <View style={styles.row}>
          <ProgressCircle done={done} total={total} />
          <View style={{ marginLeft: 16 }}>
            <Text style={[styles.points, { color: colors.text }]}>
              {pointsText}
            </Text>
            <Text style={[styles.streak, { color: colors.mutedText }]}>
              {streakText}
            </Text>
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderWidth: 1, borderColor: '#007AFF' }]}>
      <Text style={[styles.title, { color: greenTheme.cardTitle }]}>{title}</Text>
      <View style={styles.row}>
        <ProgressCircle done={done} total={total} />
        <View style={{ marginLeft: 16 }}>
          <Text style={[styles.points, { color: greenTheme.statText }]}>
            {pointsText}
          </Text>
          <Text style={[styles.streak, { color: greenTheme.mutedText }]}>
            {streakText}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 24,
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    width: "100%",
  },
  title: {
    marginBottom: 16,
    fontSize: 18,
    fontFamily: FontFamilies.heading,
  },
  row: { flexDirection: "row", alignItems: "center" },
  points: { fontSize: 16, fontFamily: FontFamilies.heading, color: "#0F172A" },
  streak: {
    marginTop: 6,
    fontFamily: FontFamilies.headingMedium,
    color: "#64748B",
  },
});
