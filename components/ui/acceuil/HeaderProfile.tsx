import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export function HeaderProfile() {
  const { colors } = useThemeMode();
  const { user } = useUser(); // 🔥 get real user from Firestore

  // Build first name safely
  const firstName = user.firstName ?? "Utilisateur";

  return (
    <View style={styles.center}>
      {/* Avatar placeholder */}
      <View style={styles.avatar}>
        <Ionicons name="walk-outline" size={40} color="#fff" />
      </View>

      {/* Points badge (you can connect this later) */}
      <View style={[styles.badge, { backgroundColor: colors.accent }]}>
        <Ionicons name="leaf-outline" size={14} color="#fff" />
        <Text style={styles.badgeText}>{user.points ?? 0}</Text>
      </View>

      {/* 🔥 Replace “Bonjour Marie” with Firestore data */}
      <Text style={[styles.username, { color: colors.text }]}>
        Bonjour {firstName}
      </Text>

      {/* Team name static for now — you can connect clubs later */}
      <Text style={[styles.team, { color: colors.mutedText }]}>
        Éco-Warriors
      </Text>
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
