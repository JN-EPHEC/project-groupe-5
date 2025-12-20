import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import { Image, Modal, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";
  const cardBackground = colors.card;
  const cardAlt = colors.cardAlt;
  const cardText = isLight ? colors.cardText : colors.text;
  const cardMuted = isLight ? colors.cardMuted : colors.mutedText;
  const router = useRouter();

  const slideW = 188; // image width + spacing approx
  const loopImages = useMemo(() => [...item.images, ...item.images, ...item.images, ...item.images], [item.images]);
  const midIndex = item.images.length; // start around middle
  const scRef = useRef<ScrollView>(null);
  const [active, setActive] = useState(0);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / slideW);
    const mod = ((idx % item.images.length) + item.images.length) % item.images.length;
    setActive(mod);
  };

  return (
    <View style={[
      styles.card, 
      { 
        backgroundColor: colors.glass, 
        borderColor: colors.glassBorder,
        borderWidth: 1,
      }
    ]}> 
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
            <TouchableOpacity 
                key={idx} 
                activeOpacity={0.85} 
                // CORRECTION 1 : Ajout de 'as any' pour le router
                onPress={() => router.push({ pathname: `/reward/${item.id}` } as any)}
            >
              <Image source={{ uri: src }} style={styles.image} resizeMode="cover" />
            </TouchableOpacity>
          ))}
        </ScrollView>
        {/* Trois petites boules vides pour indiquer le swipe */}
        <View style={styles.dotsContainer} pointerEvents="none">
          {item.images.slice(0,3).map((_, i) => (
            <View key={i} style={[styles.dot, { borderColor: cardMuted, backgroundColor: i === active ? colors.accent : 'transparent' }]} />
          ))}
        </View>
      </View>
      <Text style={[styles.name, { color: cardText }]} numberOfLines={1}>{item.name}</Text>
      <Text style={[styles.city, { color: cardMuted }]} numberOfLines={1}>{item.city}</Text>
      <Text style={[styles.desc, { color: cardMuted }]} numberOfLines={2}>{item.description}</Text>
      <View style={styles.metaRow}>
        <Ionicons name="pricetag-outline" size={14} color={colors.accent} />
        <Text style={[styles.metaText, { color: cardMuted }]}>Bon: {item.voucherAmountEuro}€</Text>
      </View>
      <View style={styles.metaRow}>
        <Ionicons name="time-outline" size={14} color={colors.accent} />
        <Text style={[styles.metaText, { color: cardMuted }]}>Expire: {item.expiresAt}</Text>
      </View>
      <View style={styles.metaRow}>
        <Ionicons name="leaf-outline" size={14} color={colors.accent} />
        <Text style={[styles.metaText, { color: cardMuted }]}>Coût: {item.pointsCost} pts</Text>
      </View>
      {onRedeem && (
        <TouchableOpacity
          onPress={() => {
            if (redeemed) return;
            setConfirmVisible(true);
          }}
          style={{
            marginTop: 10,
            paddingVertical: 10,
            borderRadius: 12,
            alignItems: 'center',
            backgroundColor: redeemed ? cardAlt : (canAfford ? colors.accent : '#2A3431'),
          }}
        >
          <Text style={{ color: redeemed ? cardMuted : (canAfford ? '#0F3327' : '#8AA39C'), fontWeight: '700', fontSize: 13 }}>
            {redeemed ? 'Échangé' : 'Échanger'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Confirm exchange modal */}
      <Modal transparent visible={confirmVisible} animationType="fade" onRequestClose={() => setConfirmVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: cardBackground }]}> 
            <Text style={[styles.modalTitle, { color: cardText }]}>Confirmer l'échange</Text>
            <Text style={{ color: cardMuted, marginTop: 6 }}>
              {canAfford ? `Échanger ${item.pointsCost} pts contre ${item.voucherAmountEuro}€ chez ${item.name} ?` : `Points insuffisants: il faut ${item.pointsCost} pts.`}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalCancelBtn]} onPress={() => setConfirmVisible(false)}>
                <Text style={styles.modalCancelText}>Non</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalConfirmBtn, { opacity: canAfford ? 1 : 0.6 }]}
                disabled={!canAfford}
                onPress={() => {
                  setConfirmVisible(false);
                  onRedeem?.(item.id, item.pointsCost);
                }}
              >
                <Text style={styles.modalConfirmText}>Oui</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <TouchableOpacity
        // CORRECTION 2 : Ajout de 'as any' ici aussi
        onPress={() => router.push({ pathname: `/reward/${item.id}` } as any)}
        style={{ marginTop: 8, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: cardAlt }}
      >
        <Text style={{ color: cardText, fontWeight: '600', fontSize: 12 }}>En savoir plus</Text>
      </TouchableOpacity>
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
  // Modal styles aligned with defi cards
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 360, borderRadius: 16, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 10 },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
  modalCancelBtn: { backgroundColor: '#2A3431' },
  modalConfirmBtn: { backgroundColor: '#7DCAB0' },
  modalCancelText: { color: '#E6FFF5', fontWeight: '700' },
  modalConfirmText: { color: '#0F3327', fontWeight: '700' },
});