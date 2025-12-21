import { FontFamilies } from "@/constants/fonts";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient"; // ✅ AJOUT
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface LargeCardProps {
  icon: string;
  label: string;
  value: string;
}

// 🎨 THEME LARGE CARD
const cardTheme = {
    glassBg: ["rgba(255, 255, 255, 0.85)", "rgba(255, 255, 255, 0.65)"] as const,
    borderColor: "rgba(255, 255, 255, 0.6)",
    textMain: "#0A3F33",
    textMuted: "#4A665F",
    accent: "#008F6B",
};

export const LargeCard: React.FC<LargeCardProps> = ({ icon, label, value }) => {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";

  const cardText = isLight ? cardTheme.textMain : colors.text;
  const cardMuted = isLight ? cardTheme.textMuted : colors.mutedText;
  const accentColor = isLight ? cardTheme.accent : colors.accent;

  // Wrapper conditionnel
  const Wrapper = isLight ? LinearGradient : View;
  const wrapperProps = isLight 
    ? { 
        colors: cardTheme.glassBg, 
        start: { x: 0, y: 0 }, 
        end: { x: 1, y: 1 }, 
        style: [styles.card, styles.glassEffect] 
      }
    : { 
        style: [styles.card, { backgroundColor: "rgba(0, 151, 178, 0.1)", borderColor: "rgba(255,255,255,0.1)", borderWidth: 1 }] 
      };

  return (
    <Wrapper {...(wrapperProps as any)}> 
      <View style={[styles.iconBox, { backgroundColor: isLight ? "#E0F7EF" : "rgba(255,255,255,0.1)" }]}>
        <Ionicons name={icon as any} size={24} color={accentColor} />
      </View>
      <View style={{ alignItems: 'center' }}>
        <Text style={[styles.label, { color: cardMuted }]}>{label}</Text>
        <Text style={[styles.value, { color: cardText }]}>{value}</Text>
      </View>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  card: { 
      borderRadius: 20, 
      padding: 20, 
      marginVertical: 8, 
      alignItems: "center",
      flexDirection: 'row', // On passe en ligne si possible, sinon garde en colonne
      justifyContent: 'space-between'
  },
  glassEffect: {
    borderWidth: 1,
    borderColor: cardTheme.borderColor,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  iconBox: {
      width: 48, height: 48, borderRadius: 16,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 0
  },
  label: { fontSize: 13, fontFamily: FontFamilies.body, textAlign: 'right' },
  value: { fontSize: 18, fontFamily: FontFamilies.heading, fontWeight: "800", marginTop: 2, textAlign: 'right' },
});