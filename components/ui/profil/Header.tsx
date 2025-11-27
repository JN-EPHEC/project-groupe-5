import { useClub } from "@/hooks/club-context";
import { useUser } from "@/hooks/user-context";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export const Header = () => {
  const { user } = useUser();
  const { joinedClub } = useClub();
  return (
    <View style={styles.header}>
      <View style={styles.avatarContainer}>
        {user?.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={{ width: 60, height: 60, borderRadius: 30 }} />
        ) : (
          <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#1F2A27' }} />
        )}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>10</Text>
        </View>
      </View>
      <Text style={styles.name}>Bonjour {(user?.username ?? `${user?.firstName ?? ''} ${user?.lastName ?? ''}` ).trim() || 'Invité'}</Text>
      <Text style={styles.club}>{joinedClub?.name ?? (user?.bio || '—')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: { alignItems: "center", marginTop: 40, marginBottom: 20 },
  avatarContainer: { backgroundColor: "#EF4444", borderRadius: 60, padding: 25, position: "relative" },
  badge: { position: "absolute", bottom: 5, right: 0, backgroundColor: "#10B981", borderRadius: 15, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: "#fff", fontWeight: "bold" },
  name: { color: "#fff", fontSize: 22, fontWeight: "bold", marginTop: 10 },
  club: { color: "#A1A1AA" },
});
