import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export const Header = () => (
  <View style={styles.header}>
    <View style={styles.avatarContainer}>
      <Ionicons name="walk-outline" size={60} color="#fff" />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>10</Text>
      </View>
    </View>
    <Text style={styles.name}>Bonjour Marie</Text>
    <Text style={styles.club}>Éco-Warriors</Text>
  </View>
);

const styles = StyleSheet.create({
  header: { alignItems: "center", marginTop: 40, marginBottom: 20 },
  avatarContainer: { backgroundColor: "#EF4444", borderRadius: 60, padding: 25, position: "relative" },
  badge: { position: "absolute", bottom: 5, right: 0, backgroundColor: "#10B981", borderRadius: 15, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: "#fff", fontWeight: "bold" },
  name: { color: "#fff", fontSize: 22, fontWeight: "bold", marginTop: 10 },
  club: { color: "#A1A1AA" },
});
