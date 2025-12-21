import { FontFamilies } from "@/constants/fonts";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

export type RankCardProps = {
  value: string;
  label: string;
  style?: ViewStyle;
  active?: boolean;
  icon?: keyof typeof Ionicons.glyphMap; // ✅ Support pour l'icône
};

// 🎨 THEME RANK CARD (Menthe & Corail)
const rankTheme = {
    lightGradient: ["#FFFFFF", "#F2FBF7"] as const, // Blanc vers Menthe très pâle
    borderColor: "rgba(0, 143, 107, 0.2)", // Bordure verte subtile
    valueText: "#08332A", // Vert Forêt
    labelText: "#6E8580", // Gris Vert
    iconCoral: "#FF8C66", // 🧡 Accent Corail
    shadow: "rgba(0, 143, 107, 0.1)"
};

export function RankCard({ value, label, style, active = false, icon }: RankCardProps) {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";

  // --- GESTION DES COULEURS ---
  
  // Fond : Dégradé Menthe en Light, Logique Dark existante conservée
  const gradientColors = isLight
    ? rankTheme.lightGradient
    : (active
        ? ([colors.surfaceAlt, colors.surface] as const)
        : ([colors.surface, colors.surfaceAlt] as const));

  // Bordure : Verte en Light, existante en Dark
  const borderColor = isLight ? rankTheme.borderColor : colors.surfaceAlt;
  
  // Textes
  const valueColor = isLight ? rankTheme.valueText : colors.text;
  const labelColor = isLight ? rankTheme.labelText : colors.mutedText;

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.card, 
        { 
            borderColor, 
            // Ombre portée uniquement en Light pour le relief Glassmorphism
            shadowColor: isLight ? rankTheme.shadow : "transparent",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isLight ? 1 : 0,
            shadowRadius: 12,
            elevation: isLight ? 3 : 0
        }, 
        style
      ]}
    >
      {/* En-tête : Label à gauche, Icône Corail à droite */}
      <View style={styles.headerRow}>
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
        
        {/* 🔥 L'icône Corail (affichée uniquement si fournie) */}
        {icon && (
            <View style={styles.iconContainer}>
                <Ionicons name={icon} size={18} color={isLight ? rankTheme.iconCoral : "#FFF"} />
            </View>
        )}
      </View>

      {/* Valeur en gros (Vert Forêt) */}
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { 
    padding: 16, 
    borderRadius: 22, 
    borderWidth: 1, 
    width: "100%",
    minHeight: 100,
    justifyContent: 'space-between'
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  iconContainer: {
    opacity: 0.9
  },
  value: { 
    fontSize: 26, 
    fontFamily: FontFamilies.heading,
    letterSpacing: -0.5
  },
  label: { 
    fontSize: 14, 
    fontFamily: FontFamilies.headingMedium,
    textTransform: 'capitalize'
  },
});