import { MonthlyCalendar } from "@/components/ui/acceuil/MonthlyCalendar";
import { useThemeMode } from "@/hooks/theme-context";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function CalendrierScreen() {
  const router = useRouter();
  const { colors } = useThemeMode();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TouchableOpacity onPress={() => router.back()} style={{ padding: 12 }}>
        <Text style={{ color: colors.text }}>Retour</Text>
      </TouchableOpacity>
      <MonthlyCalendar />
    </View>
  );
}
