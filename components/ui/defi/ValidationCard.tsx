import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CATEGORY_CONFIG } from "./constants";
import { Challenge } from "./types";

type Props = {
  challenge: Challenge;
};

export function ValidationCard({ challenge }: Props) {
  const { colors } = useThemeMode();
  const category = CATEGORY_CONFIG[challenge.category];

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      {/* HEADER */}
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

      {/* TITRE */}
      <Text style={[styles.title, { color: colors.text }]}>{challenge.title}</Text>

      {/* BOÎTE DE PREUVE */}
      <View style={[styles.proofBox, { backgroundColor: colors.surfaceAlt }]}>
        <Ionicons name="image-outline" size={36} color="#5C6F69" />
        <Text style={[styles.proofText, { color: colors.mutedText }]}>Preuve à vérifier</Text>
      </View>

      {/* ACTIONS */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: colors.surfaceAlt }]}>
          <Ionicons name="close-circle" size={18} color="#EBE6D3" style={styles.leadingIcon} />
          <Text style={[styles.secondaryText, { color: "#EBE6D3" }]}>Refuser</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.successButton, { backgroundColor: colors.accent }]}>
          <Ionicons name="checkmark-circle" size={18} color="#0F3327" style={styles.leadingIcon} />
          <Text style={styles.successText}>Valider</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryText: {
    color: "#7DCAB0",
    fontWeight: "600",
    marginLeft: 6,
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D4F7E7",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pointsText: {
    color: "#0F3327",
    fontWeight: "700",
    marginLeft: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
  },
  proofBox: {
    borderRadius: 18,
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },
  proofText: {
    marginTop: 12,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    paddingVertical: 12,
    width: "48%",
  },
  secondaryText: {
    fontWeight: "600",
  },
  successButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    paddingVertical: 12,
    width: "48%",
  },
  successText: {
    color: "#0F3327",
    fontWeight: "700",
  },
  leadingIcon: {
    marginRight: 8,
  },
});
