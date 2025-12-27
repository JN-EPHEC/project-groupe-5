import { CouponCard } from "@/components/ui/recompenses/CouponCard";
import { PointsCard } from "@/components/ui/recompenses/PointsCard";
import { RewardCard } from "@/components/ui/recompenses/RewardCard";
import { FontFamilies } from "@/constants/fonts";
import { db } from "@/firebaseConfig";
import { useCoupons } from "@/hooks/coupons-context";
import { usePoints } from "@/hooks/points-context";
import { useThemeMode } from "@/hooks/theme-context";
import { LinearGradient } from "expo-linear-gradient";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// 🎨 THEME RECOMPENSES
const rewardTheme = {
    bgGradient: ["#DDF7E8", "#F4FDF9"] as const,
    activeTabBg: "#008F6B",
    activeTabText: "#FFFFFF",
    inactiveTabText: "#4A665F",
    textMain: "#0A3F33",
    // ✅ MODIFIÉ : Vert (#008F6B) pour le bouton actif en mode sombre
    darkActiveTabBg: "#008F6B", 
};

export default function RewardsScreen() {
  const { colors, mode } = useThemeMode();
  const { points, spendPoints } = usePoints();
  const { coupons, addCoupon, hasCoupon } = useCoupons();
  const [activeTab, setActiveTab] = useState<'eco'|'coupons'>('eco');
  const [liveRewards, setLiveRewards] = useState<any[]>([]);

  const isLight = mode === "light";

  // CHARGER LES RÉCOMPENSES DEPUIS FIREBASE
  useEffect(() => {
    const q = query(collection(db, "rewards"), where("isActive", "==", true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLiveRewards(items);
    });
    return () => unsubscribe();
  }, []);

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
          <Text style={[styles.screenTitle, { color: isLight ? rewardTheme.textMain : colors.text }]}>Récompenses</Text>

          <PointsCard points={points} />

          <View style={styles.tabsContainer}>
             {/* ✅ On garde le fond et la bordure bleutés (0, 151, 178) en mode sombre */}
             <LinearGradient
                colors={isLight ? ["rgba(255,255,255,0.8)", "rgba(255,255,255,0.5)"] : ["rgba(0, 151, 178, 0.15)", "rgba(0, 151, 178, 0.05)"]}
                style={[styles.tabsWrapper, { borderColor: isLight ? "rgba(255,255,255,0.5)" : "rgba(0, 151, 178, 0.3)" }]}
             >
                <TabButton label="Bons plans éco" active={activeTab==='eco'} onPress={() => setActiveTab('eco')} isLight={isLight} />
                <TabButton label="Mes coupons" active={activeTab==='coupons'} onPress={() => setActiveTab('coupons')} isLight={isLight} />
             </LinearGradient>
          </View>

          {activeTab === 'eco' && (
            <View>
              <Text style={[styles.sectionTitle, { color: isLight ? rewardTheme.textMain : colors.text }]}>Offres du moment</Text>
              <View style={styles.grid}>
                {liveRewards
                    .filter((r: any) => !hasCoupon(r.id))
                    .map((item: any) => {
                        const outOfStock = item.remainingQuantity <= 0;
                        return (
                          <View key={item.id} style={[styles.gridItem, outOfStock && { opacity: 0.5 }]}>
                            <RewardCard
                              item={item}
                              redeemed={hasCoupon(item.id)}
                              canAfford={points >= item.pointsCost && !outOfStock}
                              onRedeem={async (id: string, cost: number) => {
                                if (hasCoupon(id)) return;
                                if (outOfStock) {
                                    alert("Stock épuisé !");
                                    return;
                                }
                                const successDb = await addCoupon(id);
                                if (successDb) {
                                    const pointsOk = spendPoints(cost, `Échange: ${item.name}`);
                                    if(pointsOk) {
                                        setActiveTab('coupons');
                                    }
                                }
                              }}
                            />
                            {outOfStock && (
                                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20 }}>
                                    <Text style={{ color: 'white', fontWeight: 'bold', backgroundColor: 'red', padding: 5, borderRadius: 5 }}>ÉPUISÉ</Text>
                                </View>
                            )}
                          </View>
                        );
                    })}
              </View>
            </View>
          )}

          {activeTab === 'coupons' && (
            <View>
              <Text style={[styles.sectionTitle, { color: isLight ? rewardTheme.textMain : colors.text }]}>Mes coupons actifs</Text>
              {coupons.length === 0 && (
                <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: colors.mutedText, textAlign: 'center' }}>Aucun coupon disponible.</Text>
                </View>
              )}
              {coupons.map((c) => <CouponCard key={c.id} coupon={c} />)}
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
  tabsWrapper: { flexDirection: 'row', padding: 4, borderRadius: 24, borderWidth: 1 },
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
        // ✅ CHANGÉ : Utilise rewardTheme.darkActiveTabBg (vert) en mode sombre
        backgroundColor: active ? (isLight ? rewardTheme.activeTabBg : rewardTheme.darkActiveTabBg) : "transparent",
        alignItems: 'center',
        shadowColor: active ? "#000" : "transparent",
        shadowOpacity: active ? 0.1 : 0,
        shadowRadius: 4,
        elevation: active ? 2 : 0
      }}
    >
        <Text style={{ 
            color: active ? "#FFF" : (isLight ? "#4A665F" : "#CCC"), 
            fontWeight: '700', 
            fontSize: 14 
        }}>
            {label}
        </Text>
    </TouchableOpacity>
  );
}