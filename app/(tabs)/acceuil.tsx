import { ChallengeOfTheDay } from "@/components/ui/acceuil/ChallengeOfTheDay";
import { HeaderProfile } from "@/components/ui/acceuil/HeaderProfile";
import { ProgressionCard } from "@/components/ui/acceuil/ProgressionCard";
import { RankCard } from "@/components/ui/acceuil/RankCard";
import { useThemeMode } from "@/hooks/theme-context";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function AcceuilScreen() {
  const { colors } = useThemeMode();
  const defisFaient = 2;
  const defisTotal = 5;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Section: Profil -> components/ui/acceuil/HeaderProfile */}
      <HeaderProfile />

      {/* Section: Points (simple bloc inline ici; si besoin, on l’extrait plus tard) */}
      <View style={[styles.pointsBox, { backgroundColor: colors.surface }]}>
        <Text style={[styles.pointsNumber, { color: colors.accent }]}>285</Text>
        <Text style={[styles.pointsLabel, { color: colors.mutedText }]}>Points</Text>
      </View>

      {/* Section: Classement -> components/ui/acceuil/RankCard */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Classement</Text>
      <View style={styles.row}>
        <RankCard value="2e sur 400" label="Individuel" style={{ width: "48%" }} />
        <RankCard value="1er sur 5" label="Club" active style={{ width: "48%" }} />
      </View>

      {/* Section: Progression -> components/ui/acceuil/ProgressionCard + components/ProgressCircle */}
      <ProgressionCard done={defisFaient} total={defisTotal} pointsText="50 Points gagnés" streakText="2 jours de suite 🔥" />

      {/* Section: Défi du jour -> components/ui/acceuil/ChallengeOfTheDay */}
      <ChallengeOfTheDay
        title="Recycler 3 bouteilles plastiques"
        description="Recyclez 3 bouteilles en plastique et prenez une photo de votre geste écologique."
        difficulty="Facile"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pointsBox: { padding: 14, borderRadius: 14, alignItems: "center", marginBottom: 20 },
  pointsNumber: { fontWeight: "700", fontSize: 24 },
  pointsLabel: { marginTop: 2 },
  sectionTitle: { fontWeight: "600", marginVertical: 10, fontSize: 16 },
});
