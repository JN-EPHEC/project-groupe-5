import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CATEGORY_CONFIG } from "./constants";

export type ValidationItem = {
  id: number;
  title: string;
  description: string;
  category: keyof typeof CATEGORY_CONFIG;
  difficulty: "Facile" | "Moyen" | "Difficile";
  points: number;
  audience: "Membre";
  timeLeft: string;
  userName: string;
  photoUrl: string;
};

type Props = {
  item: ValidationItem;
  onValidate: () => void;
  onReject: () => void;
};

export function ValidationCard({ item, onValidate, onReject }: Props) {
  const { colors } = useThemeMode();
  const category = CATEGORY_CONFIG[item.category];

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
          <Text style={styles.pointsText}>{item.points} pts</Text>
        </View>
      </View>

      {/* TITRE */}
      <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
      <Text style={[styles.subtitle, { color: colors.mutedText }]}>Par {item.userName}</Text>

      {/* BOÎTE DE PREUVE */}
      <Image source={{ uri: item.photoUrl }} style={styles.photo} />

      {/* ACTIONS */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: colors.surfaceAlt }]}
          onPress={onReject}
        > 
          <Ionicons name="close-circle" size={18} color="#EBE6D3" style={styles.leadingIcon} />
          <Text style={[styles.secondaryText, { color: "#EBE6D3" }]}>Refuser</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.successButton, { backgroundColor: colors.accent }]} onPress={onValidate}>
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
  subtitle: {
    marginTop: 4,
    marginBottom: 8,
  },
  photo: {
    borderRadius: 18,
    height: 150,
    width: "100%",
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
