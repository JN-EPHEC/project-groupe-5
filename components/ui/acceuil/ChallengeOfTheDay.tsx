import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type ChallengeOfTheDayProps = {
  title: string;
  description: string;
  difficulty: string;
  onValidate?: () => void;
};

export function ChallengeOfTheDay({ title, description, difficulty, onValidate }: ChallengeOfTheDayProps) {
  const { colors } = useThemeMode();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Text style={[styles.subtitle, { color: colors.mutedText }]}>Défi du jour</Text>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.desc, { color: colors.mutedText }]}>{description}</Text>

      <View style={styles.row}>
        <View style={[styles.tag, { backgroundColor: colors.surfaceAlt }]}>
          <Ionicons name="leaf-outline" size={14} color="#fff" />
          <Text style={styles.tagText}>{difficulty}</Text>
        </View>
        <TouchableOpacity style={[styles.validateBtn, { backgroundColor: colors.accent }]} onPress={onValidate}>
          <Text style={styles.validateText}>Valider avec photo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 14, marginTop: 18 },
  subtitle: { fontSize: 13, marginBottom: 6 },
  title: { fontWeight: "600", fontSize: 16 },
  desc: { marginTop: 6, marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, flexDirection: "row", alignItems: "center" },
  tagText: { color: "#fff", marginLeft: 4, fontSize: 12 },
  validateBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12 },
  validateText: { color: "#fff", fontWeight: "600" },
});
