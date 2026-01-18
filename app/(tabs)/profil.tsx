import { NotificationBell } from "@/components/ui/common/NotificationBell";
import { Header } from "@/components/ui/profil/Header";
import { SettingsSection } from "@/components/ui/profil/SettingsSection";
import { ShareQRModal } from "@/components/ui/qr/ShareQRModal";
import PremiumCard from "@/components/ui/recompenses/PremiumCard";
import { FontFamilies } from "@/constants/fonts";
import { auth, db } from "@/firebaseConfig";
import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { addDoc, collection, onSnapshot } from "firebase/firestore";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// 🎨 THEME PROFIL
const profileTheme = {
  bgGradient: ["#DDF7E8", "#F4FDF9"] as const,
  accent: "#008F6B", // Vert Marque
  textMain: "#0A3F33",
};

export default function ProfilScreen() {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";
  const { user } = useUser();
  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  const [showQR, setShowQR] = useState(false);
  const router = useRouter();

  const startSubscription = async () => {
    const current = auth.currentUser;
    if (!current) {
      alert("Tu dois être connecté.");
      return;
    }

    try {
      const sessionRef = await addDoc(
        collection(db, "customers", current.uid, "checkout_sessions"),
        {
          price: "price_1Se0BDCh6MpiIMZkio91hT1d",
          mode: "subscription",
          success_url: "https://example.com/success",
          cancel_url: "https://example.com/cancel",
        }
      );

      onSnapshot(sessionRef, (snap) => {
        const data = snap.data();
        if (!data) return;
        if (data.error) alert(data.error.message);
        if (data.url) Linking.openURL(data.url);
      });
    } catch (error: any) {
      alert(error?.message || "Une erreur est survenue.");
    }
  };

  const sectionSpacing = { marginBottom: 17 } as const;

  // Wrapper Fond
  const BackgroundComponent = isLight ? LinearGradient : View;
  const bgProps = isLight 
    ? { colors: profileTheme.bgGradient, style: StyleSheet.absoluteFill } 
    : { style: [StyleSheet.absoluteFill, { backgroundColor: "#021114" }] };

  return (
    <View style={{ flex: 1 }}>
      <BackgroundComponent {...(bgProps as any)} />
      
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 160 }}
          showsVerticalScrollIndicator={false}
        >
          {/* TITLE & NOTIF */}
          <View style={styles.titleRow}>
            <Text style={[styles.titleText, { color: isLight ? profileTheme.textMain : colors.text }]}>
              Profil
            </Text>
            <View style={{ position: 'absolute', right: 0, top: 4 }}>
              <NotificationBell />
            </View>
          </View>

          {/* HEADER (Avatar + Nom) */}
          <Header />

          {/* ACTIONS RAPIDES (Modifier / Partager) */}
          <View style={[sectionSpacing, styles.firstBlockMargin]}>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => router.push("/edit-profile")}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={isLight ? ["#008F6B", "#10B981"] : [colors.cardAlt, colors.card]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryBtnText}>Modifier mon profil</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => setShowQR(true)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={isLight ? ["#008F6B", "#10B981"] : [colors.cardAlt, colors.card]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryBtnText}>Partager mon profil</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* PREMIUM */}
          <View style={sectionSpacing}>
            <PremiumCard onSubscribe={startSubscription} />
          </View>

          {/* SETTINGS */}
          <View style={[sectionSpacing, styles.tighterSpacing]}>
            <SettingsSection />
          </View>

          {/* ADMIN ACCESS */}
          {user?.isAdmin && (
            <TouchableOpacity
              onPress={() => router.push("../(admin)")}
              activeOpacity={0.9}
            >
               <LinearGradient
                  colors={["#FF8C66", "#FF9D7E"]}
                  style={styles.adminBtn}
               >
                  <Text style={styles.adminBtnText}>
                    Accéder à l’espace administrateur
                  </Text>
               </LinearGradient>
            </TouchableOpacity>
          )}

          {/* QR CODE MODAL */}
          <ShareQRModal
            visible={showQR}
            onClose={() => setShowQR(false)}
            title="Partager mon profil"
            subtitle="Scanne pour voir mon profil"
            qrValue={`app://user/${encodeURIComponent(fullName)}`}
            shareText={`Voici mon profil sur l'app : app://user/${encodeURIComponent(fullName)}`}
            accentColor={colors.accent}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  firstBlockMargin: { marginTop: 10 },
  tighterSpacing: { marginTop: -4 },
  titleRow: { 
      alignItems: "center", 
      justifyContent: "center", 
      marginTop: 10, 
      marginBottom: 10, 
      position: 'relative',
      height: 44
  },
  titleText: { fontSize: 28, fontFamily: FontFamilies.display, fontWeight: '800' },
  primaryBtn: { 
      paddingVertical: 14, 
      paddingHorizontal: 16, 
      borderRadius: 18, 
      alignItems: "center",
      shadowColor: "#008F6B", 
      shadowOpacity: 0.2, 
      shadowOffset: {width: 0, height: 4}, 
      elevation: 4
  },
  primaryBtnText: { fontFamily: FontFamilies.heading, textAlign: "center", color: "#FFF", fontSize: 14 },
  actionRow: { flexDirection: "row", gap: 12 },
  adminBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginTop: 10,
    alignItems: 'center'
  },
  adminBtnText: { color: "#fff", fontFamily: FontFamilies.heading, fontSize: 16 }
});