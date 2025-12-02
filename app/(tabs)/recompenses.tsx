import { ActionButton } from "@/components/ui/recompenses/ActionButton";
import { CouponCard } from "@/components/ui/recompenses/CouponCard";
import { rewardsData } from "@/components/ui/recompenses/data";
import { PointsCard } from "@/components/ui/recompenses/PointsCard";
import { RewardCard } from "@/components/ui/recompenses/RewardCard";
import { useCoupons } from "@/hooks/coupons-context";
import { usePoints } from "@/hooks/points-context";
import { useThemeMode } from "@/hooks/theme-context";
import React, { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from "react-native";

export default function RewardsScreen() {
  const { colors } = useThemeMode();
  const { points, availablePoints, totalEarned, addPoints, spendPoints } = usePoints();
  const { coupons, addCoupon, hasCoupon } = useCoupons();
  const [activeTab, setActiveTab] = useState<'eco'|'coupons'>('eco');

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 80 }}
      showsVerticalScrollIndicator={false}
    >
      {/* TITRE ÉCRAN -> texte inline ; composants: PointsCard / RewardCard / ActionButton */}
      <Text style={[styles.screenTitle, { color: colors.text }]}>Récompenses</Text>

      {/* POINTS -> components/ui/recompenses/PointsCard */}
  <PointsCard points={points} />

      {/* Tabs Eco / Mes coupons */}
      <View style={styles.tabsRow}>
        <View style={styles.tabsBg} />
        <View style={styles.tabsInner}> 
          <TabButton label="Bon plan éco" active={activeTab==='eco'} onPress={() => setActiveTab('eco')} colors={colors} />
          <TabButton label="Mes coupons" active={activeTab==='coupons'} onPress={() => setActiveTab('coupons')} colors={colors} />
        </View>
      </View>

      {activeTab === 'eco' && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Bons plans éco</Text>
          <FlatList
            data={rewardsData.filter(r => !hasCoupon(r.id))}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 12 }}
            renderItem={({ item }) => (
              <View style={{ width: '48%' }}>
                <RewardCard
                  item={item}
                  redeemed={hasCoupon(item.id)}
                  canAfford={points >= item.pointsCost}
                  onRedeem={(id, cost) => {
                    if (hasCoupon(id)) return;
                    const ok = spendPoints(cost, `Échange: ${item.name}`);
                    if (ok) {
                      addCoupon(id);
                      setActiveTab('coupons');
                    }
                  }}
                />
              </View>
            )}
            style={{ marginBottom: 24 }}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}

      {activeTab === 'coupons' && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Mes coupons</Text>
          {coupons.length === 0 && (
            <Text style={{ color: colors.mutedText, marginBottom: 16 }}>Aucun coupon encore. Échange une récompense pour en générer un.</Text>
          )}
          {coupons.map(c => <CouponCard key={c.id} coupon={c} />)}
        </>
      )}

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Gagner plus de points
      </Text>

      {/* ACTIONS POUR GAGNER DES POINTS -> components/ui/recompenses/ActionButton */}
      <ActionButton
        icon="play-circle-outline"
        label="Regarder une publicité"
        rewardText="+10 points"
        onPress={() => addPoints(10, 'Publicité visionnée')}
      />
      <ActionButton
        icon="share-social-outline"
        label="Partager l'application"
        rewardText="+50 points"
        onPress={() => addPoints(50, "Partage de l'application")}
      />

      {/* PREMIUM CARD moved to Profil & Accueil */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  screenTitle: { fontSize: 28, fontWeight: '700', textAlign: 'left', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  tabsRow: { marginBottom: 20 },
  tabsBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 56, borderRadius: 28 },
  tabsInner: { flexDirection: 'row', gap: 12 },
});

function TabButton({ label, active, onPress, colors }: { label: string; active: boolean; onPress: () => void; colors: any }) {
  return (
    <Text
      onPress={onPress}
      style={{
        paddingVertical: 14,
        paddingHorizontal: 22,
        borderRadius: 26,
        backgroundColor: active ? colors.accent : colors.surface,
        color: active ? '#0F3327' : colors.mutedText,
        fontWeight: '700',
        fontSize: 15,
        overflow: 'hidden'
      }}
    >{label}</Text>
  );
}
