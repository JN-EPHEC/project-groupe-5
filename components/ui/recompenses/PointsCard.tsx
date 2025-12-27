import { FontFamilies } from "@/constants/fonts";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface PointsCardProps {
  points: number;
}

export const PointsCard: React.FC<PointsCardProps> = ({ points }) => {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";

  // Thème Carte Points
  const gradientColors = isLight 
    ? ["#FFFFFF", "rgba(255,255,255,0.6)"] as const
    : ["rgba(0, 151, 178, 0.2)", "rgba(0, 151, 178, 0.05)"] as const;
    
  // Couleurs
  const activeColor = isLight ? "#008F6B" : colors.accent;
  const mutedColor = isLight ? "#4A665F" : colors.mutedText;

  return (
    <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.card, { borderColor: isLight ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.1)" }]}
    >
      <View style={styles.content}>
          {/* Icône Feuille */}
          <View style={[styles.iconBox, { backgroundColor: isLight ? "#E0F7EF" : "rgba(255,255,255,0.1)" }]}>
            <Ionicons name="leaf" size={24} color={activeColor} />
          </View>
          
          <View>
            <Text style={[styles.label, { color: mutedColor }]}>Solde disponible</Text>
            
            <View style={styles.valueRow}>
                <Text style={[styles.value, { color: activeColor }]}>
                    {points}
                </Text>
                <Text style={[styles.unit, { color: activeColor }]}>
                    Greenies
                </Text>
            </View>
          </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: { 
      borderRadius: 24, 
      padding: 20, 
      marginBottom: 24,
      borderWidth: 1,
      shadowColor: "#008F6B", 
      shadowOffset: { width: 0, height: 8 }, 
      shadowOpacity: 0.1, 
      shadowRadius: 12, 
      elevation: 4
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBox: { width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  
  label: { 
      fontSize: 14, 
      fontFamily: FontFamilies.body, 
      marginBottom: 0,
      marginTop: 6 // ✅ Descend un peu le label
  },

  valueRow: {
      flexDirection: 'row',
      alignItems: 'center', 
      marginTop: -8, // ✅ Resserre encore plus l'espace avec le label
      gap: 8,               
  },

  value: { 
      fontSize: 32, 
      fontFamily: FontFamilies.heading, 
      fontWeight: "800", 
  },

  unit: { 
      fontSize: 16, 
      fontFamily: FontFamilies.body,
      fontWeight: "600",
      marginTop: 8 // Ajusté pour s'aligner avec le bas du chiffre qui a remonté
  },
});