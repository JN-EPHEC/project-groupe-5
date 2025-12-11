import { Coupon } from '@/hooks/coupons-context';
import { useThemeMode } from '@/hooks/theme-context';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export function CouponCard({ coupon }: { coupon: Coupon }) {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";
  const cardBackground = colors.card;
  const cardText = isLight ? colors.cardText : colors.text;
  const cardMuted = isLight ? colors.cardMuted : colors.mutedText;
  const [open, setOpen] = useState(false);
  return (
    <>
      <View style={[
        styles.card, 
        { 
          backgroundColor: colors.glass, 
          borderColor: colors.glassBorder,
          borderWidth: 1,
        }
      ]}> 
        <View style={styles.row}> 
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: cardText }]} numberOfLines={1}>{coupon.name} • {coupon.voucherAmountEuro}€</Text>
            <Text style={[styles.code, { color: colors.accent }]}>Code: {coupon.code}</Text>
            <Text style={[styles.expiry, { color: cardMuted }]}>Expire: {coupon.expiresAt}</Text>
          </View>
          <Pressable onPress={() => setOpen(true)}>
            <QRCode value={coupon.code} size={72} backgroundColor='transparent' />
          </Pressable>
        </View>
      </View>
      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]} onPress={() => setOpen(false)}>
          <View style={[styles.qrModal, { backgroundColor: cardBackground }]}> 
            <Text style={{ color: cardText, fontWeight: '700', marginBottom: 12 }}>{coupon.name}</Text>
            <QRCode value={coupon.code} size={240} backgroundColor='transparent' />
            <Text style={{ color: cardMuted, marginTop: 12 }}>Tap pour fermer</Text>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 14, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  code: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  expiry: { fontSize: 11, fontWeight: '500' },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  qrModal: { padding: 20, borderRadius: 16, alignItems: 'center' },
});
