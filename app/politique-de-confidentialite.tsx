import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const sections = [
  {
    title: "POLITIQUE DE CONFIDENTIALITÉ – GREENUP",
    body: "Dernière mise à jour : Décembre 2025",
  },
  {
    title: "1. Responsable du Traitement",
    body: "Le traitement des données est assuré par l'équipe projet GreenUp (UCLouvain). Contact pour toute demande RGPD : contact@greenup-app.com",
  },
  {
    title: "2. Données Collectées",
    body: "Conformément au principe de minimisation, nous ne collectons que les données strictement nécessaires :\n\n- Données de compte : Email, pseudo, identifiant unique (User ID).\n\n- Données de preuve : Photos envoyées pour valider les défis.\n\n- Données d'activité : Historique des défis, points, logs de votes, interactions sociales.\n\n- Données de consentement : Date, heure et version des documents acceptés.\n\n- Métadonnées techniques : Logs de connexion, type d'appareil (pour la sécurité et le débogage).",
  },
  {
    title: "3. Finalités du Traitement",
    body: "Gestion du compte utilisateur et authentification.\n\nValidation des défis et fonctionnement du classement (Leaderboard).\n\nAffichage du fil d'actualité (si l'utilisateur a choisi l'option \"Public\").\n\nSécurité, prévention de la fraude et respect des obligations légales.\n\nAmélioration du service (statistiques anonymisées).",
  },
  {
    title: "4. Base Légale",
    body: "Exécution du contrat (CGU) : Pour la gestion du jeu, des points et du compte.\n\nConsentement : Pour l'utilisation de la caméra, la géolocalisation éventuelle et les cookies analytiques. Le consentement peut être retiré à tout moment dans les paramètres.\n\nIntérêt légitime : Pour la sécurité du système et la lutte contre la triche.",
  },
  {
    title: "5. Durée de Conservation",
    body: "Preuves photo (Privées) : Supprimées automatiquement après validation technique ou maximum 30 jours.\n\nPhotos publiées (Fil d'actualité) : Conservées tant que le compte est actif ou jusqu'à suppression manuelle par l'utilisateur.\n\nDonnées de compte : Supprimées 30 jours après la demande de suppression du compte.\n\nLogs techniques et preuves de consentement : Archivés pendant 12 mois pour des raisons de sécurité juridique.",
  },
  {
    title: "6. Destinataires et Transferts",
    body: "Vos données sont accessibles uniquement à l'équipe technique GreenUp et à nos sous-traitants techniques (hébergeurs).\n\nHébergement : Google Firebase (Google LLC).\n\nTransfert Hors UE : Les données peuvent être traitées sur des serveurs Google hors de l'Union Européenne. Ce transfert est encadré par des Clauses Contractuelles Types (SCC) de la Commission Européenne garantissant un niveau de protection équivalent au RGPD.\n\nPartenaires : Aucune donnée personnelle n'est transmise aux partenaires commerciaux sans votre consentement explicite.",
  },
  {
    title: "7. Vos Droits",
    body: "Conformément au RGPD, vous disposez des droits suivants : accès, rectification, effacement (\"droit à l'oubli\"), limitation, opposition et portabilité (export incluant profil, historique et métadonnées). Pour exercer ces droits : contact@greenup-app.com. Vous avez également le droit d'introduire une réclamation auprès de l'Autorité de Protection des Données (APD) en Belgique.",
  },
  {
    title: "8. Sécurité",
    body: "Nous mettons en œuvre des mesures de sécurité techniques (chiffrement TLS, règles de sécurité Firestore) et organisationnelles (journalisation des accès administrateurs) pour protéger vos données.",
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
