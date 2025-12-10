import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type ChallengeOfTheDayProps = {
  title: string;
  description: string;
  difficulty: string;
  onValidate?: () => void;
};

export function ChallengeOfTheDay({ title, description, difficulty, onValidate }: ChallengeOfTheDayProps) {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";
  const gradientColors = isLight ? [colors.cardAlt, colors.card] : [colors.surfaceAlt, colors.surface];
  const titleColor = isLight ? colors.cardText : colors.text;
  const mutedColor = isLight ? colors.cardMuted : colors.mutedText;
  const tagBackground = isLight ? colors.cardAlt : colors.surfaceAlt;
  const cardBorder = isLight ? "rgba(255,255,255,0.12)" : colors.surfaceAlt;
  const buttonBackground = colors.accent;

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradientWrapper, { shadowColor: colors.accent }]}
    >
      <View
        style={[styles.card, { backgroundColor: isLight ? "transparent" : colors.surface, borderColor: cardBorder }]}
      >
        <Text style={[styles.subtitle, { color: mutedColor }]}>Défi du jour</Text>
        <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
        <Text style={[styles.desc, { color: mutedColor }]}>{description}</Text>

        <View style={styles.row}>
          <View
            style={[styles.tag, { backgroundColor: tagBackground }]}
          >
            <Ionicons name="leaf-outline" size={14} color={colors.cardText} />
            <Text style={[styles.tagText, { color: colors.cardText }]}>{difficulty}</Text>
          </View>
          <TouchableOpacity style={[styles.validateBtn, { backgroundColor: buttonBackground }]} onPress={onValidate}>
            <Text style={styles.validateText}>Valider avec photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientWrapper: {
    marginTop: 18,
    borderRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 22,
    gap: 16,
  },
  subtitle: { fontSize: 13, fontWeight: "600", letterSpacing: 0.3 },
  title: { fontWeight: "700", fontSize: 18, lineHeight: 24 },
  desc: { fontSize: 14, lineHeight: 20, fontWeight: "500" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, flexDirection: "row", alignItems: "center" },
  tagText: { marginLeft: 6, fontSize: 13, fontWeight: "600" },
  validateBtn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 14 },
  validateText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
});
