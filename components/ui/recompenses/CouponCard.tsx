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
  // On compare la date actuelle avec la date d'expiration (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];
  const isExpired = coupon.expiresAt < today;

  // Si expiré, on ne l'affiche pas du tout
  if (isExpired) return null;

  // --- FORMATAGE DE LA DATE (YYYY-MM-DD -> DD/MM/YYYY) ---
  const formatDate = (isoDate: string) => {
      if (!isoDate) return "";
      const parts = isoDate.split("-");
      if (parts.length !== 3) return isoDate;
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  // --- THEME ---
  const cardBg = isLight 
    ? ["#FFFFFF", "rgba(255,255,255,0.7)"] 
    : ["rgba(0, 151, 178, 0.15)", "rgba(0, 151, 178, 0.05)"];
  
  const borderColor = isLight ? "rgba(255,255,255,0.8)" : "rgba(0, 151, 178, 0.3)";
  const textColor = isLight ? "#0A3F33" : "#FFF";
  
  const brandGreen = isLight ? "#008F6B" : "#00D68F";

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
                        <Text style={[styles.expiry, { color: isLight ? colors.mutedText : "#A5C9BF" }]}>
                            Valide jusqu'au {formatDate(coupon.expiresAt)}
                        </Text>
                    </View>
                    <View style={[styles.amountBadge, { backgroundColor: isLight ? "#E0F7EF" : "rgba(0, 143, 107, 0.15)" }]}>
                        <Text style={[styles.amountText, { color: brandGreen }]}>{coupon.voucherAmountEuro}€</Text>
                    </View>
                </View>

                <View style={[styles.codeContainer, { borderColor: isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)" }]}>
                    <Text style={{ color: isLight ? colors.mutedText : "#A5C9BF", fontSize: 10, fontWeight: '700', marginRight: 6 }}>CODE :</Text>
                    <Text style={[styles.codeText, { color: textColor }]}>{coupon.code}</Text>
                </View>
            </View>

            {/* SÉPARATEUR */}
            <View style={styles.separatorContainer}>
                <View style={[styles.notch, { top: -6, backgroundColor: isLight ? colors.background : "#021114" }]} />
                <View style={[styles.dashedLine, { borderColor: isLight ? colors.mutedText : "rgba(255,255,255,0.2)" }]} />
                <View style={[styles.notch, { bottom: -6, backgroundColor: isLight ? colors.background : "#021114" }]} />
            </View>

            {/* DROITE : MINI QR */}
            <View style={styles.rightSection}>
                <QRCode value={coupon.code} size={48} color={textColor} backgroundColor="transparent" />
                <Text style={[styles.tapText, { color: brandGreen }]}>Voir</Text>
            </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* MODAL ZOOM */}
      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={[styles.qrModal, { backgroundColor: isLight ? "#FFF" : "#021114", borderColor: isLight ? "transparent" : borderColor, borderWidth: isLight ? 0 : 1 }]}> 
            <Text style={{ color: textColor, fontFamily: FontFamilies.heading, fontSize: 18, marginBottom: 8, textAlign: 'center' }}>
                {coupon.name}
            </Text>
            <Text style={{ color: brandGreen, fontSize: 24, fontWeight: '800', marginBottom: 20 }}>
                {coupon.voucherAmountEuro}€
            </Text>
            
            {/* QR CODE CENTRÉ */}
            <View style={{ padding: 16, backgroundColor: '#FFF', borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                <QRCode value={coupon.code} size={200} backgroundColor='white' />
            </View>

            {/* CODE TEXTE REMONTÉ */}
            <View style={[styles.codeContainerModal, { backgroundColor: isLight ? "#F3F4F6" : "rgba(255,255,255,0.1)" }]}>
                <Text style={{ color: textColor, fontSize: 20, fontWeight: 'bold', letterSpacing: 2, textAlign: 'center' }}>{coupon.code}</Text>
            </View>
            
            <Text style={{ color: isLight ? colors.mutedText : "#6E8580", marginTop: 16, fontSize: 13, textAlign: 'center' }}>Appuyez pour fermer</Text>
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
  codeContainerModal: {
      marginTop: 20, 
      paddingVertical: 12, 
      paddingHorizontal: 24, 
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%' 
  },
  codeText: { fontFamily: 'Courier', fontWeight: '700', fontSize: 14, letterSpacing: 1 },

  separatorContainer: { width: 1, justifyContent: 'center', alignItems: 'center', marginHorizontal: 4 },
  dashedLine: { width: 1, height: '70%', borderWidth: 1, borderStyle: 'dashed', opacity: 0.3 },
  notch: { position: 'absolute', width: 12, height: 12, borderRadius: 6, left: -5.5, zIndex: 10 },

  tapText: { fontSize: 10, fontWeight: '700', marginTop: 6, textTransform: 'uppercase' },

  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 24 },
  qrModal: { width: '100%', padding: 24, borderRadius: 24, alignItems: 'center' },
});