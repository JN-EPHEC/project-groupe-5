import { FontFamilies } from "@/constants/fonts";
import { useThemeMode } from "@/hooks/theme-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export interface Reward {
  id: string;
  name: string;
  city: string;
  description: string;
  voucherAmountEuro: number;
  promoCode: string;
  expiresAt: string;
  images: string[];
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
  const router = useRouter();
  const [confirmVisible, setConfirmVisible] = useState(false);

  // --- THEME ---
  // Fond : Blanc (Light) ou Bleu Glacé (Dark)
  const cardBg = isLight 
    ? ["rgba(255,255,255,0.9)", "rgba(255,255,255,0.6)"] 
    : ["rgba(0, 151, 178, 0.15)", "rgba(0, 151, 178, 0.05)"];
  
  const borderColor = isLight ? "rgba(255,255,255,0.6)" : "rgba(0, 151, 178, 0.3)";
  const titleColor = isLight ? "#0A3F33" : "#FFF";
  
  // ✅ RETOUR AU VERT MARQUE pour les actions (même en dark)
  const brandGreen = "#008F6B"; 

  return (
    <>
    <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={() => router.push({ pathname: `/reward/${item.id}` } as any)}
        style={{ flex: 1 }}
    >
      <LinearGradient
        colors={cardBg as any}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.card, { borderColor, borderWidth: 1 }]}
      >
        {/* IMAGE */}
        <Image source={{ uri: item.images[0] }} style={styles.image} resizeMode="cover" />
        
        {/* BADGE PRIX */}
        <View style={styles.priceBadge}>
            <Text style={styles.priceText}>{item.pointsCost} Greenies</Text>
        </View>

        {/* CONTENU */}
        <View style={styles.content}>
            <Text style={[styles.name, { color: titleColor }]} numberOfLines={1}>{item.name}</Text>
            {/* Montant en Vert */}
            <Text style={[styles.voucher, { color: brandGreen }]}>Bon de {item.voucherAmountEuro}€</Text>
            
            <TouchableOpacity
                onPress={() => {
                    if (redeemed) return;
                    setConfirmVisible(true);
                }}
                disabled={!canAfford && !redeemed}
                style={[
                    styles.button,
                    { backgroundColor: redeemed ? colors.surfaceAlt : (canAfford ? brandGreen : "#E2E8F0") }
                ]}
            >
                <Text style={[styles.btnText, { color: canAfford || redeemed ? (redeemed ? colors.mutedText : "#FFF") : "#A0AEC0" }]}>
                    {redeemed ? "Déjà obtenu" : "Échanger"}
                </Text>
            </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>

    {/* MODAL CONFIRMATION */}
    <Modal transparent visible={confirmVisible} animationType="fade" onRequestClose={() => setConfirmVisible(false)}>
        <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: isLight ? "#FFF" : "#021114", borderColor: isLight ? "transparent" : borderColor, borderWidth: isLight ? 0 : 1 }]}> 
            <Text style={[styles.modalTitle, { color: titleColor }]}>Confirmer l'échange</Text>
            <Text style={{ color: isLight ? "#4A665F" : "#A5C9BF", marginTop: 8, marginBottom: 20, lineHeight: 22 }}>
                Veux-tu dépenser <Text style={{ fontWeight: 'bold', color: isLight ? "#000" : "#FFF" }}>{item.pointsCost} Greenies</Text> pour obtenir un bon de <Text style={{ fontWeight: 'bold', color: isLight ? "#000" : "#FFF" }}>{item.voucherAmountEuro}€</Text> chez {item.name} ?
            </Text>
            <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setConfirmVisible(false)}>
                    <Text style={{ color: isLight ? "#4A665F" : "#FFF", fontWeight: '600' }}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.modalBtnConfirm, { backgroundColor: brandGreen }]}
                    onPress={() => {
                        setConfirmVisible(false);
                        onRedeem?.(item.id, item.pointsCost);
                    }}
                >
                    <Text style={{ color: "#FFF", fontWeight: '700' }}>Confirmer</Text>
                </TouchableOpacity>
            </View>
            </View>
        </View>
    </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 20, overflow: 'hidden', height: '100%', shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: {width:0, height:4}, elevation: 3 },
  image: { width: '100%', height: 110, backgroundColor: '#E2E8F0' },
  priceBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  priceText: { color: "#FFF", fontSize: 11, fontWeight: '700' },
  content: { padding: 12, flex: 1, justifyContent: 'space-between' },
  name: { fontSize: 14, fontFamily: FontFamilies.heading, marginBottom: 4 },
  voucher: { fontSize: 12, fontWeight: '700', marginBottom: 10 },
  button: { paddingVertical: 8, borderRadius: 10, alignItems: 'center', marginTop: 'auto' },
  btnText: { fontSize: 12, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontFamily: FontFamilies.heading },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalBtnCancel: { paddingVertical: 10, paddingHorizontal: 16 },
  modalBtnConfirm: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12 },
});