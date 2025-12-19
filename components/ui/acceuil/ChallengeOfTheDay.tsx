import { GradientButton } from "@/components/ui/common/GradientButton";
import { FontFamilies } from "@/constants/fonts";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface ChallengeOfTheDayProps {
  title: string;
  description: string;
  difficulty: "Facile" | "Moyen" | "Difficile";
  onValidate: () => void;
}

// Le gradient exact de la PremiumCard
const PREMIUM_GRADIENT = [
  "#99E2B4",
  "#88D4AB",
  "#78C6A3",
  "#67B99A",
  "#56AB91",
  "#469D89",
  "#358F80",
  "#248277",
  "#14746F",
] as const;

export const ChallengeOfTheDay: React.FC<ChallengeOfTheDayProps> = ({
  title,
  description,
  difficulty,
  onValidate,
}) => {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";

  // Couleurs de difficulté
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "Facile": return "#19D07D"; // Vert
      case "Moyen": return "#F6D365"; // Jaune
      case "Difficile": return "#F45B69"; // Rouge
      default: return "#19D07D";
    }
  };

  const badgeColor = getDifficultyColor(difficulty);

  // Le contenu interne de la carte
  const renderContent = () => (
    <>
      <View style={styles.headerRow}>
        <Ionicons 
          name="flame-outline" 
          size={18} 
          color={isLight ? "#15803D" : "#4FD1C5"} 
          style={{ marginRight: 6 }} 
        />
        <Text style={[styles.headerLabel, { color: isLight ? "#15803D" : "#4FD1C5" }]}>
          DÉFI DU JOUR
        </Text>
      </View>

      <Text 
        style={[styles.title, { color: isLight ? "#0F172A" : colors.text }]} 
        numberOfLines={2}
      >
        {title}
      </Text>

      <Text 
        style={[styles.description, { color: isLight ? "#64748B" : colors.mutedText }]} 
        numberOfLines={3}
      >
        {description}
      </Text>

      <View style={styles.footer}>
        {/* Badge Difficulté */}
        <View style={[
            styles.badge, 
            { 
                borderColor: badgeColor, 
                backgroundColor: isLight ? "transparent" : "rgba(0,0,0,0.2)" 
            }
        ]}>
          <Ionicons name="leaf-outline" size={14} color={badgeColor} style={{ marginRight: 4 }} />
          <Text style={[styles.badgeText, { color: badgeColor }]}>{difficulty}</Text>
        </View>

        {/* Bouton avec le Gradient Premium */}
        <View style={{ width: 180 }}> 
          <GradientButton 
            label="Valider avec photo" 
            onPress={onValidate}
            colors={PREMIUM_GRADIENT} // Utilisation du gradient complexe
            style={{ borderRadius: 16 }} 
          />
        </View>
      </View>
    </>
  );

  // --- RENDU CONDITIONNEL SELON LE THEME ---

  // MODE SOMBRE (Liquid Ice Style - Comme ProgressionCard)
  if (!isLight) {
    const gradientColors = ["rgba(0, 151, 178, 0.2)", "rgba(0, 151, 178, 0.05)"] as const;
    return (
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { borderWidth: 1, borderColor: 'rgba(0, 151, 178, 0.3)' }]}
      >
        {renderContent()}
      </LinearGradient>
    );
  }

  // MODE CLAIR (Style épuré avec bordure)
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderWidth: 1, borderColor: '#19D07D' }]}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 24,
    width: "100%",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    minHeight: 180,
    justifyContent: 'space-between'
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLabel: {
    fontSize: 13,
    fontFamily: FontFamilies.heading, 
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
    fontFamily: FontFamilies.heading,
    marginBottom: 8,
    lineHeight: 26,
  },
  description: {
    fontSize: 15,
    fontFamily: FontFamilies.headingMedium,
    marginBottom: 20,
    lineHeight: 22,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "auto",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 13,
    fontFamily: FontFamilies.headingMedium,
  },
});