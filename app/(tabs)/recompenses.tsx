import { CouponCard } from "@/components/ui/recompenses/CouponCard";
import { rewardsData } from "@/components/ui/recompenses/data";
import { PointsCard } from "@/components/ui/recompenses/PointsCard";
import { RewardCard } from "@/components/ui/recompenses/RewardCard";
import { FontFamilies } from "@/constants/fonts";
import { useCoupons } from "@/hooks/coupons-context";
import { usePoints } from "@/hooks/points-context";
import { useThemeMode } from "@/hooks/theme-context";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// 🎨 THEME RECOMPENSES
const rewardTheme = {
    bgGradient: ["#DDF7E8", "#F4FDF9"] as const,
    activeTabBg: "#008F6B", // Vert Marque
    activeTabText: "#FFFFFF",
    inactiveTabText: "#4A665F",
    textMain: "#0A3F33",
};

export default function RewardsScreen() {
  const { colors, mode } = useThemeMode();
  const { points, spendPoints } = usePoints();
  const { coupons, addCoupon, hasCoupon } = useCoupons();
  const [activeTab, setActiveTab] = useState<'eco'|'coupons'>('eco');

  const isLight = mode === "light";

  // Wrapper Fond
  const BackgroundComponent = isLight ? LinearGradient : View;
  const bgProps = isLight 
    ? { colors: rewardTheme.bgGradient, style: StyleSheet.absoluteFill } 
    : { style: [StyleSheet.absoluteFill, { backgroundColor: "#021114" }] };

  return (
    <View style={{ flex: 1 }}>
      <BackgroundComponent {...(bgProps as any)} />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* TITRE */}
          <Text style={[styles.screenTitle, { color: isLight ? rewardTheme.textMain : colors.text }]}>Récompenses</Text>

          {/* POINTS CARD */}
          <PointsCard points={points} />

          {/* TABS SELECTOR */}
          <View style={styles.tabsContainer}>
             <LinearGradient
                colors={isLight ? ["rgba(255,255,255,0.8)", "rgba(255,255,255,0.5)"] : ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
                style={styles.tabsWrapper}
             >
                <TabButton label="Bons plans éco" active={activeTab==='eco'} onPress={() => setActiveTab('eco')} isLight={isLight} />
                <TabButton label="Mes coupons" active={activeTab==='coupons'} onPress={() => setActiveTab('coupons')} isLight={isLight} />
             </LinearGradient>
          </View>

          {/* CONTENU */}
          {activeTab === 'eco' && (
            <View>
              <Text style={[styles.sectionTitle, { color: isLight ? rewardTheme.textMain : colors.text }]}>Offres du moment</Text>
              <View style={styles.grid}>
                {rewardsData.filter(r => !hasCoupon(r.id)).map((item) => (
                  <View key={item.id} style={styles.gridItem}>
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
                ))}
              </View>
            </View>
          )}

          {activeTab === 'coupons' && (
            <View>
              <Text style={[styles.sectionTitle, { color: isLight ? rewardTheme.textMain : colors.text }]}>Mes coupons actifs</Text>
              {coupons.length === 0 && (
                <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: colors.mutedText, textAlign: 'center' }}>Aucun coupon disponible. Échange tes Greenies pour en obtenir !</Text>
                </View>
              )}
              {coupons.map(c => <CouponCard key={c.id} coupon={c} />)}
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  screenTitle: { fontSize: 32, fontFamily: FontFamilies.display, marginBottom: 20, marginTop: 10 },
  sectionTitle: { fontSize: 18, fontFamily: FontFamilies.heading, marginBottom: 12, marginTop: 8 },
  
  tabsContainer: { marginBottom: 24 },
  tabsWrapper: { flexDirection: 'row', padding: 4, borderRadius: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.5)" },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '48%', marginBottom: 16 },
});

function TabButton({ label, active, onPress, isLight }: { label: string; active: boolean; onPress: () => void; isLight: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: active ? (isLight ? "#008F6B" : "#10B981") : "transparent",
        alignItems: 'center',
        shadowColor: active ? "#000" : "transparent",
        shadowOpacity: active ? 0.1 : 0,
        shadowRadius: 4,
        elevation: active ? 2 : 0
      }}
    >
        <Text style={{ 
            color: active ? "#FFF" : (isLight ? "#4A665F" : "#A0AEC0"), 
            fontWeight: '700', 
            fontSize: 14 
        }}>
            {label}
        </Text>
    </TouchableOpacity>
  );
}