import { useThemeMode } from "@/hooks/theme-context";
import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { REWARD_TABLE } from "../utils/rewardTable";

type Props = {
  visible: boolean;
  onClose: () => void;
};

// 🎨 CONFIGURATION DES COULEURS (Style "Pilule" comme sur ta photo)
const getRewardStyle = (rank: number) => {
  // Par défaut (Vert standard)
  let color = "#10B981"; 
  let textColor = "#FFFFFF"; // Texte blanc dans la pilule par défaut

  if (rank === 1) {
    color = "#FFD700"; // Or
    textColor = "#000000"; // Texte noir pour contraste sur l'Or
  } else if (rank === 2) {
    color = "#C0C0C0"; // Argent
    textColor = "#000000"; // Texte noir
  } else if (rank === 3) {
    color = "#CD7F32"; // Bronze
    textColor = "#FFFFFF";
  } else if (rank <= 5) {
    color = "#008F6B"; // Vert foncé/Teal (4-5)
    textColor = "#FFFFFF";
  } else if (rank <= 10) {
    color = "#0ea5e9"; // Bleu Océan (6-10)
    textColor = "#FFFFFF";
  } else if (rank <= 25) {
    color = "#64748B"; // Gris Bleu / Slate (11-25)
    textColor = "#FFFFFF";
  } else if (rank <= 50) {
    color = "#10B981"; // Vert Émeraude (26-50)
    textColor = "#FFFFFF";
  }

  return { pillColor: color, pillTextColor: textColor };
};

export function RewardDistributionModal({ visible, onClose }: Props) {
  const { mode } = useThemeMode();
  const isLight = mode === "light";

  // Couleur du texte principal (Titre, bouton fermer)
  const mainTextColor = isLight ? "#0A3F33" : "#FFFFFF";
  // Couleur de fond de la modale
  const modalBg = isLight ? "#FFFFFF" : "#0F172A";
  // Couleur de fond des lignes (très subtile)
  const rowBg = isLight ? "#F8FAFC" : "rgba(255, 255, 255, 0.03)";
  const borderColor = isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Fond flouté sombre derrière */}
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.7)", // Plus sombre pour faire ressortir la modale
          justifyContent: "center",
          padding: 18,
        }}
      >
        {/* Carte Modale */}
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: modalBg,
            borderRadius: 24,
            padding: 20,
            borderWidth: 1,
            borderColor: isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 10,
          }}
        >
          {/* En-tête */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <Text style={{ color: mainTextColor, fontSize: 20, fontWeight: "800" }}>
              Récompenses (Greenies)
            </Text>

            <Pressable
              onPress={onClose}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: isLight ? "#E2E8F0" : "rgba(255,255,255,0.1)",
              }}
            >
              <Text style={{ color: mainTextColor, fontWeight: "700", fontSize: 13 }}>Fermer</Text>
            </Pressable>
          </View>

          <Text style={{ color: isLight ? "#64748b" : "#94a3b8", marginBottom: 16, fontSize: 14 }}>
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
                    backgroundColor: rowBg, // Fond de ligne léger
                    borderWidth: 1,
                    borderColor: borderColor,
                  }}
                >
                  {/* GAUCHE : RANG (Texte coloré comme la pilule) */}
                  <Text style={{ 
                      color: isLight ? "#334155" : pillColor, // En dark mode, le texte prend la couleur du rang pour briller
                      fontWeight: "800", 
                      fontSize: 16 
                    }}>
                    {label}
                  </Text>

                  {/* DROITE : PILULE POINTS (Style bouton plein) */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: pillColor, // Fond coloré (Or, Argent...)
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 10,
                      shadowColor: pillColor,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isLight ? 0.2 : 0.4,
                      shadowRadius: 4,
                      elevation: 3,
                      minWidth: 110, // Largeur fixe pour aligner joliement
                      justifyContent: 'center'
                    }}
                  >
                    <Text style={{ color: pillTextColor, fontWeight: "800", fontSize: 14, marginRight: 4 }}>
                      +{t.greenies}
                    </Text>
                    {/* Le mot "greenies" ou juste l'icône si tu préfères court */}
                    <Text style={{ color: pillTextColor, fontWeight: "600", fontSize: 12 }}>greenies</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}