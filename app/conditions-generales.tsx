import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const sections = [
  {
    title: "1. Objet",
    body: "GreenUp est une application permettant de réaliser des défis écologiques, valider par photo et obtenir des points via un classement.",
  },
  {
    title: "2. Création de compte",
    body: "L’utilisateur doit fournir une adresse email valide. Il doit accepter la Politique de Confidentialité.",
  },
  {
    title: "3. Fonctionnement des défis",
    body: [
      "- 1 défi par jour",
      "- Preuve photo obligatoire",
      "- Validation communautaire par votes",
      "- Points attribués automatiquement",
    ].join("\n"),
  },
  {
    title: "4. Règles de comportement",
    body: [
      "Interdictions :",
      "- Photos de personnes reconnaissables sans consentement",
      "- Photos illégales, choquantes, violentes",
      "- Fraude, triche, harcèlement",
      "- Spam ou votes organisés frauduleux",
    ].join("\n"),
  },
  {
    title: "5. Sanctions",
    body: "GreenUp peut suspendre ou supprimer un compte en cas d’abus.",
  },
  {
    title: "6. Récompenses",
    body: "Les récompenses n’ont pas de valeur monétaire. Elles peuvent être modifiées ou retirées.",
  },
  {
    title: "7. Responsabilité",
    body: "GreenUp n’est pas responsable des contenus publiés par les utilisateurs. L’utilisateur est responsable des photos qu’il soumet.",
  },
  {
    title: "8. Suppression du compte",
    body: "Possible à tout moment depuis l’application. Les données seront supprimées sous 30 jours.",
  },
];

export default function TermsScreen() {
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
        <Text style={styles.heroTitle}>CONDITIONS GÉNÉRALES D'UTILISATION – GREENUP</Text>
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
