import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const sections = [
  {
    title: "1. Éditeur",
    body: [
      "GreenUp – Projet académique UCLouvain",
      "Email : contact@greenup-app.com",
    ].join("\n"),
  },
  {
    title: "2. Hébergement",
    body: [
      "Google Firebase (Google LLC)",
      "Stockage, base de données, authentification.",
    ].join("\n"),
  },
  {
    title: "3. Propriété intellectuelle",
    body: "Logo, nom, contenus et défis GreenUp sont protégés. Toute reproduction non autorisée est interdite.",
  },
  {
    title: "4. Contact",
    body: "contact@greenup-app.com",
  },
];

export default function LegalNoticeScreen() {
  const { colors, mode } = useThemeMode();
  const router = useRouter();
  const heroBackground = mode === "light" ? "#0F3327" : colors.surfaceAlt;

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
        <Text style={styles.heroTitle}>MENTIONS LÉGALES – GREENUP</Text>
        <Text style={styles.heroSubtitle}>Dernière mise à jour : 2025</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
            <Text style={[styles.sectionBody, { color: colors.mutedText }]}>{section.body}</Text>
          </View>
        ))}
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
});
