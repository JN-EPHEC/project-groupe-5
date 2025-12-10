import { FontFamilies } from "@/constants/fonts";
import { usePoints } from "@/hooks/points-context";
import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

type HeaderProfileProps = {
  clubName?: string | null;
};

export function HeaderProfile({ clubName }: HeaderProfileProps) {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";
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
      <LinearGradient
        colors={isLight ? [colors.cardAlt, colors.card] : [colors.surfaceAlt, colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.profileCard, { shadowColor: "#000000" }]}
      >
        <View style={styles.avatarContainer}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatarImage, styles.avatarFallback]}>
              <Ionicons name="walk-outline" size={40} color="#fff" />
            </View>
          )}

          <View
            style={[styles.badge, { backgroundColor: colors.accent }]}
          >
            <Ionicons name="leaf-outline" size={14} color="#0F3327" />
            <Text style={[styles.badgeText, { fontFamily: FontFamilies.heading }]}>{displayPoints}</Text>
          </View>
        </View>

        {/* 🔥 Replace “Bonjour Marie” with Firestore data */}
        <Text style={[styles.username, { color: isLight ? colors.cardText : colors.text }]}>Bonjour {firstName}</Text>

        <Text style={[styles.team, { color: isLight ? colors.cardMuted : colors.mutedText }]}>{clubName ?? "Éco-Warriors"}</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", marginBottom: 24 },
  profileCard: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 26,
    alignItems: "center",
    position: "relative",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    width: "100%",
    maxWidth: 320,
  },
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
  badgeText: { color: "#0F3327", marginLeft: 4 },
  username: { fontSize: 24, marginTop: 12, fontFamily: FontFamilies.heading },
  team: { marginTop: 4, fontFamily: FontFamilies.headingMedium },
});
