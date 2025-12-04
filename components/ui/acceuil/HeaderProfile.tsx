import { usePoints } from "@/hooks/points-context";
import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export function HeaderProfile() {
  const { colors } = useThemeMode();
  const { user, loading } = useUser();
  const { points } = usePoints();

  // Guard against loading or missing profile
  if (loading || !user) {
    return null;
  }

  const firstName = user.firstName ?? "Utilisateur";
  const avatarUri = user.photoURL || null;
  const displayPoints = typeof points === "number" ? points : user.points ?? 0;

  return (
    <View style={styles.center}>
      <View style={styles.avatarContainer}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
        ) : (
          <View style={[styles.avatarImage, styles.avatarFallback]}>
            <Ionicons name="walk-outline" size={40} color="#fff" />
          </View>
        )}

        <View style={[styles.badge, { backgroundColor: colors.accent }]}>
          <Ionicons name="leaf-outline" size={14} color="#0F3327" />
          <Text style={styles.badgeText}>{displayPoints}</Text>
        </View>
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
  avatarContainer: { position: "relative" },
  avatarImage: {
    width: 85,
    height: 85,
    borderRadius: 50,
    backgroundColor: "#1F2A27",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallback: { backgroundColor: "#E45353" },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    bottom: -6,
    right: -6,
    borderWidth: 2,
    borderColor: "#0F3327",
  },
  badgeText: { color: "#0F3327", marginLeft: 4, fontWeight: "700" },
  username: { fontSize: 22, fontWeight: "700", marginTop: 12 },
  team: { marginBottom: 14 },
});
