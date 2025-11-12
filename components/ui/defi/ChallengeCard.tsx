import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CATEGORY_CONFIG, DIFFICULTY_COLORS } from "./constants";
import { Challenge } from "./types";

type Props = {
  challenge: Challenge;
  isOngoing: boolean;
  onToggle: (id: number) => void;
};

export function ChallengeCard({ challenge, isOngoing, onToggle }: Props) {
  const { colors } = useThemeMode();
  const category = CATEGORY_CONFIG[challenge.category];

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <View style={[styles.categoryPill, { backgroundColor: colors.surfaceAlt }]}>
          <Ionicons name={category.icon} size={16} color="#7DCAB0" />
          <Text style={styles.categoryText}>{category.label}</Text>
        </View>

        <View style={styles.pointsBadge}>
          <Ionicons name="leaf" size={16} color="#0F3327" />
          <Text style={styles.pointsText}>{challenge.points} pts</Text>
        </View>
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{challenge.title}</Text>
      <Text style={[styles.description, { color: colors.mutedText }]}>{challenge.description}</Text>

      <View style={styles.metaRow}>
        <View style={[styles.metaPill, { backgroundColor: DIFFICULTY_COLORS[challenge.difficulty] }]}>
          <Ionicons name="speedometer-outline" size={16} color="#0F3327" />
          <Text style={styles.metaTextDark}>{challenge.difficulty}</Text>
        </View>

        <View style={[styles.metaPillMuted, { backgroundColor: colors.surfaceAlt }]}>
          <Ionicons name="time-outline" size={16} color="#9FB9AE" />
          <Text style={styles.metaText}>{challenge.timeLeft}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, isOngoing && styles.primaryButtonActive]}
        onPress={() => onToggle(challenge.id)}
      >
        <Text style={[styles.primaryText, isOngoing && styles.primaryTextActive]}>
          {isOngoing ? "Défi en cours" : "Relever le défi"}
        </Text>
        <Ionicons
          name={isOngoing ? "checkmark-circle" : "arrow-forward"}
          size={18}
          color={isOngoing ? "#7DCAB0" : "#0F3327"}
          style={{ marginLeft: 8 }}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, padding: 20, marginBottom: 18 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  categoryPill: { flexDirection: "row", alignItems: "center", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  categoryText: { color: "#7DCAB0", fontWeight: "600", marginLeft: 6 },
  pointsBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#D4F7E7", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  pointsText: { color: "#0F3327", fontWeight: "700", marginLeft: 6 },
  title: { fontSize: 18, fontWeight: "700", marginTop: 16 },
  description: { marginTop: 8, lineHeight: 20 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 16 },
  metaPill: { flexDirection: "row", alignItems: "center", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginRight: 10 },
  metaPillMuted: { flexDirection: "row", alignItems: "center", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  metaText: { color: "#9FB9AE", marginLeft: 6, fontWeight: "600" },
  metaTextDark: { color: "#0F3327", marginLeft: 6, fontWeight: "700" },
  primaryButton: { marginTop: 20, backgroundColor: "#D4F7E7", borderRadius: 18, paddingVertical: 12, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  primaryButtonActive: { backgroundColor: "#142822", borderWidth: 1, borderColor: "#7DCAB0" },
  primaryText: { color: "#0F3327", fontWeight: "700" },
  primaryTextActive: { color: "#7DCAB0" },
});
