import NotificationBell from "@/components/ui/common/NotificationBell";
import { ChallengeHistoryList } from "@/components/ui/profil/ChallengeHistoryList";
import { Header } from "@/components/ui/profil/Header";
import { SettingsSection } from "@/components/ui/profil/SettingsSection";
import { StatCard } from "@/components/ui/profil/StatCard";
import { ShareQRModal } from "@/components/ui/qr/ShareQRModal";
import PremiumCard from "@/components/ui/recompenses/PremiumCard";
import { FontFamilies } from "@/constants/fonts";
import { auth, db } from "@/firebaseConfig";
import { useFriends } from "@/hooks/friends-context";
import { usePoints } from "@/hooks/points-context";
import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context";
import { useClassement } from "@/src/classement/hooks/useClassement";
import { LinearGradient } from "expo-linear-gradient"; // ✅ AJOUT
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { addDoc, collection, onSnapshot } from "firebase/firestore";
import { useMemo, useState } from "react";
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
  const { points } = usePoints();
  const { user } = useUser();
  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  const { friends } = useFriends();
  const [showQR, setShowQR] = useState(false);
  const router = useRouter();

  const { users: classementUsers, loading: classementLoading } = useClassement();

  const { challengeRank } = useMemo(() => {
    if (classementLoading || !classementUsers || !user) {
      return { challengeRank: null };
    }
    const currentUserData = classementUsers.find((u) => u.uid === user.uid);
    return {
      challengeRank: currentUserData?.rank,
    };
  }, [classementUsers, classementLoading, user]);

  const individualRankLabel = useMemo(() => {
    if (challengeRank === null || challengeRank === undefined) return "—";
    return `#${challengeRank}`;
  }, [challengeRank]);

  const myPoints = useMemo(() => (typeof points === "number" ? points : user?.points ?? 0), [points, user?.points]);

  const friendRankLabel = useMemo(() => {
    const totals = [...friends.map((friend) => friend.points || 0), myPoints].sort((a, b) => b - a);
    const pos = totals.findIndex((value) => value === myPoints) + 1;
    return `#${pos || 1}`;
  }, [friends, myPoints]);


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

        if (data.error) {
          alert(data.error.message);
        }

        if (data.url) {
          Linking.openURL(data.url);
        }
      });
    } catch (error: any) {
      alert(error?.message || "Une erreur est survenue.");
    }
  };

  const sectionSpacing = { marginBottom: 17 } as const;

  // Vérifications existantes
  const hasHeader = typeof Header !== "undefined";
  const hasStatCard = typeof StatCard !== "undefined";
  const hasChallengeHistory = typeof ChallengeHistoryList !== "undefined";
  const hasSettingsSection = typeof SettingsSection !== "undefined";
  const hasShareQR = typeof ShareQRModal !== "undefined";
  const hasPremiumCard = typeof PremiumCard !== "undefined";

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
          style={[styles.container]}
          contentContainerStyle={{ paddingBottom: 160 }}
          showsVerticalScrollIndicator={false}
        >
          {/* TITLE & NOTIF */}
          <View style={styles.titleRow}>
            <Text style={[styles.titleText, { color: isLight ? profileTheme.textMain : colors.text }]}>Profil</Text>
            <View style={{ position: 'absolute', right: 0, top: 4 }}>
              <NotificationBell />
            </View>
          </View>

          {/* HEADER (Avatar + Nom) */}
          {hasHeader ? <Header /> : <Text style={{ color: isLight ? colors.text : "#fff" }}>Profil indisponible</Text>}

          {/* ACTIONS RAPIDES (Modifier / Partager) */}
          <View style={[sectionSpacing, styles.firstBlockMargin]}>
            <View style={styles.actionRow}>
              {/* Bouton Modifier */}
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

              {/* Bouton Partager */}
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

          {/* STAT CARDS (Navigation vers classements) */}
          <View style={sectionSpacing}>
            <View style={styles.row}>
              <TouchableOpacity
                style={{ flex: 1, marginRight: 10 }}
                activeOpacity={0.8}
                onPress={() => {
                  router.push({
                    pathname: "/(tabs)/defi",
                    params: { 
                      view: "classement", 
                      rankingTab: "perso", 
                      t: Date.now()
                    }
                  });
                }}
              >
                <StatCard icon="trophy-outline" label="Classement individuel" value={individualRankLabel} />
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={0.8}
                onPress={() => {
                  router.push({
                    pathname: "/(tabs)/social",
                    params: { 
                      tab: "amis", 
                      reset: "true",
                      t: Date.now() 
                    }
                  });
                }}
              >
                <StatCard icon="person-outline" label="Classement entre amis" value={friendRankLabel} />
              </TouchableOpacity>
            </View>
          </View>

          {/* PREMIUM */}
          <View style={sectionSpacing}>
            {hasPremiumCard ? <PremiumCard onSubscribe={startSubscription} /> : <Text style={{ color: isLight ? colors.text : "#fff" }}>Premium indisponible</Text>}
          </View>

          {/* HISTORIQUE */}
          <View style={sectionSpacing}>
            {hasChallengeHistory ? <ChallengeHistoryList /> : <Text style={{ color: isLight ? colors.text : "#fff" }}>Historique indisponible</Text>}
          </View>

          {/* SETTINGS */}
          <View style={[sectionSpacing, styles.tighterSpacing]}>
            {hasSettingsSection ? <SettingsSection /> : <Text style={{ color: isLight ? colors.text : "#fff" }}>Paramètres indisponibles</Text>}
          </View>

          {/* ADMIN ACCESS */}
          {user?.isAdmin && (
            <TouchableOpacity
              onPress={() => router.push("../(admin)")}
              activeOpacity={0.9}
            >
               <LinearGradient
                  colors={["#FF8C66", "#FF9D7E"]}
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderRadius: 16,
                    marginTop: 10,
                    alignItems: 'center'
                  }}
               >
                  <Text style={{ color: "#fff", fontFamily: FontFamilies.heading, fontSize: 16 }}>
                    Accéder à l’espace administrateur
                  </Text>
               </LinearGradient>
            </TouchableOpacity>
          )}

          {/* QR CODE MODAL */}
          {hasShareQR ? (
            <ShareQRModal
              visible={showQR}
              onClose={() => setShowQR(false)}
              title="Partager mon profil"
              subtitle="Scanne pour voir mon profil"
              qrValue={`app://user/${encodeURIComponent(fullName)}`}
              shareText={`Voici mon profil sur l'app : app://user/${encodeURIComponent(fullName)}`}
              accentColor={colors.accent}
            />
          ) : showQR ? (
            <Text style={{ color: isLight ? colors.text : "#fff", textAlign: "center", marginTop: 12 }}>QR indisponible</Text>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  row: { flexDirection: "row", justifyContent: "space-between" },
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
});