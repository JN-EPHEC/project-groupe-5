import { rewardsData } from "@/components/ui/recompenses/data";
import { FontFamilies } from "@/constants/fonts";
import { useCoupons } from "@/hooks/coupons-context";
import { usePoints } from "@/hooks/points-context";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// 🎨 THEME DETAILS
const detailsTheme = {
  bgGradient: ["#DDF7E8", "#F4FDF9"] as const,
  glassSheet: ["rgba(255, 255, 255, 0.95)", "rgba(255, 255, 255, 0.85)"] as const,
  accent: "#008F6B", // Vert Marque
  textMain: "#0A3F33",
  textMuted: "#4A665F",
};

export default function RewardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";

  const { points, spendPoints } = usePoints();
  const { addCoupon, hasCoupon } = useCoupons();

  // Trouver la récompense
  const reward = useMemo(
    () => rewardsData.find((r) => r.id === id),
    [id]
  );

  if (!reward) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Récompense introuvable.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.accent }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const already = hasCoupon(reward.id);
  const canAfford = points >= reward.pointsCost && !already;
  const [activeImg, setActiveImg] = useState(0);

  const handleRedeem = () => {
    if (already) {
        Alert.alert('Déjà échangé', 'Cette récompense est déjà dans tes coupons.');
        return;
    }
    
    Alert.alert(
      "Confirmer l'échange",
      `Dépenser ${reward.pointsCost} Greenies pour ce bon de ${reward.voucherAmountEuro}€ ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: () => {
            const success = spendPoints(reward.pointsCost, `Échange : ${reward.name}`);
            if (success) {
              addCoupon(reward.id);
              Alert.alert("Félicitations !", "Ton coupon est disponible dans l'onglet 'Mes coupons'.");
              router.back();
            } else {
              Alert.alert("Oups", "Greenies insuffisants.");
            }
          },
        },
      ]
    );
  };

  // Couleurs dynamiques
  const titleColor = isLight ? detailsTheme.textMain : colors.text;
  const textColor = isLight ? detailsTheme.textMuted : colors.mutedText;
  const accentColor = isLight ? detailsTheme.accent : colors.accent;

  // Wrapper Fond
  const BackgroundComponent = isLight ? LinearGradient : View;
  const bgProps = isLight
    ? { colors: detailsTheme.bgGradient, style: StyleSheet.absoluteFill }
    : { style: [StyleSheet.absoluteFill, { backgroundColor: "#021114" }] };

  return (
    <View style={{ flex: 1 }}>
      <BackgroundComponent {...(bgProps as any)} />

      {/* IMAGE HERO (Carousel simple) */}
      <View style={styles.heroContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => {
            const slide = Math.ceil(
              e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width
            );
            if (slide !== activeImg) setActiveImg(slide);
          }}
          scrollEventThrottle={16}
        >
          {reward.images.map((img, idx) => (
            <Image key={idx} source={{ uri: img }} style={styles.heroImage} resizeMode="cover" />
          ))}
        </ScrollView>
        
        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {reward.images.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                idx === activeImg ? { backgroundColor: "#FFF", width: 20 } : { backgroundColor: "rgba(255,255,255,0.5)" },
              ]}
            />
          ))}
        </View>

        {/* Bouton Retour Flottant */}
        <SafeAreaView style={styles.backBtnContainer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      {/* CONTENU (Sheet) */}
      <View style={{ flex: 1 }}>
        <LinearGradient
            colors={isLight ? detailsTheme.glassSheet : ["#1A2F28", "#0F1F1A"]}
            style={styles.sheet}
        >
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                {/* EN-TÊTE */}
                <View style={styles.header}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.title, { color: titleColor }]}>{reward.name}</Text>
                        <Text style={[styles.city, { color: textColor }]}>
                            <Ionicons name="location-outline" size={14} /> {reward.city}
                        </Text>
                    </View>
                    <View style={[styles.priceTag, { backgroundColor: isLight ? "#E0F7EF" : "rgba(255,255,255,0.1)" }]}>
                        <Text style={{ color: accentColor, fontWeight: "800", fontSize: 16 }}>{reward.pointsCost}</Text>
                        <Text style={{ color: accentColor, fontSize: 10, fontWeight: "600" }}>Greenies</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* INFO BLOCKS */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="business-outline" size={20} color={accentColor} />
                        <Text style={[styles.sectionTitle, { color: titleColor }]}>L'entreprise</Text>
                    </View>
                    <Text style={[styles.bodyText, { color: textColor }]}>
                        {reward.description}
                    </Text>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="gift-outline" size={20} color={accentColor} />
                        <Text style={[styles.sectionTitle, { color: titleColor }]}>La récompense</Text>
                    </View>
                    <Text style={[styles.bodyText, { color: textColor }]}>
                        Bon d'achat de <Text style={{ fontWeight: 'bold', color: titleColor }}>{reward.voucherAmountEuro}€</Text> valable sur tout le magasin.
                    </Text>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="time-outline" size={20} color={accentColor} />
                        <Text style={[styles.sectionTitle, { color: titleColor }]}>Validité</Text>
                    </View>
                    <Text style={[styles.bodyText, { color: textColor }]}>
                        Utilisable jusqu'au {reward.expiresAt}. Code unique à présenter en caisse.
                    </Text>
                </View>

            </ScrollView>

            {/* BOUTON D'ACTION (Fixe en bas du sheet) */}
            <View style={[styles.footer, { borderTopColor: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.1)" }]}>
                <TouchableOpacity
                    onPress={handleRedeem}
                    disabled={!canAfford && !already}
                    activeOpacity={0.9}
                    style={{ flex: 1 }}
                >
                    <LinearGradient
                        colors={already ? ["#E2E8F0", "#CBD5E0"] : (canAfford ? ["#008F6B", "#10B981"] : ["#A0AEC0", "#718096"])}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.actionBtn}
                    >
                        <Text style={[styles.actionBtnText, { color: already ? "#718096" : "#FFF" }]}>
                            {already ? "Déjà obtenu" : canAfford ? "Échanger maintenant" : `Greenies insuffisants (${reward.pointsCost})`}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  // HERO IMAGE
  heroContainer: { height: 320, width: "100%" },
  heroImage: { width: width, height: 320 },
  pagination: {
    position: "absolute", bottom: 40, width: "100%",
    flexDirection: "row", justifyContent: "center", gap: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.5)" },
  
  // BACK BUTTON
  backBtnContainer: { position: "absolute", top: 10, left: 20 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.8)",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 3
  },

  // SHEET CONTENT
  sheet: {
    flex: 1,
    marginTop: -24, // Chevauchement sur l'image
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    paddingHorizontal: 24,
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 10
  },
  
  // HEADER
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  title: { fontSize: 24, fontFamily: FontFamilies.heading, fontWeight: "800", marginBottom: 4, lineHeight: 28, flex: 1, marginRight: 10 },
  city: { fontSize: 14, fontFamily: FontFamilies.body, opacity: 0.8 },
  priceTag: { 
      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, 
      alignItems: "center", justifyContent: "center" 
  },

  divider: { height: 1, backgroundColor: "rgba(0,0,0,0.05)", marginBottom: 20 },

  // SECTIONS
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700", fontFamily: FontFamilies.heading },
  bodyText: { fontSize: 14, lineHeight: 22, fontFamily: FontFamilies.body, opacity: 0.9, paddingLeft: 30 },

  // FOOTER
  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: 20, paddingBottom: 30,
    borderTopWidth: 1,
    backgroundColor: "transparent"
  },
  actionBtn: {
    paddingVertical: 16, borderRadius: 20, alignItems: "center", justifyContent: "center",
    shadowColor: "#008F6B", shadowOpacity: 0.2, shadowOffset: {width: 0, height: 4}, elevation: 4
  },
  actionBtnText: { fontSize: 14, fontWeight: "700", fontFamily: FontFamilies.heading, textTransform: "uppercase", letterSpacing: 0.5 },
});