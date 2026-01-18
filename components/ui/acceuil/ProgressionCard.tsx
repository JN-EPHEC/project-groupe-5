import { FontFamilies } from "@/constants/fonts";
import { useThemeMode } from "@/hooks/theme-context";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import ProgressCircle from "../common/ProgressCircle";

export type ProgressionCardProps = {
  weeklyDays: number;   
  weeklyPoints: number; 
  daysRemaining: number; // ✅ Nouvelle prop calculée
};

const cardTheme = {
  glassBg: ["rgba(240, 253, 244, 0.95)", "rgba(255, 255, 255, 0.85)"] as const,
  borderColor: "rgba(255, 255, 255, 0.6)",
  titleMain: "#0A3F33",
  textAccent: "#008F6B",
  textMuted: "#4A665F",
};

export function ProgressionCard({
  weeklyDays = 0,
  weeklyPoints = 0,
  daysRemaining = 0,
}: ProgressionCardProps) {
  const { mode, colors } = useThemeMode();
  const isLight = mode === "light";

  // Textes (Sécurisés avec || 0 pour éviter undefined)
  const title = "Progression de la semaine";
  const pointsLabel = `${weeklyPoints || 0} points gagnés`;
  
  // Logique d'affichage jours restants
  const streakLabel = daysRemaining <= 0 
    ? "Semaine terminée !" 
    : `${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} restant${daysRemaining > 1 ? 's' : ''}`;

  if (!isLight) {
    const gradientColors = ["rgba(0, 151, 178, 0.2)", "rgba(0, 151, 178, 0.05)"] as const;
    return (
      <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, { borderWidth: 1, borderColor: 'rgba(0, 151, 178, 0.3)' }]}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <View style={styles.row}>
          <ProgressCircle done={weeklyDays} total={7} />
          <View style={{ marginLeft: 16 }}>
            <Text style={[styles.points, { color: colors.text }]}>{pointsLabel}</Text>
            <Text style={[styles.streak, { color: colors.mutedText }]}>{streakLabel}</Text>
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={cardTheme.glassBg}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={[styles.card, styles.glassEffect]}
    >
      <View style={{ zIndex: 10 }}>
        <Text style={[styles.title, { color: cardTheme.titleMain }]}>{title}</Text>
        <View style={styles.row}>
          <ProgressCircle done={weeklyDays} total={7} />
          <View style={{ marginLeft: 16 }}>
            {/* ✅ Vert appliqué ici */}
            <Text style={[styles.points, { color: cardTheme.textAccent }]}>{pointsLabel}</Text>
            <Text style={[styles.streak, { color: cardTheme.textMuted }]}>{streakLabel}</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { padding: 20, borderRadius: 26, width: "100%", minHeight: 130, justifyContent: "center" },
  glassEffect: { borderWidth: 1, borderColor: cardTheme.borderColor, shadowColor: "#005c4b", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3 },
  title: { marginBottom: 16, fontSize: 18, fontFamily: FontFamilies.heading },
  row: { flexDirection: "row", alignItems: "center" },
  points: { fontSize: 16, fontFamily: FontFamilies.heading, fontWeight: '700' },
  streak: { marginTop: 4, fontFamily: FontFamilies.body, fontSize: 13 },
});