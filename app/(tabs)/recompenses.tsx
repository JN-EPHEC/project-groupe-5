import { ActionButton } from "@/components/ui/recompenses/ActionButton";
import { rewardsData } from "@/components/ui/recompenses/data";
import { PointsCard } from "@/components/ui/recompenses/PointsCard";
import { PremiumCard } from "@/components/ui/recompenses/PremiumCard";
import { RewardCard } from "@/components/ui/recompenses/RewardCard";
import { usePoints } from "@/hooks/points-context";
import { useThemeMode } from "@/hooks/theme-context";
import { FlatList, ScrollView, StyleSheet, Text, View } from "react-native";

export default function RewardsScreen() {
  const { colors } = useThemeMode();
  const { points, addPoints, spendPoints } = usePoints();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 80 }}
      showsVerticalScrollIndicator={false}
    >
      {/* TITRE ÉCRAN -> texte inline ; composants: PointsCard / RewardCard / ActionButton */}
      <Text style={[styles.header, { color: colors.text }]}>🎁 Récompenses</Text>

      {/* POINTS -> components/ui/recompenses/PointsCard */}
  <PointsCard points={points} />

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Bons plans éco</Text>

      {/* Grille de partenaires éco -> style inspiré de la maquette */}
      <FlatList
        data={rewardsData}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 12 }}
        renderItem={({ item }) => (
          <View style={{ width: '48%' }}>
            <RewardCard item={item} />
          </View>
        )}
        style={{ marginBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Gagner plus de points
      </Text>

      {/* ACTIONS POUR GAGNER DES POINTS -> components/ui/recompenses/ActionButton */}
      <ActionButton
        icon="play-circle-outline"
        label="Regarder une publicité"
        rewardText="+10 points"
        onPress={() => addPoints(10)}
      />
      <ActionButton
        icon="share-social-outline"
        label="Partager l'application"
        rewardText="+50 points"
        onPress={() => addPoints(50)}
      />

      {/* PREMIUM CARD */}
      <PremiumCard onSubscribe={() => { /* TODO: subscription flow */ }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
});
