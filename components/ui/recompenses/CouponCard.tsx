import { FontFamilies } from "@/constants/fonts";
import { Coupon } from '@/hooks/coupons-context';
import { useThemeMode } from '@/hooks/theme-context';
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export function CouponCard({ coupon }: { coupon: Coupon }) {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";
  const [open, setOpen] = useState(false);

  // --- LOGIQUE D'EXPIRATION ---
  const today = new Date().toISOString().split('T')[0];
  const isExpired = coupon.expiresAt < today;
  if (isExpired) return null;

  const formatDate = (isoDate: string) => {
      if (!isoDate) return "";
      const parts = isoDate.split("-");
      if (parts.length !== 3) return isoDate;
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  // Couleurs
  const cardBg = isLight 
    ? ["#FFFFFF", "rgba(255,255,255,0.95)"] 
    : ["rgba(0, 151, 178, 0.15)", "rgba(0, 151, 178, 0.05)"];
  const borderColor = isLight ? "rgba(0,0,0,0.05)" : "rgba(0, 151, 178, 0.3)";
  const textColor = isLight ? "#0A3F33" : "#FFF";
  const brandGreen = isLight ? "#008F6B" : "#00D68F";

  return (
    <>
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={() => setOpen(true)}
        style={{ marginBottom: 16, width: '100%' }} // Largeur 100% pour la liste
      >
        <LinearGradient
            colors={cardBg as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.card, { borderColor, borderWidth: 1 }]}
        >
            {/* GAUCHE : INFOS */}
            <View style={styles.leftSection}>
                <View style={styles.headerRow}>
                    <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
                        {coupon.name}
                    </Text>
                    <View style={[styles.amountBadge, { backgroundColor: isLight ? "#E0F7EF" : "rgba(0, 143, 107, 0.15)" }]}>
                        <Text style={[styles.amountText, { color: brandGreen }]}>{coupon.voucherAmountEuro}€</Text>
                    </View>
                </View>

                <Text style={[styles.expiry, { color: isLight ? colors.mutedText : "#A5C9BF" }]}>
                    Valide jusqu'au {formatDate(coupon.expiresAt)}
                </Text>

                <View style={[styles.codeContainer, { borderColor: isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)" }]}>
                    <Text style={styles.codeLabel}>CODE :</Text>
                    <Text style={[styles.codeText, { color: textColor }]}>{coupon.code}</Text>
                </View>
            </View>

            {/* SEPARATEUR VISUEL */}
            <View style={styles.separatorContainer}>
                <View style={[styles.dashedLine, { borderColor: isLight ? "#CCC" : "rgba(255,255,255,0.2)" }]} />
            </View>

            {/* DROITE : MINI QR */}
            <View style={styles.rightSection}>
                <View style={styles.qrWrapper}>
                    <QRCode value={coupon.code} size={42} color={textColor} backgroundColor="transparent" />
                </View>
                <Text style={[styles.tapText, { color: brandGreen }]}>VOIR</Text>
            </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* MODAL ZOOM */}
      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={[styles.qrModal, { backgroundColor: isLight ? "#FFF" : "#021114" }]}> 
            <Text style={{ color: textColor, fontFamily: FontFamilies.heading, fontSize: 18, marginBottom: 8 }}>
                {coupon.name}
            </Text>
            
            <View style={{ padding: 20, backgroundColor: '#FFF', borderRadius: 16, marginVertical: 20 }}>
                <QRCode value={coupon.code} size={180} />
            </View>

            <Text style={{ color: textColor, fontSize: 22, fontWeight: 'bold', letterSpacing: 3, fontFamily: 'Courier' }}>
                {coupon.code}
            </Text>
            <Text style={{ color: colors.mutedText, marginTop: 20, fontSize: 13 }}>Taper pour fermer</Text>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    flexDirection: 'row',
    height: 110, // ✅ HAUTEUR FIXE POUR EVITER L'EFFET GEANT
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2
  },
  leftSection: { flex: 1, padding: 14, justifyContent: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  title: { fontSize: 15, fontFamily: FontFamilies.heading, flex: 1, marginRight: 8 },
  amountBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  amountText: { fontWeight: '800', fontSize: 12 },
  expiry: { fontSize: 10, fontFamily: FontFamilies.body, marginBottom: 10 },
  
  codeContainer: { 
      flexDirection: 'row', alignItems: 'center', 
      paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, 
      borderWidth: 1, borderStyle: 'dashed', alignSelf: 'flex-start' 
  },
  codeLabel: { fontSize: 9, fontWeight: '700', marginRight: 4, color: '#888' },
  codeText: { fontFamily: 'Courier', fontWeight: '700', fontSize: 13 },

  separatorContainer: { width: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 10 },
  dashedLine: { width: 1, height: '100%', borderWidth: 0.5, borderStyle: 'dashed' },

  rightSection: { width: 80, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.02)' },
  qrWrapper: { opacity: 0.9 },
  tapText: { fontSize: 9, fontWeight: '800', marginTop: 6 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 30 },
  qrModal: { width: '100%', padding: 24, borderRadius: 24, alignItems: 'center' }
});