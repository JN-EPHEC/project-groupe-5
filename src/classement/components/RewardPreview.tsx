// src/classement/components/RewardPreview.tsx
import React from "react";
import { Text } from "react-native";

type Props = {
  greenies: number;
  qualified: boolean;
};

export function RewardPreview({ greenies, qualified }: Props) {
  if (!qualified) {
    return (
      <Text style={{ fontSize: 12, color: "#94a3b8" }}>
        —
      </Text>
    );
  }

  return (
    <Text style={{ fontSize: 12, fontWeight: "700", color: "#22c55e" }}>
      +{greenies} Greenies
    </Text>
  );
}
