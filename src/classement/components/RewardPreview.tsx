import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

type Props = { greenies: number; qualified: boolean };

export function RewardPreview({ greenies, qualified }: Props) {
  if (!qualified) return <Text style={{ fontSize: 12, color: "#94a3b8" }}>—</Text>;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      <Text style={{ fontSize: 12, fontWeight: "800", color: "#008F6B" }}>+{greenies}</Text>
      <Ionicons name="leaf" size={10} color="#008F6B" />
    </View>
  );
}