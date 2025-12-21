import { FontFamilies } from "@/constants/fonts";
import { Coupon } from '@/hooks/coupons-context';
import { useThemeMode } from '@/hooks/theme-context';
import { LinearGradient } from "expo-linear-gradient"; // ✅ AJOUT
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export function CouponCard({ coupon }: { coupon: Coupon }) {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";
  const [open, setOpen] = useState(false);

  // Couleurs dynamiques
  const cardBg = isLight ? ["#FFFFFF", "rgba(255,255,255,0.7)"] : ["rgba(0, 151, 178, 0.15)", "rgba(0, 151, 178, 0.05)"];
  const borderColor = isLight ? "rgba(255,255,255,0.8)" : "rgba(0,151,178,0.3)";
  const textColor = isLight ? "#0A3F33" : colors.text;
  const accentColor = isLight ? "#008F6B" : colors.accent;

  return (
    <>
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={() => setOpen(true)}
        style={{ marginBottom: 16 }}
      >
        <LinearGradient
            colors={cardBg as any}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.card, { borderColor, borderWidth: 1 }]}
        >
            {/* GAUCHE : INFOS */}
            <View style={styles.leftSection}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>{coupon.name}</Text>
                        <Text style={[styles.expiry, { color: colors.mutedText }]}>Valide jusqu'au {coupon.expiresAt}</Text>
                    </View>
                    <View style={[styles.amountBadge, { backgroundColor: isLight ? "#E0F7EF" : "rgba(0,143,107,0.2)" }]}>
                        <Text style={[styles.amountText, { color: accentColor }]}>{coupon.voucherAmountEuro}€</Text>
                    </View>
                </View>

                <View style={[styles.codeContainer, { borderColor: isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)" }]}>
                    <Text style={{ color: colors.mutedText, fontSize: 10, fontWeight: '700', marginRight: 6 }}>CODE :</Text>
                    <Text style={[styles.codeText, { color: textColor }]}>{coupon.code}</Text>
                </View>
            </View>

            {/* SÉPARATEUR (Ligne pointillée) */}
            <View style={styles.separatorContainer}>
                <View style={[styles.notch, { top: -6, backgroundColor: isLight ? colors.background : "#021114" }]} />
                <View style={[styles.dashedLine, { borderColor: colors.mutedText }]} />
                <View style={[styles.notch, { bottom: -6, backgroundColor: isLight ? colors.background : "#021114" }]} />
            </View>

            {/* DROITE : MINI QR */}
            <View style={styles.rightSection}>
                <QRCode value={coupon.code} size={48} color={textColor} backgroundColor="transparent" />
                <Text style={[styles.tapText, { color: accentColor }]}>Voir</Text>
            </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* MODAL ZOOM */}
      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={[styles.qrModal, { backgroundColor: isLight ? "#FFF" : colors.card }]}> 
            <Text style={{ color: textColor, fontFamily: FontFamilies.heading, fontSize: 18, marginBottom: 8, textAlign: 'center' }}>
                {coupon.name}
            </Text>
            <Text style={{ color: accentColor, fontSize: 24, fontWeight: '800', marginBottom: 20 }}>
                {coupon.voucherAmountEuro}€
            </Text>
            
            <View style={{ padding: 16, backgroundColor: '#FFF', borderRadius: 16 }}>
                <QRCode value={coupon.code} size={200} backgroundColor='white' />
            </View>

            <View style={[styles.codeContainer, { marginTop: 24, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: isLight ? "#F3F4F6" : "rgba(255,255,255,0.1)", borderWidth: 0 }]}>
                <Text style={{ color: textColor, fontSize: 20, fontWeight: 'bold', letterSpacing: 2 }}>{coupon.code}</Text>
            </View>
            
            <Text style={{ color: colors.mutedText, marginTop: 16, fontSize: 13 }}>Appuyez pour fermer</Text>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3
  },
  leftSection: { flex: 1, padding: 16, justifyContent: 'space-between' },
  rightSection: { width: 80, alignItems: 'center', justifyContent: 'center', paddingRight: 8 },
  
  title: { fontSize: 16, fontFamily: FontFamilies.heading, marginBottom: 2 },
  expiry: { fontSize: 11, fontFamily: FontFamilies.body },
  
  amountBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  amountText: { fontWeight: '800', fontSize: 14 },

  codeContainer: { 
      flexDirection: 'row', alignItems: 'center', 
      marginTop: 12, padding: 8, borderRadius: 8, 
      borderWidth: 1, borderStyle: 'dashed', 
      alignSelf: 'flex-start' 
  },
  codeText: { fontFamily: 'Courier', fontWeight: '700', fontSize: 14, letterSpacing: 1 },

  separatorContainer: { width: 1, justifyContent: 'center', alignItems: 'center', marginHorizontal: 4 },
  dashedLine: { width: 1, height: '70%', borderWidth: 1, borderStyle: 'dashed', opacity: 0.3 },
  notch: { position: 'absolute', width: 12, height: 12, borderRadius: 6, left: -5.5, zIndex: 10 },

  tapText: { fontSize: 10, fontWeight: '700', marginTop: 6, textTransform: 'uppercase' },

  // Modal
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 24 },
  qrModal: { width: '100%', padding: 24, borderRadius: 24, alignItems: 'center' },
});