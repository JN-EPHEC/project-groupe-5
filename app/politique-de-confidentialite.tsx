// app/politique-de-confidentialite.tsx
import { FontFamilies } from "@/constants/fonts";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const sections = [
  {
    title: "POLITIQUE DE CONFIDENTIALITÉ – GREENUP",
    body: "Dernière mise à jour : Décembre 2025",
  },
  {
    title: "1. Responsable du Traitement",
    body: "Le traitement des données est assuré par l'équipe projet GreenUp (EPHEC). Contact pour toute demande RGPD : contact@greenup-app.com",
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
  {
    title: "9. Retrait du Consentement",
    body: "Vous avez la possibilité de retirer votre consentement au traitement de vos données personnelles à tout moment, une fois votre compte créé. Cette action peut être effectuée directement depuis les paramètres de votre compte dans l'application ou en nous contactant à l'adresse contact@greenup-app.com. Notez que le retrait du consentement peut entraîner la limitation ou l'impossibilité d'utiliser certaines fonctionnalités de l'application (comme la participation aux défis nécessitant une preuve photo).",
  },
];

// 🎨 THEME POLICY
const policyTheme = {
    bgGradient: ["#DDF7E8", "#F4FDF9"] as const,
    glassCardBg: ["rgba(255, 255, 255, 0.85)", "rgba(255, 255, 255, 0.65)"] as const,
    glassBorder: "rgba(255, 255, 255, 0.8)",
    textMain: "#0A3F33", 
    textMuted: "#4A665F",
    accent: "#008F6B",
};

export default function PrivacyPolicyScreen() {
  const { colors, mode } = useThemeMode();
  const router = useRouter();
  const isLight = mode === "light";

  // Couleurs dynamiques
  const titleColor = isLight ? policyTheme.textMain : colors.text;
  const textColor = isLight ? policyTheme.textMuted : colors.mutedText;

  // Wrapper Fond
  const BackgroundComponent = isLight ? LinearGradient : View;
  const bgProps = isLight 
    ? { colors: policyTheme.bgGradient, style: StyleSheet.absoluteFill } 
    : { style: [StyleSheet.absoluteFill, { backgroundColor: "#021114" }] };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <BackgroundComponent {...(bgProps as any)} />

      <SafeAreaView style={styles.root}>
        {/* HEADER SIMPLE */}
        <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={titleColor} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: titleColor }]}>Confidentialité</Text>
            <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* CARD CONTENU */}
          <LinearGradient
            colors={isLight ? policyTheme.glassCardBg : ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[
                styles.card, 
                { borderColor: isLight ? policyTheme.glassBorder : "rgba(255,255,255,0.1)", borderWidth: 1 }
            ]}
          >
            {sections.map((section, index) => (
                <View key={index} style={[styles.section, index === sections.length - 1 && { marginBottom: 0 }]}>
                <Text style={[styles.sectionTitle, { color: titleColor }]}>{section.title}</Text>
                <Text style={[styles.sectionBody, { color: textColor }]}>{section.body}</Text>
                </View>
            ))}
          </LinearGradient>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingTop: 10, marginBottom: 10
  },
  backBtn: { padding: 8, borderRadius: 12 },
  headerTitle: { fontSize: 20, fontFamily: FontFamilies.heading, fontWeight: '700' },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    fontFamily: FontFamilies.heading
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: FontFamilies.body
  },
});