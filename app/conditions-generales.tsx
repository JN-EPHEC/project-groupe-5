import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const sections = [
  {
    title: "CONDITIONS GÉNÉRALES D'UTILISATION (CGU) – GREENUP",
    body: "Dernière mise à jour : Décembre 2025",
  },
  {
    title: "1. Objet",
    body: "L'application GreenUp (ci-après \"l'Application\"), développée dans le cadre d'un projet académique à l'UCLouvain, a pour objet de permettre aux utilisateurs de réaliser des défis écologiques, de valider ces actions par des preuves photo, de partager leurs progrès sur un fil d'actualité et d'obtenir des récompenses virtuelles ou physiques via des partenaires locaux.",
  },
  {
    title: "2. Accès et Inscription",
    body: "L'accès à l'Application nécessite la création d'un compte. L'utilisateur doit fournir une adresse email valide et créer un mot de passe ou utiliser une authentification tierce. Lors de l'inscription, l'utilisateur doit obligatoirement accepter les présentes CGU et la Politique de Confidentialité. L'Application distingue clairement les données obligatoires (nécessaires au service) des données facultatives (profil, bio).",
  },
  {
    title: "3. Fonctionnement des Défis et Preuves",
    body: "Défis : L'utilisateur reçoit des défis quotidiens.\n\nPreuve Photo : La validation s'effectue par l'envoi d'une photo. L'utilisateur reconnaît que cette photo sert de preuve technique.\n\nVisibilité : Lors du chargement d'une photo, l'utilisateur choisit son niveau de visibilité (Privé : uniquement pour validation / Public : visible sur le fil d'actualité des amis ou de la communauté).\n\nValidation : Les points sont attribués après validation automatique ou communautaire.",
  },
  {
    title: "4. Règles de Comportement et Contenus Interdits",
    body: "L'utilisateur s'engage à ne publier que des contenus dont il détient les droits. Sont strictement interdits :\n\n- Les photos permettant d'identifier des personnes tierces sans leur consentement explicite (Droit à l'image strict).\n\n- Les contenus illégaux, haineux, violents, pornographiques ou choquants.\n\n- Toute tentative de fraude (fausses preuves, manipulation des votes, spam). GreenUp se réserve le droit de supprimer sans préavis tout contenu litigieux et de suspendre le compte de l'utilisateur concerné.",
  },
  {
    title: "5. Propriété Intellectuelle et Licence",
    body: "L'utilisateur reste propriétaire de ses photos. Toutefois, en publiant une photo en mode \"Public\", l'utilisateur concède à GreenUp une licence non exclusive, gratuite et mondiale d'hébergement et d'affichage de ce contenu sur l'Application pour la durée de l'inscription.",
  },
  {
    title: "6. Responsabilité",
    body: "GreenUp est un projet étudiant fourni \"en l'état\" sans garantie de disponibilité continue. L'équipe décline toute responsabilité en cas de :\n\n- Perte de données ou bugs techniques.\n- Utilisation frauduleuse du compte par un tiers.\n- Contenus publiés par les utilisateurs (GreenUp agit en tant qu'hébergeur).",
  },
  {
    title: "7. Suppression du Compte",
    body: "L'utilisateur peut supprimer son compte à tout moment via les paramètres de l'Application. Cette action entraîne la suppression ou l'anonymisation irréversible de ses données personnelles et photos associées sous un délai maximum de 30 jours.",
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
