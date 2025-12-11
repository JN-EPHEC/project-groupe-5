import { FontFamilies } from "@/constants/fonts";
import { useChallenges } from "@/hooks/challenges-context";
import { useThemeMode } from "@/hooks/theme-context";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export function ChallengeHistoryList() {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";
  const gradient = isLight
    ? ([colors.cardAlt, colors.card] as const)
    : (["rgba(0, 151, 178, 0.2)", "rgba(0, 151, 178, 0.05)"] as const);
  const { history } = useChallenges();

  if (history.length === 0) {
    return (
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, { borderColor: isLight ? "rgba(255,255,255,0.12)" : "rgba(0, 151, 178, 0.3)", shadowColor: isLight ? colors.card : colors.accent }]}>
        <Text style={[styles.title, { color: isLight ? colors.cardText : colors.text }]}>Historique des défis</Text>
        <Text style={{ color: isLight ? colors.cardMuted : colors.mutedText, marginTop: 6, fontFamily: FontFamilies.body }}>
          Aucun défi validé pour le moment.
        </Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, { borderColor: isLight ? "rgba(255,255,255,0.12)" : "rgba(0, 151, 178, 0.3)", shadowColor: isLight ? colors.card : colors.accent }]}>
      <Text style={[styles.title, { color: isLight ? colors.cardText : colors.text }]}>Historique des défis</Text>
      {history.map((h) => {
        const dt = new Date(h.validatedAt);
        const dateLabel = dt.toLocaleDateString();
        const timeLabel = dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        return (
          <View
            key={h.id}
            style={[
              styles.entry,
              {
                backgroundColor: isLight ? colors.cardAlt : "rgba(0, 151, 178, 0.1)",
                borderColor: isLight ? "rgba(255,255,255,0.12)" : "rgba(0, 151, 178, 0.2)",
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: isLight ? colors.cardText : colors.text, fontFamily: FontFamilies.heading }}>{h.title}</Text>
              <Text style={{ color: isLight ? colors.cardMuted : colors.mutedText, fontSize: 12, fontFamily: FontFamilies.body }}>
                {dateLabel} • {timeLabel}
              </Text>
              {h.description ? (
                <Text
                  style={{ color: isLight ? colors.cardMuted : colors.mutedText, marginTop: 4, fontSize: 12, fontFamily: FontFamilies.body }}
                  numberOfLines={2}
                >
                  {h.description}
                </Text>
              ) : null}
              <Text style={{ color: colors.accent, fontFamily: FontFamilies.headingMedium, marginTop: 6 }}>
                {h.points} pts
              </Text>
            </View>
            {h.photoUri ? <Image source={{ uri: h.photoUri }} style={styles.photo} /> : null}
          </View>
        );
      })}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    borderRadius: 22,
    marginVertical: 10,
    borderWidth: 1,
    position: "relative",
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  title: { fontSize: 18, fontFamily: FontFamilies.heading, marginBottom: 14 },
  entry: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
  },
  photo: { width: 56, height: 56, borderRadius: 12, marginLeft: 8 },
});
