import { useNotificationsSettings } from "@/hooks/notifications-context";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function NotificationsScreen() {
  const { colors, mode } = useThemeMode();
  const router = useRouter();
  const { resetUnread } = useNotificationsSettings();

  useEffect(() => {
    // reset unread on open
    (async () => {
      try {
        await resetUnread();
      } catch {}
    })();
  }, [resetUnread]);

  const heroBackground = mode === "light" ? "#0F3327" : colors.surfaceAlt;

  const items: Array<{ id: string; title: string; body: string }> = [];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.hero, { backgroundColor: heroBackground }]}> 
        <TouchableOpacity
          style={styles.heroBack}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Revenir"
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.heroTitle}>Notifications</Text>
        <Text style={styles.heroSubtitle}>Dernières notifications</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {items.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={[styles.emptyText, { color: colors.mutedText }]}>Aucune notification pour le moment.</Text>
          </View>
        ) : (
          items.map((it) => (
            <View key={it.id} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{it.title}</Text>
              <Text style={[styles.sectionBody, { color: colors.mutedText }]}>{it.body}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 54,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroBack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  heroSubtitle: {
    marginTop: 8,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  emptyRow: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 14, fontWeight: "600" },
});
