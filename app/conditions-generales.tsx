import { FontFamilies } from "@/constants/fonts";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient"; // ✅ AJOUT
import { Stack, useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const sections = [
  {
    title: "CONDITIONS GÉNÉRALES D'UTILISATION (CGU) – GREENUP",
    body: "Dernière mise à jour : Décembre 2025",
  },
  {
    title: "1. Objet",
    body: "L'application GreenUp (ci-après \"l'Application\"), développée dans le cadre d'un projet académique à l'EPHEC, a pour objet de permettre aux utilisateurs de réaliser des défis écologiques, de valider ces actions par des preuves photo, de partager leurs progrès sur un fil d'actualité et d'obtenir des récompenses virtuelles ou physiques via des partenaires locaux.",
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

// 🎨 THEME CGU
const cguTheme = {
    bgGradient: ["#DDF7E8", "#F4FDF9"] as const,
    glassCardBg: ["rgba(255, 255, 255, 0.85)", "rgba(255, 255, 255, 0.65)"] as const,
    glassBorder: "rgba(255, 255, 255, 0.8)",
    textMain: "#0A3F33", 
    textMuted: "#4A665F",
    accent: "#008F6B",
};

export default function TermsScreen() {
  const { colors, mode } = useThemeMode();
  const router = useRouter();
  const isLight = mode === "light";

  // Couleurs dynamiques
  const titleColor = isLight ? cguTheme.textMain : colors.text;
  const textColor = isLight ? cguTheme.textMuted : colors.mutedText;

  // Wrapper Fond
  const BackgroundComponent = isLight ? LinearGradient : View;
  const bgProps = isLight 
    ? { colors: cguTheme.bgGradient, style: StyleSheet.absoluteFill } 
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
            <Text style={[styles.headerTitle, { color: titleColor }]}>CGU</Text>
            <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* CARD CONTENU */}
          <LinearGradient
            colors={isLight ? cguTheme.glassCardBg : ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[
                styles.card, 
                { borderColor: isLight ? cguTheme.glassBorder : "rgba(255,255,255,0.1)", borderWidth: 1 }
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