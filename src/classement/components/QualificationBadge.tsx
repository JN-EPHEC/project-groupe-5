import React from "react";
import { Text, View } from "react-native";

export function QualificationBadge({ qualified }: { qualified: boolean }) {
  return (
    <View style={{
      paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
      backgroundColor: qualified ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
      borderWidth: 1,
      borderColor: qualified ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"
    }}>
      <Text style={{ fontSize: 10, fontWeight: "700", color: qualified ? "#15803d" : "#b91c1c" }}>
        {qualified ? "QUALIFIÉ" : "NON QUALIFIÉ"}
      </Text>
    </View>
  );
}