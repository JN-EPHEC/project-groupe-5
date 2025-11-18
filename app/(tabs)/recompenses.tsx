import { ActionButton } from "@/components/ui/recompenses/ActionButton";
import { brandRewards } from "@/components/ui/recompenses/brandData";
import { BrandRewardCard } from "@/components/ui/recompenses/BrandRewardCard";
import { PointsCard } from "@/components/ui/recompenses/PointsCard";
import { ReferralModal } from "@/components/ui/recompenses/ReferralModal";
import { RewardInfoModal } from "@/components/ui/recompenses/RewardInfoModal";
import { usePoints } from "@/hooks/points-context";
import { useThemeMode } from "@/hooks/theme-context";
import React, { useState } from "react";
import { FlatList, ScrollView, StyleSheet, Text } from "react-native";

export default function RewardsScreen() {
  const { colors } = useThemeMode();
  const { points, addPoints, spendPoints } = usePoints();
  const [showReferral, setShowReferral] = useState(false);
  const [infoReward, setInfoReward] = useState<any | null>(null);

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

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Boutique cadeaux</Text>

      {/* LISTE RÉCOMPENSES -> components/ui/recompenses/RewardCard */}
      <FlatList
        data={brandRewards}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <BrandRewardCard
            item={item}
            canAfford={points >= item.costCoins}
            onObtain={() => spendPoints(item.costCoins)}
            onInfo={() => setInfoReward(item)}
          />
        )}
        keyExtractor={(item) => item.id}
        style={{ marginBottom: 20 }}
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
        label="Partager mon code de parrainage"
        rewardText="+250 points"
        onPress={() => setShowReferral(true)}
      />

      {/* Modal de parrainage en français avec partage WhatsApp */}
      <ReferralModal
        visible={showReferral}
        onClose={() => setShowReferral(false)}
        onShared={() => {
          // Récompense immédiate lors d'un partage réussi
          addPoints(250);
          setShowReferral(false);
        }}
      />

      {/* Modal d'information sur la marque/projet */}
      <RewardInfoModal visible={!!infoReward} reward={infoReward} onClose={() => setInfoReward(null)} />
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
