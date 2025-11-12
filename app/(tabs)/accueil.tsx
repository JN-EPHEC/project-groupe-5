import DefiDuJour from "@/components/ui/Accueil/DefiDuJour";
import HeaderAccueil from "@/components/ui/Accueil/HeaderAccueil";
import PointsBox from "@/components/ui/Accueil/PointsBox";
import ProgressionCard from "@/components/ui/Accueil/ProgressionCard";
import RankCard from "@/components/ui/Accueil/RankCard";
import { useThemeMode } from "@/hooks/theme-context";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function Accueil() {
  const { colors } = useThemeMode();

  // ---- dynamic values ----
  const individualRank = 2;
  const individualTotal = 400;
  const clubRank = 1;
  const clubTotal = 5;

  const completedDays = 4; // number of daily challenges completed this week
  const totalDays = 5;     // current week day count (Monday-Friday for example)
  const pointsEarned = 50; // total points earned this week
  const streak = 2;        // days in a row (🔥)

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <Text style={[styles.appTitle, { color: colors.text }]}>GREEN UP</Text>

      <HeaderAccueil username="Marie" team="Éco-Warriors" />
      <PointsBox points={285} />

      {/* Classement */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Classement</Text>
      <View style={styles.row}>
        <RankCard position={individualRank} total={individualTotal} title="Individuel" />
        <RankCard position={clubRank} total={clubTotal} title="Club" isActive />
      </View>

      {/* Progression de la semaine */}
      <ProgressionCard
        completedDays={completedDays}
        totalDays={totalDays}
        pointsEarned={pointsEarned}
        streak={streak}
      />

      <DefiDuJour />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  appTitle: { fontSize: 20, fontWeight: "700", marginBottom: 10 },
  sectionTitle: { fontWeight: "600", fontSize: 16, marginBottom: 10 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
