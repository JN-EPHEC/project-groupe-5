import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export interface Reward {
  id: string;
  name: string;
  image: string;
  earningText: string; // ex: "5 pts par € dépensé"
}

interface RewardCardProps {
  item: Reward;
}

export const RewardCard: React.FC<RewardCardProps> = ({ item }) => {
  const { colors } = useThemeMode();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}> 
      <Image source={{ uri: item.image }} style={styles.image} />
      <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
      <View style={styles.earningRow}>
        <Ionicons name="leaf-outline" size={14} color={colors.accent} />
        <Text style={[styles.earningText, { color: colors.mutedText }]}>{item.earningText}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 12, width: '100%', marginBottom: 12 },
  image: { width: '100%', height: 120, borderRadius: 12, marginBottom: 10 },
  name: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  earningRow: { flexDirection: 'row', alignItems: 'center' },
  earningText: { marginLeft: 6, fontSize: 12, fontWeight: '600' },
});
