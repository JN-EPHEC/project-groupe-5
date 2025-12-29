import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

export function FakeUserRow({ rank }: { rank: number }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderRadius: 20,
        marginBottom: 8,
        backgroundColor: "rgba(0, 0, 0, 0.2)", // Fond sombre translucide
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)", // Bordure subtile
        borderStyle: "dashed"
      }}
    >
      <View style={{ width: 45, alignItems: 'center', marginRight: 4 }}>
        <Text style={{ fontWeight: "700", color: "#4B5563", fontSize: 16 }}>#{rank}</Text>
      </View>
      
      <View style={{ 
          width: 40, height: 40, borderRadius: 20, 
          backgroundColor: "rgba(255,255,255,0.05)", marginRight: 14,
          alignItems: 'center', justifyContent: 'center'
      }}>
          <Ionicons name="person" size={16} color="#4B5563" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ color: "#6B7280", fontStyle: 'italic', fontSize: 14 }}>
          Place libre
        </Text>
      </View>
      
      <Text style={{ color: "#4B5563", fontSize: 12 }}>--- pts</Text>
    </View>
  );
}