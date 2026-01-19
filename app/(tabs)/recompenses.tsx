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
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// 🎨 THEME RECOMPENSES
const rewardTheme = {
    bgGradient: ["#DDF7E8", "#F4FDF9"] as const,
    activeTabBg: "#008F6B",
    activeTabText: "#FFFFFF",
    inactiveTabText: "#4A665F",
    textMain: "#0A3F33",
    darkActiveTabBg: "#008F6B", 
};

export default function RewardsScreen() {
  const { colors, mode } = useThemeMode();
  const { points } = usePoints(); 
  const { coupons, addCoupon, hasCoupon } = useCoupons();
  
  const [activeTab, setActiveTab] = useState<'eco'|'coupons'>('eco');
  const [liveRewards, setLiveRewards] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false); // Empêche le double clic et les bugs de solde

  const isLight = mode === "light";

  // 1. CHARGER LES RÉCOMPENSES EN TEMPS RÉEL
  useEffect(() => {
    const q = query(collection(db, "rewards"), where("isActive", "==", true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLiveRewards(items);
    });
    return () => unsubscribe();
  }, []);

  // 2. FONCTION DE RÉCRUPÉRATION (REDEEM)
  const handleRedeem = async (id: string, cost: number) => {
    if (isProcessing) return; // Sécurité anti-spam
    
    setIsProcessing(true);
    try {
      // Appel de la transaction atomique définie dans le context
      const success = await addCoupon(id, cost);
      
      if (success) {
        // On bascule sur l'onglet coupons seulement si ça a marché
        setActiveTab('coupons');
      }
    } finally {
      setIsProcessing(false);
    }
  };

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
          <Text style={[styles.screenTitle, { color: isLight ? rewardTheme.textMain : colors.text }]}>
            Récompenses
          </Text>

          <PointsCard points={points} />

          {/* TABS */}
          <View style={styles.tabsContainer}>
             <LinearGradient
                colors={isLight ? ["rgba(255,255,255,0.8)", "rgba(255,255,255,0.5)"] : ["rgba(0, 151, 178, 0.15)", "rgba(0, 151, 178, 0.05)"]}
                style={[styles.tabsWrapper, { borderColor: isLight ? "rgba(255,255,255,0.5)" : "rgba(0, 151, 178, 0.3)" }]}
             >
                <TabButton label="Bons plans éco" active={activeTab==='eco'} onPress={() => setActiveTab('eco')} isLight={isLight} />
                <TabButton label="Mes coupons" active={activeTab==='coupons'} onPress={() => setActiveTab('coupons')} isLight={isLight} />
             </LinearGradient>
          </View>

          {/* LOADING OVERLAY QUAND ON ACHÈTE */}
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color={rewardTheme.activeTabBg} />
              <Text style={{ color: colors.text, marginTop: 10 }}>Traitement en cours...</Text>
            </View>
          )}

          {/* CONTENU ONGLET 1 : OFFRES */}
          {activeTab === 'eco' && (
            <View>
              <Text style={[styles.sectionTitle, { color: isLight ? rewardTheme.textMain : colors.text }]}>Offres du moment</Text>
              
              <View style={styles.grid}>
                {liveRewards
                    .filter((item: any) => {
                        const today = new Date().toISOString().split('T')[0];
                        const isExpired = item.expiresAt < today;
                        // On n'affiche que ce qui n'est pas encore acheté et non expiré
                        return !hasCoupon(item.id) && !isExpired;
                    })
                    .map((item: any) => {
                        const outOfStock = item.remainingQuantity <= 0;
                        const canAfford = points >= item.pointsCost;

                        return (
                          <View key={item.id} style={[styles.gridItem, outOfStock && { opacity: 0.5 }]}>
                            <RewardCard
                              item={item}
                              redeemed={false}
                              canAfford={canAfford && !outOfStock && !isProcessing}
                              onRedeem={handleRedeem}
                            />
                            {outOfStock && (
                                <View style={styles.outOfStockOverlay}>
                                    <Text style={styles.outOfStockText}>ÉPUISÉ</Text>
                                </View>
                            )}
                          </View>
                        );
                    })}
              </View>
            </View>
          )}

          {/* CONTENU ONGLET 2 : MES COUPONS */}
          {activeTab === 'coupons' && (
            <View>
              <Text style={[styles.sectionTitle, { color: isLight ? rewardTheme.textMain : colors.text }]}>Mes coupons actifs</Text>
              {coupons.length === 0 ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                    <Text style={{ color: colors.mutedText, textAlign: 'center', fontFamily: FontFamilies.body }}>
                        Aucun coupon disponible pour le moment.
                    </Text>
                </View>
              ) : (
                coupons.map((c) => <CouponCard key={c.id} coupon={c} />)
              )}
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
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'flex-start',
    marginHorizontal: -8 
  },
  gridItem: { 
    width: '50%', 
    paddingHorizontal: 8, 
    marginBottom: 16,
    minHeight: 220 
  },
  outOfStockOverlay: { 
    position: 'absolute', 
    top: 0, 
    left: 8, 
    right: 8, 
    bottom: 0, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    borderRadius: 20,
    pointerEvents: 'none'
  },
  outOfStockText: { 
    color: 'white', 
    fontWeight: 'bold', 
    backgroundColor: 'red', 
    padding: 5, 
    borderRadius: 5 
  },
  processingOverlay: {
    marginVertical: 10,
    padding: 15,
    backgroundColor: 'rgba(0,143,107,0.05)',
    borderRadius: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10
  }
});

function TabButton({ label, active, onPress, isLight }: { label: string; active: boolean; onPress: () => void; isLight: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flex: 1,
        paddingVertical: 10,
        borderRadius: 20,
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