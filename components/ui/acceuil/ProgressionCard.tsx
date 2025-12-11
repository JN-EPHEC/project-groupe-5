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
  const darkCardGradient = ["rgba(0, 151, 178, 0.2)", "rgba(0, 151, 178, 0.05)"] as const;
  const lightCardGradient = [
    "#99E2B4",
    "#88D4AB",
    "#78C6A3",
    "#67B99A",
    "#56AB91",
    "#469D89",
    "#358F80",
    "#248277",
    "#14746F",
  ];
  const gradientColors = isLight ? lightCardGradient : darkCardGradient;
  const borderColor = isLight ? "rgba(255,255,255,0.12)" : "rgba(0, 151, 178, 0.3)";
  const titleColor = isLight ? "#FFFFFF" : colors.text;
  const mutedColor = isLight ? "rgba(255, 255, 255, 0.7)" : colors.mutedText;
  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
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
