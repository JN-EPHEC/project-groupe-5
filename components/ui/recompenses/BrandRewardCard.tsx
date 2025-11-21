import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { BrandReward } from "./brandData.tsx";

export function BrandRewardCard({ item, canAfford, onObtain, onInfo }: { item: BrandReward; canAfford: boolean; onObtain: () => void; onInfo: () => void }) {
  const { colors, mode } = useThemeMode();

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.surface }]}>      
      <TouchableOpacity activeOpacity={0.9} onPress={onInfo} style={[styles.hero, { backgroundColor: item.bg }]}>        
        <Text style={styles.brandText}>{item.brand}</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>{item.badge}</Text></View>
      </TouchableOpacity>
      <View style={styles.infoRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: mode === "dark" ? "#EAF7F2" : "#0F3327" }]}>{item.brand}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedText }]}>{item.title}</Text>
        </View>
        <TouchableOpacity
          onPress={onObtain}
          disabled={!canAfford}
          style={[styles.leafCostBtn, { backgroundColor: canAfford ? colors.accent : colors.surfaceAlt }]}
          accessibilityLabel="Obtenir la récompense"
        >
          <Ionicons name="leaf" size={18} color={canAfford ? "#0F3327" : colors.mutedText} />
          <Text style={{ marginLeft: 6, fontWeight: "700", color: canAfford ? "#0F3327" : colors.mutedText }}>{item.costCoins}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 280,
    borderRadius: 20,
    padding: 12,
    marginRight: 14,
  },
  hero: {
    height: 140,
    borderRadius: 16,
    padding: 16,
    justifyContent: "space-between",
  },
  brandText: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "800",
  },
  badge: {
    alignSelf: "flex-end",
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontWeight: "700", color: "#0F3327" },
  infoRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  title: { fontSize: 16, fontWeight: "700" },
  subtitle: { fontSize: 12, marginTop: 2 },
  leafCostBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, height: 36, borderRadius: 18, justifyContent: "center" },
});
