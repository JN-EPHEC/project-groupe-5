import { useThemeMode } from "@/hooks/theme-context";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export interface Reward {
  id: string;
  name: string;
  cost: number;
  image: string;
}

interface RewardCardProps {
  item: Reward;
  points: number;
  onObtain: () => void;
}

export const RewardCard: React.FC<RewardCardProps> = ({ item, points, onObtain }) => {
  const { colors } = useThemeMode();
  const canObtain = points >= item.cost;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
      <Text style={[styles.cost, { color: colors.mutedText }]}>{item.cost} pts</Text>

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: canObtain ? colors.accent : colors.surfaceAlt },
        ]}
        disabled={!canObtain}
        onPress={onObtain}
      >
        <Text
          style={[
            styles.buttonText,
            { color: canObtain ? colors.text : colors.mutedText },
          ]}
        >
          {canObtain ? "Obtenir" : "Insuffisant"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 12, alignItems: "center", width: 150, marginRight: 12 },
  image: { width: 60, height: 60, marginBottom: 10 },
  name: { fontSize: 14, fontWeight: "bold", marginBottom: 5, textAlign: "center" },
  cost: { fontSize: 12, marginBottom: 8 },
  button: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20 },
  buttonText: { fontWeight: "600", fontSize: 12 },
});
