import { ActionButton } from "@/components/ui/recompenses/ActionButton";
import { rewardsData } from "@/components/ui/recompenses/data";
import { PointsCard } from "@/components/ui/recompenses/PointsCard";
import { RewardCard } from "@/components/ui/recompenses/RewardCard";
import { useThemeMode } from "@/hooks/theme-context";
import React, { useState } from "react";
import { FlatList, ScrollView, StyleSheet, Text } from "react-native";

export default function RewardsScreen() {
  const { colors } = useThemeMode();
  const [points, setPoints] = useState(320);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 80 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.header, { color: colors.text }]}>🎁 Récompenses</Text>

      <PointsCard points={points} />

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Récompenses disponibles
      </Text>

      <FlatList
        data={rewardsData}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <RewardCard
            item={item}
            points={points}
            onObtain={() => setPoints(points - item.cost)}
          />
        )}
        keyExtractor={(item) => item.id}
        style={{ marginBottom: 20 }}
      />

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Gagner plus de points
      </Text>

      <ActionButton
        icon="play-circle-outline"
        label="Regarder une publicité"
        rewardText="+10 points"
        onPress={() => setPoints(points + 10)}
      />
      <ActionButton
        icon="share-social-outline"
        label="Partager l'application"
        rewardText="+50 points"
        onPress={() => setPoints(points + 50)}
      />
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
