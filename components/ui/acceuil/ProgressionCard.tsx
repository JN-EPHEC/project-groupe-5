// Import ProgressCircle depuis un module commun UI
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

export function ProgressionCard({ done, total, pointsText, streakText, title = "Progression de la semaine" }: ProgressionCardProps) {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";
  const gradientColors = isLight ? [colors.cardAlt, colors.card] : [colors.surfaceAlt, colors.surface];
  const borderColor = isLight ? "rgba(255,255,255,0.12)" : colors.surfaceAlt;
  const titleColor = isLight ? colors.cardText : colors.text;
  const mutedColor = isLight ? colors.cardMuted : colors.mutedText;
  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { borderColor, shadowColor: isLight ? colors.card : colors.accent }]}
    >
      <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
      <View style={styles.row}>
        <ProgressCircle done={done} total={total} />
        <View style={{ marginLeft: 16 }}>
          <Text style={[styles.points, { color: titleColor }]}>{pointsText}</Text>
          <Text style={[styles.streak, { color: mutedColor }]}>{streakText}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    position: "relative",
    width: "100%",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  title: { marginBottom: 10, fontSize: 17, fontFamily: FontFamilies.heading },
  row: { flexDirection: "row", alignItems: "center" },
  points: { fontSize: 16, fontFamily: FontFamilies.heading },
  streak: { marginTop: 6, fontFamily: FontFamilies.headingMedium },
});
