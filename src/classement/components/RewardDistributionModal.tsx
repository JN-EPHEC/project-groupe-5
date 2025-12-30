import { useThemeMode } from "@/hooks/theme-context";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { REWARD_TABLE } from "../utils/rewardTable";

type Props = {
  visible: boolean;
  onClose: () => void;
};

// 🎨 CONFIGURATION DES COULEURS PILULES (Inchangé)
const getRewardStyle = (rank: number) => {
  let color = "#10B981"; 
  let textColor = "#FFFFFF"; 

  if (rank === 1) {
    color = "#FFD700"; 
    textColor = "#000000"; 
  } else if (rank === 2) {
    color = "#C0C0C0"; 
    textColor = "#000000"; 
  } else if (rank === 3) {
    color = "#CD7F32"; 
    textColor = "#FFFFFF";
  } else if (rank <= 5) {
    color = "#008F6B"; 
    textColor = "#FFFFFF";
  } else if (rank <= 10) {
    color = "#0ea5e9"; 
    textColor = "#FFFFFF";
  } else if (rank <= 25) {
    color = "#64748B"; 
    textColor = "#FFFFFF";
  }

  return { pillColor: color, pillTextColor: textColor };
};

export function RewardDistributionModal({ visible, onClose }: Props) {
  const { mode } = useThemeMode();
  const isLight = mode === "light";

  // --- CONFIGURATION DES THEMES ---
  
  // ☀️ LIGHT MODE : Inspiré de PremiumCard.tsx (Menthe Givrée)
  const lightGradient = ["rgba(240, 253, 244, 0.95)", "rgba(255, 255, 255, 0.95)"] as const;
  const lightBorder = "rgba(255, 255, 255, 0.6)";
  const lightText = "#0A3F33";
  const lightRowBg = "rgba(255, 255, 255, 0.5)"; // Fond de ligne semi-transparent pour l'effet verre
  const lightShadow = {
      shadowColor: "#005c4b",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 5
  };

  // 🌙 DARK MODE : Inspiré de AcceuilScreen.tsx (Sombre & Flat)
  // Fond sombre style "Acceuil" (#051F24 -> #031518)
  const darkGradient = ["#051F24", "#031518"] as const; 
  const darkBorder = "rgba(255, 255, 255, 0.1)";
  const darkText = "#FFFFFF";
  const darkRowBg = "rgba(255, 255, 255, 0.03)"; // Très subtil
  // Pas d'ombre en dark mode (Flat design demandé)
  const darkShadow = {
      shadowOpacity: 0,
      elevation: 0
  };

  // Sélection dynamique
  const gradientColors = isLight ? lightGradient : darkGradient;
  const borderColor = isLight ? lightBorder : darkBorder;
  const mainTextColor = isLight ? lightText : darkText;
  const rowBackgroundColor = isLight ? lightRowBg : darkRowBg;
  const rowBorderColor = isLight ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.05)";
  const containerShadow = isLight ? lightShadow : darkShadow;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Fond sombre derrière la modale */}
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.7)", 
          justifyContent: "center",
          padding: 18,
        }}
      >
        {/* CARTE MODALE (Avec Gradient) */}
        <LinearGradient
          colors={gradientColors as any}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 24,
            padding: 20,
            borderWidth: 1,
            borderColor: borderColor,
            ...containerShadow
          }}
        >
          {/* En-tête */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <Text style={{ color: mainTextColor, fontSize: 20, fontWeight: "800" }}>
              Récompenses 
            </Text>

            <Pressable
              onPress={onClose}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.1)",
              }}
            >
              <Text style={{ color: mainTextColor, fontWeight: "700", fontSize: 13 }}>Fermer</Text>
            </Pressable>
          </View>

          <Text style={{ color: isLight ? "#4A665F" : "#94a3b8", marginBottom: 16, fontSize: 14 }}>
            Répartition par classement (Top 50).
          </Text>

          {/* LISTE DES PALIERS */}
          <View style={{ gap: 10 }}>
            {REWARD_TABLE.map((t) => {
              const label = t.fromRank === t.toRank ? `#${t.fromRank}` : `#${t.fromRank} – #${t.toRank}`;
              const { pillColor, pillTextColor } = getRewardStyle(t.fromRank);

              return (
                <View
                  key={`${t.fromRank}-${t.toRank}`}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 14,
                    backgroundColor: rowBackgroundColor,
                    borderWidth: 1,
                    borderColor: rowBorderColor,
                  }}
                >
                  {/* GAUCHE : RANG */}
                  <Text style={{ 
                      color: isLight ? "#0A3F33" : pillColor, // En dark, couleur du rang pour contraste
                      fontWeight: "800", 
                      fontSize: 16 
                    }}>
                    {label}
                  </Text>

                  {/* DROITE : PILULE POINTS */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: pillColor, 
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 10,
                      minWidth: 110,
                      justifyContent: 'center',
                      // Ombres légères sur la pilule uniquement en Light
                      shadowColor: isLight ? pillColor : "transparent",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isLight ? 0.3 : 0,
                      shadowRadius: 3,
                      elevation: isLight ? 2 : 0,
                    }}
                  >
                    <Text style={{ color: pillTextColor, fontWeight: "800", fontSize: 14, marginRight: 4 }}>
                      +{t.greenies}
                    </Text>
                    <Text style={{ color: pillTextColor, fontWeight: "600", fontSize: 12 }}>greenies</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </LinearGradient>
      </Pressable>
    </Modal>
  );
}