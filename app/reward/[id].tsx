import { rewardsData } from '@/components/ui/recompenses/data';
import { useCoupons } from '@/hooks/coupons-context';
import { usePoints } from '@/hooks/points-context';
import { useThemeMode } from '@/hooks/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { Alert, Image, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RewardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const reward = useMemo(() => rewardsData.find((r) => r.id === id), [id]);
  const { colors } = useThemeMode();
  const router = useRouter();
  const { points, spendPoints } = usePoints();
  const { addCoupon, hasCoupon } = useCoupons();
  const [redeemed, setRedeemed] = useState(false);

  if (!reward) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}> 
        <Text style={{ color: colors.text }}>Récompense introuvable.</Text>
      </View>
    );
  }

  const already = hasCoupon(reward.id);
  const canAfford = points >= reward.pointsCost && !redeemed && !already;

  const slideW = 270; // width + gap
  const loopImages = useMemo(() => [...reward.images, ...reward.images, ...reward.images, ...reward.images], [reward.images]);
  const scRef = useRef<ScrollView>(null);
  const [active, setActive] = useState(0);
  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / slideW);
    const mod = ((idx % reward.images.length) + reward.images.length) % reward.images.length;
    setActive(mod);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
        <Ionicons name="arrow-back" size={24} color={colors.accent} style={{ marginRight: 6 }} />
        <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 18 }}>Retour</Text>
      </TouchableOpacity>

      <View style={{ marginBottom: 22 }}>
        <ScrollView
          ref={scRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={slideW}
          decelerationRate="fast"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentOffset={{ x: reward.images.length * slideW, y: 0 }}
        >
          {loopImages.map((src, i) => (
            <Image key={i} source={{ uri: src }} style={styles.image} resizeMode="cover" />
          ))}
        </ScrollView>
        <View style={styles.dotsContainer} pointerEvents="none">
          {reward.images.slice(0,3).map((_, i) => (
            <View key={i} style={[styles.dot, { borderColor: colors.mutedText, backgroundColor: i === active ? colors.accent : 'transparent' }]} />
          ))}
        </View>
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{reward.name}</Text>
      <Text style={[styles.cost, { color: colors.mutedText }]}>Bon d'achat: {reward.voucherAmountEuro}€</Text>
      <Text style={{ color: colors.mutedText, marginBottom: 12 }}>Expire le {reward.expiresAt}</Text>

      <View style={[styles.section, { backgroundColor: colors.surface }]}> 
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Entreprise</Text>
        <Text style={{ color: colors.mutedText }}>{reward.description}</Text>
        <Text style={{ color: colors.mutedText, marginTop: 6, fontSize: 12 }}>Ville: {reward.city}</Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface }]}> 
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Récompense</Text>
        <Text style={{ color: colors.mutedText }}>Bon d'achat de {reward.voucherAmountEuro}€ chez {reward.name}.</Text>
        <Text style={{ color: colors.mutedText, marginTop: 4 }}>Code promo: {reward.promoCode}</Text>
        <Text style={{ color: colors.mutedText, marginTop: 4 }}>Coût: {reward.pointsCost} points</Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface }]}> 
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Validité</Text>
        <Text style={{ color: colors.mutedText }}>Utilisable avant le {reward.expiresAt}. Après cette date le code n'est plus valable.</Text>
      </View>

      <TouchableOpacity
        disabled={!canAfford}
        onPress={() => {
          if (already) {
            Alert.alert('Déjà échangé', 'Cette récompense est déjà dans tes coupons.');
            return;
          }
          const msg = `Êtes-vous sûr de vouloir échanger ${reward.pointsCost} points contre ${reward.voucherAmountEuro}€ de bon d'achat chez ${reward.name} ?`;
          Alert.alert(
            "Confirmer l'échange",
            msg,
            [
              { text: 'Non', style: 'cancel', onPress: () => router.back() },
              { text: 'Oui', onPress: () => {
                  const ok = spendPoints(reward.pointsCost, `Échange: ${reward.name}`);
                  if (ok) { setRedeemed(true); addCoupon(reward.id); }
                }
              }
            ]
          );
        }}
        style={{
          marginTop: 24,
          paddingVertical: 18,
            paddingHorizontal: 24,
          borderRadius: 24,
          alignItems: 'center',
          backgroundColor: canAfford ? colors.accent : '#2A3431',
        }}
      >
        <Text style={{ color: canAfford ? '#0F3327' : '#8AA39C', fontWeight: '700', fontSize: 16 }}>
          {already || redeemed ? 'Déjà dans mes coupons' : 'Échanger'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  image: { width: 260, height: 180, borderRadius: 20, marginRight: 10 },
  dotsContainer: { position: 'absolute', bottom: 8, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1, backgroundColor: 'transparent' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 6 },
  cost: { fontSize: 14, fontWeight: '600', marginBottom: 18 },
  section: { padding: 16, borderRadius: 18, marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
});
