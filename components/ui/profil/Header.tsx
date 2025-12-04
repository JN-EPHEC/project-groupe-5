import { useClub } from "@/hooks/club-context";
import { usePoints } from "@/hooks/points-context";
import { useUser } from "@/hooks/user-context";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export const Header = () => {
  const { user } = useUser();
  const { joinedClub } = useClub();
  const { points } = usePoints();
  return (
    <View style={styles.header}>
      <View style={styles.avatarContainer}>
        {user?.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="walk-outline" size={36} color="#fff" />
          </View>
        )}
        <View style={styles.badge}>
          <Ionicons name="leaf-outline" size={14} color="#fff" />
          <Text style={styles.badgeText}>{points || 0}</Text>
        </View>
      </View>
      <Text style={styles.name}>Bonjour {(user?.username ?? `${user?.firstName ?? ''} ${user?.lastName ?? ''}` ).trim() || 'Invité'}</Text>
      <Text style={styles.club}>{joinedClub?.name ?? (user?.bio || '—')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: { alignItems: "center", marginTop: 40, marginBottom: 20 },
  avatarContainer: { position: "relative", alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#E45353", alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", bottom: 0, right: -10, backgroundColor: "#10B981", borderRadius: 16, paddingHorizontal: 8, paddingVertical: 3, flexDirection: "row", alignItems: "center", gap: 4 },
  badgeText: { color: "#fff", fontWeight: "bold", marginLeft: 4 },
  name: { color: "#fff", fontSize: 22, fontWeight: "bold", marginTop: 10 },
  club: { color: "#A1A1AA" },
});
