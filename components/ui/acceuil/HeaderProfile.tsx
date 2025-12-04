import { useClub } from "@/hooks/club-context";
import { usePoints } from "@/hooks/points-context";
import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export function HeaderProfile() {
  const { colors } = useThemeMode();
  const { user, loading } = useUser();
  const { joinedClub } = useClub();
  const { points } = usePoints();

  // Guard against loading or missing profile
  if (loading || !user) {
    return null;
  }

  const firstName = user.firstName ?? "Utilisateur";

  return (
    <View style={styles.center}>
      <View style={styles.avatarWrap}>
        {user?.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="walk-outline" size={40} color="#fff" />
          </View>
        )}

        <View style={[styles.badge, { backgroundColor: colors.accent }]}>
          <Ionicons name="leaf-outline" size={14} color="#fff" />
          <Text style={styles.badgeText}>{points || 0}</Text>
        </View>
      </View>

      {/* 🔥 Replace “Bonjour Marie” with Firestore data */}
      <Text style={[styles.username, { color: colors.text }]}>
        Bonjour {firstName}
      </Text>

      {/* Club name if joined */}
      <Text style={[styles.team, { color: colors.mutedText }]}>
        {joinedClub?.name || user?.bio || "—"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", marginVertical: 10 },
  avatarWrap: { alignItems: "center", justifyContent: "center", position: "relative" },
  avatarImage: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#E45353",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    bottom: -6,
    right: -12,
  },
  badgeText: { color: "#fff", marginLeft: 4, fontWeight: "600" },
  username: { fontSize: 22, fontWeight: "700", marginTop: 12 },
  team: { marginBottom: 14 },
});
