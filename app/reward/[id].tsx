import { FontFamilies } from "@/constants/fonts";
import { db } from "@/firebaseConfig";
import { useCoupons } from "@/hooks/coupons-context";
import { usePoints } from "@/hooks/points-context";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const detailsTheme = {
  bgGradient: ["#DDF7E8", "#F4FDF9"] as const,
  glassSheet: ["rgba(255, 255, 255, 0.95)", "rgba(255, 255, 255, 0.85)"] as const,
  darkGlassSheet: ["rgba(2, 17, 20, 0.95)", "rgba(2, 17, 20, 0.9)"] as const,
  accent: "#008F6B",
  darkAccent: "#008F6B",
  textMain: "#0A3F33",
  textMuted: "#4A665F",
};

export default function RewardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";

  const { points } = usePoints();
  const { addCoupon, hasCoupon } = useCoupons();

  const [reward, setReward] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  
  // NOUVEAUX STATES POUR LA MODAL ET LE CHARGEMENT
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchReward = async () => {
      try {
        const docRef = doc(db, "rewards", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setReward({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Erreur chargement:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReward();
  }, [id]);

  const formatDate = (isoDate: string) => {
    if (!isoDate) return "";
    const parts = isoDate.split("-");
    return parts.length !== 3 ? isoDate : `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: isLight ? "#F4FDF9" : "#021114" }]}>
        <ActivityIndicator size="large" color="#008F6B" />
      </View>
    );
  }

  if (!reward) return null;

  const today = new Date().toISOString().split('T')[0];
  const isExpired = reward.expiresAt < today;
  const already = hasCoupon(reward.id);
  const canAfford = points >= reward.pointsCost && !already && !isExpired;
  const images = reward.images?.length > 0 ? reward.images : ["https://placehold.co/600x400/png?text=Pas+d'image"];

  // ACTIONS
  const handleOpenConfirm = () => {
    if (canAfford && !isProcessing) {
      setConfirmVisible(true);
    }
  };

  const confirmExchange = async () => {
    setConfirmVisible(false);
    setIsProcessing(true);
    
    // On appelle addCoupon qui gère déjà la transaction et les points
    const success = await addCoupon(reward.id, reward.pointsCost);
    
    setIsProcessing(false);
    if (success) {
      router.replace("/(tabs)/recompenses" as any); // Retour à la liste (onglet coupons auto)
    }
  };

  const titleColor = isLight ? detailsTheme.textMain : "#FFF";
  const textColor = isLight ? detailsTheme.textMuted : "#A5C9BF";
  const accentColor = isLight ? detailsTheme.accent : detailsTheme.darkAccent;

  const BackgroundComponent = isLight ? LinearGradient : View;
  const bgProps = isLight 
    ? { colors: detailsTheme.bgGradient, style: StyleSheet.absoluteFill } 
    : { style: [StyleSheet.absoluteFill, { backgroundColor: "#021114" }] };

  return (
    <View style={{ flex: 1 }}>
      <BackgroundComponent {...(bgProps as any)} />

      {/* HERO IMAGE */}
      <View style={styles.heroContainer}>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={(e) => {
            const slide = Math.ceil(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
            if (slide !== activeImg) setActiveImg(slide);
          }} scrollEventThrottle={16}>
          {images.map((img: string, idx: number) => (
            <Image key={idx} source={{ uri: img }} style={styles.heroImage} resizeMode="cover" />
          ))}
        </ScrollView>
        <SafeAreaView style={styles.backBtnContainer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      {/* CONTENT SHEET */}
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={isLight ? detailsTheme.glassSheet : detailsTheme.darkGlassSheet}
          style={[styles.sheet, !isLight && { borderColor: "rgba(0, 143, 107, 0.3)", borderWidth: 1, borderBottomWidth: 0 }]}
        >
          <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: titleColor }]}>{reward.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="location-outline" size={14} color={textColor} />
                  <Text style={{ fontSize: 14, color: textColor, marginLeft: 4 }}> {reward.city}</Text>
                </View>
              </View>
              <View style={[styles.priceTag, { backgroundColor: isLight ? "#E0F7EF" : "rgba(0, 143, 107, 0.15)" }]}>
                <Text style={{ color: accentColor, fontWeight: "800", fontSize: 16 }}>{reward.pointsCost}</Text>
                <Text style={{ color: accentColor, fontSize: 10 }}>Greenies</Text>
              </View>
            </View>

            <View style={styles.section}>
               <Text style={[styles.sectionTitle, { color: titleColor }]}>L'entreprise</Text>
               <Text style={[styles.bodyText, { color: textColor }]}>{reward.description}</Text>
            </View>

            <View style={styles.section}>
               <Text style={[styles.sectionTitle, { color: titleColor }]}>La récompense</Text>
               <Text style={[styles.bodyText, { color: textColor }]}>
                 Bon d'achat de <Text style={{ fontWeight: 'bold', color: titleColor }}>{reward.voucherAmountEuro}€</Text> sur tout le magasin.
               </Text>
            </View>
          </ScrollView>

          {/* FOOTER BUTTON */}
          <View style={[styles.footer, { borderTopColor: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.1)" }]}>
            <TouchableOpacity
              onPress={handleOpenConfirm}
              disabled={!canAfford || isProcessing}
              style={{ flex: 1 }}
            >
              <LinearGradient
                colors={already ? ["#CBD5E0", "#A0AEC0"] : (canAfford ? ["#008F6B", "#10B981"] : ["#E2E8F0", "#CBD5E0"])}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.actionBtn}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={[styles.actionBtnText, { color: already || !canAfford ? "#718096" : "#FFF" }]}>
                    {already ? "Déjà obtenu" : canAfford ? "Échanger maintenant" : `Solde insuffisant`}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* MODAL DE CONFIRMATION PERSONNALISÉE */}
      <Modal transparent visible={confirmVisible} animationType="fade" onRequestClose={() => setConfirmVisible(false)}>
        <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: isLight ? "#FFF" : "#021114", borderColor: accentColor, borderWidth: isLight ? 0 : 1 }]}>
                <Text style={[styles.modalTitle, { color: titleColor }]}>Confirmer l'échange</Text>
                <Text style={{ color: textColor, marginVertical: 20, textAlign: 'center', lineHeight: 20 }}>
                    Veux-tu utiliser <Text style={{ fontWeight: 'bold', color: accentColor }}>{reward.pointsCost} Greenies</Text> pour obtenir ce bon de {reward.voucherAmountEuro}€ ?
                </Text>
                <View style={styles.modalButtons}>
                    <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setConfirmVisible(false)}>
                        <Text style={{ color: textColor, fontWeight: '600' }}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalBtnConfirm, { backgroundColor: accentColor }]} onPress={confirmExchange}>
                        <Text style={{ color: "#FFF", fontWeight: '700' }}>Confirmer</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  heroContainer: { height: 320, width: "100%" },
  heroImage: { width: width, height: 320 },
  backBtnContainer: { position: "absolute", top: 10, left: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.8)", alignItems: "center", justifyContent: "center" },
  sheet: { flex: 1, marginTop: -24, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 24, paddingHorizontal: 24 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  title: { fontSize: 24, fontFamily: FontFamilies.heading, fontWeight: "800", flex: 1, marginRight: 10 },
  priceTag: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, alignItems: "center" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  bodyText: { fontSize: 14, lineHeight: 22, opacity: 0.9 },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 35, borderTopWidth: 1 },
  actionBtn: { paddingVertical: 16, borderRadius: 20, alignItems: "center" },
  actionBtnText: { fontSize: 14, fontWeight: "700", textTransform: "uppercase" },
  // MODAL STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 30 },
  modalCard: { padding: 25, borderRadius: 30, alignItems: 'center', elevation: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalButtons: { flexDirection: 'row', gap: 15, marginTop: 10 },
  modalBtnCancel: { flex: 1, padding: 15, alignItems: 'center' },
  modalBtnConfirm: { flex: 2, padding: 15, borderRadius: 15, alignItems: 'center' }
});