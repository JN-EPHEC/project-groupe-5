import { useNotificationsSettings } from "@/hooks/notifications-context";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function NotificationBell() {
  const { unread, resetUnread } = useNotificationsSettings();
  const router = useRouter();
  const { colors, mode } = useThemeMode();

  const onPress = async () => {
    try {
      await resetUnread();
    } catch {}
    // Navigate to notifications screen (create later if needed)
    try {
      router.push("/notifications");
    } catch {
      // fallback: do nothing
    }
  };

  return (
    <TouchableOpacity onPress={onPress} style={styles.container} activeOpacity={0.8}>
      <View style={[styles.iconWrap, { backgroundColor: mode === "light" ? colors.card : colors.card }]}> 
        <Ionicons name="notifications-outline" size={22} color={mode === "light" ? colors.mutedText : colors.text} />
      </View>
      {unread > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 99 ? "99+" : String(unread)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    right: 4,
    top: 4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FF6B6B",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});
