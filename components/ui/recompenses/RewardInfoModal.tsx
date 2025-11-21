import { useThemeMode } from "@/hooks/theme-context";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { BrandReward } from "./brandData.tsx";

export function RewardInfoModal({ visible, reward, onClose }: { visible: boolean; reward?: BrandReward | null; onClose: () => void }) {
  const { colors } = useThemeMode();
  if (!reward) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>          
          <Text style={[styles.title, { color: colors.text }]}>{reward.brand}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedText }]}>{reward.title}</Text>
          <Text style={[styles.description, { color: colors.text }]}>{reward.description}</Text>
          <TouchableOpacity onPress={onClose} style={[styles.close, { backgroundColor: colors.accent }]}>
            <Text style={{ color: "#0F3327", fontWeight: "800" }}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  card: { borderRadius: 16, padding: 16, width: "100%", maxWidth: 480 },
  title: { fontSize: 20, fontWeight: "900" },
  subtitle: { marginTop: 4, fontWeight: "600" },
  description: { marginTop: 12, lineHeight: 20 },
  close: { marginTop: 16, alignSelf: "center", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
});
