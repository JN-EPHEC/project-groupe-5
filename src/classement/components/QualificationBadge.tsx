// src/classement/components/QualificationBadge.tsx
import React from "react";
import { Text, View } from "react-native";

type Props = {
  qualified: boolean;
};

export function QualificationBadge({ qualified }: Props) {
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: qualified ? "#22c55e33" : "#ef444433",
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: "700",
          color: qualified ? "#22c55e" : "#ef4444",
        }}
      >
        {qualified ? "Qualifié" : "Non qualifié"}
      </Text>
    </View>
  );
}
