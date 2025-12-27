// components/ui/profil/ChallengeHistoryList.tsx
import { FontFamilies } from "@/constants/fonts";
import { useChallenges } from "@/hooks/challenges-context";
import { useThemeMode } from "@/hooks/theme-context";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

// 🎨 THEME HISTORY
const historyTheme = {
    glassBg: ["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"] as const,
    borderColor: "rgba(255, 255, 255, 0.6)",
    entryBgLight: "rgba(255, 255, 255, 0.5)",
    textMain: "#0A3F33",
    textMuted: "#4A665F",
    accent: "#008F6B",
};

export function ChallengeHistoryList() {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";
  const { history } = useChallenges();

  // Couleurs dynamiques
  const titleColor = isLight ? historyTheme.textMain : colors.text;
  const mutedColor = isLight ? historyTheme.textMuted : colors.mutedText;
  const entryBg = isLight ? historyTheme.entryBgLight : "rgba(0, 151, 178, 0.1)";
  const entryBorder = isLight ? "rgba(255,255,255,0.3)" : "rgba(0, 151, 178, 0.2)";

  // Wrapper conditionnel
  const Wrapper = isLight ? LinearGradient : View;
  const wrapperProps = isLight 
    ? { 
        colors: historyTheme.glassBg, 
        start: { x: 0, y: 0 }, 
        end: { x: 1, y: 1 }, 
        style: [styles.card, styles.glassEffect] 
      }
    : { 
        style: [styles.card, { backgroundColor: "rgba(0, 151, 178, 0.1)", borderColor: "rgba(0, 151, 178, 0.2)", borderWidth: 1 }] 
      };

  if (history.length === 0) {
    return (
      <Wrapper {...(wrapperProps as any)}>
        <Text style={[styles.title, { color: titleColor }]}>Historique des défis</Text>
        <Text style={{ color: mutedColor, marginTop: 6, fontFamily: FontFamilies.body, fontStyle: 'italic' }}>
          Aucun défi validé pour le moment.
        </Text>
      </Wrapper>
    );
  }

  return (
    <Wrapper {...(wrapperProps as any)}>
      <Text style={[styles.title, { color: titleColor }]}>Historique des défis</Text>
      
      {history.map((h) => {
        const dt = new Date(h.validatedAt);
        const dateLabel = dt.toLocaleDateString();
        // const timeLabel = dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); 

        return (
          <View
            key={h.id}
            style={[
              styles.entry,
              { backgroundColor: entryBg, borderColor: entryBorder },
            ]}
          >
            {/* Info Gauche */}
            <View style={{ flex: 1 }}>
              <Text style={{ color: titleColor, fontFamily: FontFamilies.heading, fontSize: 15, marginBottom: 2 }}>
                {h.title}
              </Text>
              
              <Text style={{ color: mutedColor, fontSize: 12, fontFamily: FontFamilies.body }}>
                {dateLabel}
              </Text>

              {h.description ? (
                <Text
                  style={{ color: mutedColor, marginTop: 4, fontSize: 12, fontFamily: FontFamilies.body }}
                  numberOfLines={1}
                >
                  {h.description}
                </Text>
              ) : null}

              <Text style={{ color: isLight ? historyTheme.accent : colors.accent, fontFamily: FontFamilies.heading, fontSize: 13, marginTop: 6 }}>
                +{h.points} pts
              </Text>
            </View>

            {/* Photo Droite */}
            {h.photoUri && (
                <View style={styles.photoContainer}>
                    <Image source={{ uri: h.photoUri }} style={styles.photo} />
                </View>
            )}
          </View>
        );
      })}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 24,
    marginVertical: 10,
  },
  glassEffect: {
    borderWidth: 1,
    borderColor: historyTheme.borderColor,
    shadowColor: "#005c4b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  title: { fontSize: 18, fontFamily: FontFamilies.heading, marginBottom: 16, fontWeight: '700' },
  entry: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
  },
  photoContainer: {
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: "rgba(255,255,255,0.5)"
  },
  photo: { width: 56, height: 56 },
});