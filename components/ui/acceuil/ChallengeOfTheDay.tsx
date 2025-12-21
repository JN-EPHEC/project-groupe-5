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

// 🎨 THEME & COULEURS
const ACTION_GRADIENT = ["#FF9D7E", "#FF8C66"] as const; // Dégradé Corail
const GLASS_BG = ["rgba(240, 253, 244, 0.95)", "rgba(255, 255, 255, 0.85)"] as const; // Fond Menthe Givrée

export const ChallengeOfTheDay: React.FC<ChallengeOfTheDayProps> = ({ 
  title, 
  description, 
  difficulty, 
  onValidate 
}) => {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";

  // Gestion de la couleur du badge selon la difficulté
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "Facile": return "#19D07D";
      case "Moyen": return "#F6D365";
      case "Difficile": return "#F45B69";
      default: return "#19D07D";
    }
  };
  const badgeColor = getDifficultyColor(difficulty);

  const renderContent = () => (
    <>
      {/* Header : Flamme + Titre "DÉFI DU JOUR" */}
      <View style={styles.headerRow}>
        <Ionicons 
          name="flame-outline" 
          size={18} 
          color={isLight ? "#FF8C66" : "#4FD1C5"} 
          style={{ marginRight: 6 }} 
        />
        <Text style={[styles.headerLabel, { color: isLight ? "#FF8C66" : "#4FD1C5" }]}>
          DÉFI DU JOUR
        </Text>
      </View>

      {/* Titre du défi */}
      <Text 
        style={[styles.title, { color: isLight ? "#0A3F33" : colors.text }]} 
        numberOfLines={2}
      >
        {title}
      </Text>

      {/* Description */}
      <Text 
        style={[styles.description, { color: isLight ? "#4A665F" : colors.mutedText }]} 
        numberOfLines={3}
      >
        {description}
      </Text>

      {/* Footer : Badge + Bouton Action */}
      <View style={styles.footer}>
        <View style={[
            styles.badge, 
            { 
              borderColor: badgeColor, 
              backgroundColor: isLight ? `${badgeColor}15` : "rgba(0,0,0,0.2)" 
            }
        ]}>
          <Ionicons name="leaf-outline" size={14} color={badgeColor} style={{ marginRight: 4 }} />
          <Text style={[styles.badgeText, { color: badgeColor }]}>{difficulty}</Text>
        </View>

        <View style={{ width: 180 }}> 
          <GradientButton 
            label="Valider avec photo" 
            onPress={onValidate} 
            // En Light : Corail. En Dark : Défaut (Vert)
            colors={isLight ? ACTION_GRADIENT : undefined} 
            style={{ borderRadius: 16 }} 
          />
        </View>
      </View>
    </>
  );

  // --- RENDU DARK MODE ---
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

  // --- RENDU LIGHT MODE (Menthe Givrée) ---
  return (
    <LinearGradient
        colors={GLASS_BG}
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 1 }}
        style={[styles.card, styles.glassEffect]}
    >
      {renderContent()}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: { 
    padding: 20, 
    borderRadius: 26, 
    width: "100%", 
    minHeight: 180, 
    justifyContent: 'space-between' 
  },
  glassEffect: { 
    borderWidth: 1, 
    borderColor: "rgba(255, 255, 255, 0.6)", 
    shadowColor: "#005c4b", 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.06, 
    shadowRadius: 16, 
    elevation: 3 
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  headerLabel: { fontSize: 13, fontFamily: FontFamilies.heading, letterSpacing: 0.5 },
  title: { fontSize: 20, fontFamily: FontFamilies.heading, marginBottom: 8, lineHeight: 26 },
  description: { fontSize: 15, fontFamily: FontFamilies.headingMedium, marginBottom: 20, lineHeight: 22 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: "auto" },
  badge: { flexDirection: "row", alignItems: "center", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 13, fontFamily: FontFamilies.headingMedium },
});