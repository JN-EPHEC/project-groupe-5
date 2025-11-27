import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import { Image, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export interface Reward {
  id: string;
  name: string;
  city: string;
  description: string;
  voucherAmountEuro: number;
  promoCode: string;
  expiresAt: string; // YYYY-MM-DD
  images: string[]; // 3 images
  pointsCost: number;
}

interface RewardCardProps {
  item: Reward;
  onRedeem?: (id: string, cost: number) => void;
  redeemed?: boolean;
  canAfford?: boolean;
}

export const RewardCard: React.FC<RewardCardProps> = ({ item, onRedeem, redeemed, canAfford }) => {
  const { colors } = useThemeMode();
  const router = useRouter();

  const slideW = 188; // image width + spacing approx
  const loopImages = useMemo(() => [...item.images, ...item.images, ...item.images, ...item.images], [item.images]);
  const midIndex = item.images.length; // start around middle
  const scRef = useRef<ScrollView>(null);
  const [active, setActive] = useState(0);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / slideW);
    const mod = ((idx % item.images.length) + item.images.length) % item.images.length;
    setActive(mod);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}> 
      <View style={styles.carouselWrapper}>
        <ScrollView
          ref={scRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={slideW}
          decelerationRate="fast"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentOffset={{ x: midIndex * slideW, y: 0 }}
          style={{ width: '100%' }}
        >
          {loopImages.map((src, idx) => (
            <TouchableOpacity key={idx} activeOpacity={0.85} onPress={() => router.push({ pathname: `/reward/${item.id}` })}>
              <Image source={{ uri: src }} style={styles.image} resizeMode="cover" />
            </TouchableOpacity>
          ))}
        </ScrollView>
        {/* Trois petites boules vides pour indiquer le swipe */}
        <View style={styles.dotsContainer} pointerEvents="none">
          {item.images.slice(0,3).map((_, i) => (
            <View key={i} style={[styles.dot, { borderColor: colors.mutedText, backgroundColor: i === active ? colors.accent : 'transparent' }]} />
          ))}
        </View>
      </View>
      <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
      <Text style={[styles.city, { color: colors.mutedText }]} numberOfLines={1}>{item.city}</Text>
      <Text style={[styles.desc, { color: colors.mutedText }]} numberOfLines={2}>{item.description}</Text>
      <View style={styles.metaRow}>
        <Ionicons name="pricetag-outline" size={14} color={colors.accent} />
        <Text style={[styles.metaText, { color: colors.mutedText }]}>Bon: {item.voucherAmountEuro}€ • Code: {item.promoCode}</Text>
      </View>
      <View style={styles.metaRow}>
        <Ionicons name="time-outline" size={14} color={colors.accent} />
        <Text style={[styles.metaText, { color: colors.mutedText }]}>Expire: {item.expiresAt}</Text>
      </View>
      <View style={styles.metaRow}>
        <Ionicons name="leaf-outline" size={14} color={colors.accent} />
        <Text style={[styles.metaText, { color: colors.mutedText }]}>Coût: {item.pointsCost} pts</Text>
      </View>
      {onRedeem && (
        <TouchableOpacity
          disabled={!canAfford || redeemed}
          onPress={() => onRedeem(item.id, item.pointsCost)}
          style={{
            marginTop: 10,
            paddingVertical: 10,
            borderRadius: 12,
            alignItems: 'center',
            backgroundColor: redeemed ? colors.surfaceAlt : (canAfford ? colors.accent : '#2A3431'),
          }}
        >
          <Text style={{ color: redeemed ? colors.mutedText : (canAfford ? '#0F3327' : '#8AA39C'), fontWeight: '700', fontSize: 13 }}>
            {redeemed ? 'Échangé' : 'Échanger'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 12, width: '100%', marginBottom: 12 },
  carouselWrapper: { width: '100%', height: 120, marginBottom: 10 },
  image: { width: 180, height: 120, borderRadius: 12, marginRight: 8 },
  dotsContainer: { position: 'absolute', bottom: 6, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, borderWidth: 1, backgroundColor: 'transparent' },
  name: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  city: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  desc: { fontSize: 11, lineHeight: 14, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  metaText: { marginLeft: 6, fontSize: 11, fontWeight: '600' },
});
