import { FontFamilies } from "@/constants/fonts";
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
  const { mode } = useThemeMode();
  const isLight = mode === "light";

  // En mode light, on utilise le nouveau thème vert. Le mode dark reste inchangé pour l'instant.
  if (!isLight) {
    // Fallback pour le mode sombre (non modifié pour l'instant)
    const { colors } = useThemeMode();
    const darkCardGradient = ["rgba(0, 151, 178, 0.2)", "rgba(0, 151, 178, 0.05)"] as const;
    return (
        <View style={[styles.card, { backgroundColor: '#021114'}]}>
            <Text style={[styles.title, { color: '#FFFFFF' }]}>{title}</Text>
            <View style={styles.row}>
                <ProgressCircle done={done} total={total} />
                <View style={{ marginLeft: 16 }}>
                    <Text style={[styles.points, { color: '#FFFFFF' }]}>{pointsText}</Text>
                    <Text style={[styles.streak, { color: 'rgba(255, 255, 255, 0.7)' }]}>{streakText}</Text>
                </View>
            </View>
        </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={[styles.title, { color: greenTheme.cardTitle }]}>{title}</Text>
      <View style={styles.row}>
        <ProgressCircle done={done} total={total} />
        <View style={{ marginLeft: 16 }}>
          <Text style={[styles.points, { color: greenTheme.statText }]}>{pointsText}</Text>
          <Text style={[styles.streak, { color: greenTheme.mutedText }]}>{streakText}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
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
    fontSize: 14, 
    fontFamily: FontFamilies.bodyStrong,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: { flexDirection: "row", alignItems: "center" },
  points: { fontSize: 16, fontFamily: FontFamilies.heading, color: '#0F172A' },
  streak: { marginTop: 6, fontFamily: FontFamilies.headingMedium, color: '#64748B' },
});
