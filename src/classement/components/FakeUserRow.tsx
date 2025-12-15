// src/classement/components/FakeUserRow.tsx
import React from "react";
import { Text, View } from "react-native";

export function FakeUserRow({ rank }: { rank: number }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderRadius: 16,
        marginBottom: 8,
        backgroundColor: "#0b1f26",
        opacity: 0.4,
      }}
    >
      <Text style={{ width: 24, fontWeight: "800", color: "white" }}>
        {rank}
      </Text>
      <Text style={{ color: "#94a3b8" }}>
        FakeUser {rank}
      </Text>
    </View>
  );
}
