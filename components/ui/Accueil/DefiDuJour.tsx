import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function DefiDuJour() {
  const { colors } = useThemeMode();

  return (
    <View style={[styles.challengeCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.challengeTitle, { color: colors.mutedText }]}>Défi du jour</Text>
      <Text style={[styles.challengeName, { color: colors.text }]}>Recycler 3 bouteilles plastiques</Text>

      <Text style={[styles.challengeDesc, { color: colors.mutedText }]}>
        Recyclez 3 bouteilles en plastique et prenez une photo de votre geste écologique.
      </Text>

      <View style={styles.row}>
        <View style={[styles.tag, { backgroundColor: colors.surfaceAlt }]}>
          <Ionicons name="leaf-outline" size={14} color="#fff" />
          <Text style={styles.tagText}>Facile</Text>
        </View>

        <TouchableOpacity style={[styles.validateBtn, { backgroundColor: colors.accent }]}>
          <Text style={styles.validateText}>Valider avec photo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  challengeCard: { padding: 16, borderRadius: 14, marginTop: 18 },
  challengeTitle: { fontSize: 13, marginBottom: 6 },
  challengeName: { fontWeight: "600", fontSize: 16 },
  challengeDesc: { marginTop: 6, marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, flexDirection: "row", alignItems: "center" },
  tagText: { color: "#fff", marginLeft: 4, fontSize: 12 },
  validateBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12 },
  validateText: { color: "#fff", fontWeight: "600" },
});
