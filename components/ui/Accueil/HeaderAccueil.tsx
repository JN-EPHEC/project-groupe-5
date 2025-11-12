import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

export default function HeaderAccueil() {
  const { colors } = useThemeMode();

  return (
    <View style={styles.center}>
      <View style={styles.avatar}>
        <Ionicons name="walk-outline" size={40} color="#fff" />
      </View>

      <View style={styles.badge}>
        <Ionicons name="leaf-outline" size={14} color="#fff" />
        <Text style={styles.badgeText}>10</Text>
      </View>

      <Text style={[styles.username, { color: colors.text }]}>Bonjour Marie</Text>
      <Text style={[styles.team, { color: colors.mutedText }]}>Éco-Warriors</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", marginVertical: 10 },
  avatar: {
    width: 85,
    height: 85,
    borderRadius: 50,
    backgroundColor: "#E45353",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    backgroundColor: "#00C389",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    top: 75,
    right: 120,
  },
  badgeText: { color: "#fff", marginLeft: 4, fontWeight: "600" },
  username: { fontSize: 22, fontWeight: "700", marginTop: 12 },
  team: { marginBottom: 14 },
});
