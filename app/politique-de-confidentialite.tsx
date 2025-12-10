import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const sections = [
  {
    title: "1. Responsable du traitement",
    body: "GreenUp (projet étudiant), contact : contact@greenup-app.com",
  },
  {
    title: "2. Données collectées",
    body: [
      "- Nom, email (création de compte)",
      "- Identifiants Firebase",
      "- Photos envoyées pour valider des défis",
      "- Historique de défis, points, classement",
      "- Métadonnées techniques (crash, usage, analytics – avec consentement)",
    ].join("\n"),
  },
  {
    title: "3. Finalités",
    body: [
      "- Gestion du compte utilisateur",
      "- Participation aux défis et validation communautaire",
      "- Attribution de points et classement",
      "- Amélioration de l’application",
      "- Sécurité et prévention de la fraude",
    ].join("\n"),
  },
  {
    title: "4. Base légale",
    body: [
      "- Consentement (upload photo, analytics, notifications)",
      "- Intérêt légitime (sécurité, lutte contre fraude)",
    ].join("\n"),
  },
  {
    title: "5. Durée de conservation",
    body: [
      "- Photos : supprimées automatiquement après validation ou 30 jours max",
      "- Données du compte : supprimées 30 jours après demande de suppression",
      "- Logs techniques : 12 mois",
    ].join("\n"),
  },
  {
    title: "6. Destinataires",
    body: [
      "- Firebase (Google Cloud, hébergement hors UE avec clauses contractuelles types)",
      "- Partenaires locaux (récompenses) : jamais accès aux données personnelles",
    ].join("\n"),
  },
  {
    title: "7. Droits utilisateurs",
    body: [
      "Droit d’accès, rectification, suppression, opposition, portabilité.",
      "Demande : contact@greenup-app.com.",
    ].join("\n"),
  },
  {
    title: "8. Sécurité",
    body: [
      "- Firebase Auth",
      "- Firestore & Storage Security Rules",
      "- Chiffrement en transit TLS",
    ].join("\n"),
  },
  {
    title: "9. Transfert hors UE",
    body: "Les données peuvent être stockées hors UE (Google Firebase). Des mesures standard (SCC) sont appliquées.",
  },
];

export default function PrivacyPolicyScreen() {
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
        <Text style={styles.heroTitle}>POLITIQUE DE CONFIDENTIALITÉ – GREENUP</Text>
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
