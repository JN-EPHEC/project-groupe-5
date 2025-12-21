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
    title: "MENTIONS LÉGALES – GREENUP",
    body: "Dernière mise à jour : Décembre 2025",
  },
  {
    title: "1. Éditeur du Service",
    body: "Application GreenUp\nProjet étudiant réalisé dans le cadre académique de l'EPHEC (Belgique).\nContact support et juridique : contact@greenup-app.com",
  },
  {
    title: "2. Hébergement",
    body: "L'infrastructure backend et la base de données sont hébergées par : Google Firebase (Google LLC).\nSiège social : 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA.\nLe stockage des données est soumis aux règles de confidentialité de Google Cloud Platform.",
  },
  {
    title: "3. Propriété Intellectuelle",
    body: "L'ensemble des éléments graphiques, le logo \"GreenUp\", le code source et les concepts de défis sont la propriété exclusive de l'équipe projet, sauf mention contraire. Toute reproduction est interdite sans autorisation.",
  },
  {
    title: "4. Droit Applicable",
    body: "Les présentes conditions sont régies par le droit belge. Tout litige relatif à l'utilisation de l'application sera soumis à la compétence des tribunaux de l'arrondissement judiciaire du Brabant wallon.",
  },
];

// 🎨 THEME LEGAL
const legalTheme = {
    bgGradient: ["#DDF7E8", "#F4FDF9"] as const,
    glassCardBg: ["rgba(255, 255, 255, 0.85)", "rgba(255, 255, 255, 0.65)"] as const,
    glassBorder: "rgba(255, 255, 255, 0.8)",
    textMain: "#0A3F33", 
    textMuted: "#4A665F",
    accent: "#008F6B",
};

export default function LegalNoticeScreen() {
  const { colors, mode } = useThemeMode();
  const router = useRouter();
  const isLight = mode === "light";

  // Couleurs dynamiques
  const titleColor = isLight ? legalTheme.textMain : colors.text;
  const textColor = isLight ? legalTheme.textMuted : colors.mutedText;

  // Wrapper Fond
  const BackgroundComponent = isLight ? LinearGradient : View;
  const bgProps = isLight 
    ? { colors: legalTheme.bgGradient, style: StyleSheet.absoluteFill } 
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
            <Text style={[styles.headerTitle, { color: titleColor }]}>Mentions Légales</Text>
            <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* CARD CONTENU */}
          <LinearGradient
            colors={isLight ? legalTheme.glassCardBg : ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[
                styles.card, 
                { borderColor: isLight ? legalTheme.glassBorder : "rgba(255,255,255,0.1)", borderWidth: 1 }
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