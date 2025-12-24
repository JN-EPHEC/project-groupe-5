import { useNotifications } from "@/hooks/notifications-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export const NotificationBell = () => {
  const router = useRouter();
  const { unreadCount } = useNotifications();

  return (
    // ✅ CORRECTION ICI : ajout de "as any" pour calmer TypeScript
   <TouchableOpacity onPress={() => router.push("/notifications" as any)} style={styles.container}>
      <Ionicons name="notifications-outline" size={26} color="#0A3F33" />
      
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 40, height: 40,
    justifyContent: "center", alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  badge: {
    position: "absolute", top: -2, right: -2,
    backgroundColor: "#FF8C66",
    minWidth: 18, height: 18, borderRadius: 9,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1.5, borderColor: "#FFF",
  },
  badgeText: {
    color: "#FFF", fontSize: 10, fontWeight: "bold", paddingHorizontal: 2,
  },
});