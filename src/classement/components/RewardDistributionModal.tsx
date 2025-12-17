import { useThemeMode } from "@/hooks/theme-context";
import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { REWARD_TABLE } from "../utils/rewardTable";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function RewardDistributionModal({ visible, onClose }: Props) {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Backdrop */}
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.55)",
          justifyContent: "center",
          padding: 18,
        }}
      >
        {/* Card */}
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: isLight ? colors.surface : "#071A1E",
            borderRadius: 22,
            padding: 18,
            borderWidth: 1,
            borderColor: isLight ? colors.surfaceAlt : "rgba(255,255,255,0.08)",
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: "800" }}>
              Récompenses (Greenies)
            </Text>

            <Pressable
              onPress={onClose}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 12,
                backgroundColor: isLight ? colors.surfaceAlt : "rgba(255,255,255,0.06)",
              }}
            >
              <Text style={{ color: colors.text, fontWeight: "800" }}>Fermer</Text>
            </Pressable>
          </View>

          <Text style={{ color: colors.mutedText, marginTop: 8 }}>
            Répartition par classement (Top 50).
          </Text>

          <View style={{ marginTop: 14, gap: 8 }}>
            {REWARD_TABLE.map((t) => {
              const label =
                t.fromRank === t.toRank ? `#${t.fromRank}` : `#${t.fromRank} – #${t.toRank}`;

              return (
                <View
                  key={`${t.fromRank}-${t.toRank}`}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 14,
                    backgroundColor: isLight ? colors.surfaceAlt : "rgba(255,255,255,0.05)",
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: "700" }}>{label}</Text>

                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 12,
                      backgroundColor: "rgba(82, 209, 146, 0.18)",
                      borderWidth: 1,
                      borderColor: "rgba(82, 209, 146, 0.35)",
                    }}
                  >
                    <Text style={{ color: colors.text, fontWeight: "800" }}>
                      +{t.greenies} greenies
                    </Text>
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
