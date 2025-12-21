import { ChallengeOfTheDay } from "@/components/ui/acceuil/ChallengeOfTheDay";
import { ProgressionCard } from "@/components/ui/acceuil/ProgressionCard";
import StreakCalendar from "@/components/ui/acceuil/StreakCalendar";
import NotificationBell from "@/components/ui/common/NotificationBell";
import { Header } from "@/components/ui/profil/Header";
import PremiumCard from "@/components/ui/recompenses/PremiumCard";
import { FontFamilies } from "@/constants/fonts";
import { auth, db } from "@/firebaseConfig";
import { useChallenges } from "@/hooks/challenges-context";
import { useClub } from "@/hooks/club-context";
import { usePoints } from "@/hooks/points-context";
import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context";
import { useClassement } from "@/src/classement/hooks/useClassement";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { addDoc, collection, onSnapshot } from "firebase/firestore";
import { useMemo } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// 🎨 THEME GLOBAL MENTHE GIVRÉE
const THEME = {
    bgGradient: ["#DDF7E8", "#F4FDF9"] as const,
    glassCardBg: ["rgba(240, 253, 244, 0.95)", "rgba(255, 255, 255, 0.85)"] as const,
    textMain: "#0A3F33", 
    textMuted: "#4A665F",
    accentCoral: "#FF8C66",
    rankWatermark: "rgba(0, 143, 107, 0.10)", 
};

export default function AcceuilScreen() {
  const { colors, mode } = useThemeMode();
  const { points } = usePoints();
  const { user } = useUser();
  const router = useRouter();
  const { joinedClub, members } = useClub();
  const { current } = useChallenges();
  const { users: classementUsers, loading: classementLoading } = useClassement();

  // ✅ LOGIQUE RESTAURÉE : ABONNEMENT
  const startSubscription = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("Tu dois être connecté.");
      return;
    }
    try {
      const sessionRef = await addDoc(
        collection(db, "customers", user.uid, "checkout_sessions"),
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
    } catch (e: any) {
      alert(e?.message || "Une erreur est survenue.");
    }
  };

  const defisFaient = 2; // TODO: Connecter aux vraies données
  const defisTotal = 5;  // TODO: Connecter aux vraies données
  const myPoints = typeof points === "number" ? points : user?.points ?? 0;

  // ✅ LOGIQUE RESTAURÉE : CLASSEMENT INDIVIDUEL
  const { position, totalUsers } = useMemo(() => {
    if (classementLoading || !classementUsers || !user) return { position: null, totalUsers: 50 };
    const currentUser = classementUsers.find((u) => u.isCurrentUser);
    return { position: currentUser?.rank ?? null, totalUsers: 50 };
  }, [classementUsers, classementLoading, user]);
  
  const positionLabel = position ? (position === 1 ? "1er" : `${position}e`) : "—";

  // ✅ LOGIQUE RESTAURÉE : CLASSEMENT CLUB (MOCK)
  const { clubPosition, totalClubs } = useMemo(() => {
    if (!joinedClub) return { clubPosition: null, totalClubs: 50 };

    const clubs: Array<{ name: string; pts: number; isMine?: boolean; avatar: string }> = [];
    const totalClubPts = members.reduce((sum, m: any) => sum + (m.points || 0), 0) + myPoints;
    
    clubs.push({
      name: joinedClub.name ?? "Mon club",
      pts: totalClubPts,
      isMine: true,
      avatar: joinedClub.logo || "https://api.dicebear.com/8.x/shapes/svg?seed=myclub",
    });

    const mockClubNames = ["Les Écogardiens", "Verte Équipe", "Planète Propre", "Zéro Déchet Squad", "Les Tri-Héros", "Green Sparks", "Eco Runner", "TerraFriends", "BlueLeaf", "GreenMinds"];
    
    while (clubs.length < 50) {
      const name = mockClubNames[clubs.length % mockClubNames.length] + " " + (Math.floor(Math.random() * 90) + 10);
      const pts = Math.floor(Math.random() * 5000) + 200;
      clubs.push({ name, pts, avatar: `https://api.dicebear.com/8.x/shapes/svg?seed=${encodeURIComponent(name)}` });
    }

    const sortedClubs = clubs.sort((a, b) => b.pts - a.pts);
    const myClubIndex = sortedClubs.findIndex((c) => c.isMine);

    return {
      clubPosition: myClubIndex !== -1 ? myClubIndex + 1 : null,
      totalClubs: sortedClubs.length,
    };
  }, [joinedClub, members, myPoints]);

  const clubLabel = clubPosition ? (clubPosition === 1 ? "1er" : `${clubPosition}e`) : "—";

  // RENDU
  const isLight = mode === "light";
  const hasProgressionCard = typeof ProgressionCard !== "undefined";
  const hasChallengeOfTheDay = typeof ChallengeOfTheDay !== "undefined";
  const hasStreakCalendar = typeof StreakCalendar !== "undefined";
  const hasPremiumCard = typeof PremiumCard !== "undefined";

  const BackgroundComponent = isLight ? LinearGradient : View;
  const bgProps = isLight ? { colors: THEME.bgGradient, style: styles.backgroundFill } : { style: [styles.backgroundFill, { backgroundColor: "#021114" }] };

  return (
    <View style={{ flex: 1 }}>
        <BackgroundComponent {...(bgProps as any)} />
        <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
            {/* HEADER LOGO */}
            <View style={styles.pageHeader}>
                <Image source={isLight ? require("../../assets/images/logo_Green_UP_noir_degradé-removebg-preview.png") : require("../../assets/images/logo_fond_vert_degradé__1_-removebg-preview.png")} style={{ width: 160, height: 50 }} resizeMode="contain" />
                <View style={{ position: 'absolute', right: 8, top: 6 }}><NotificationBell /></View>
            </View>
            
            <Header />

            {/* SECTION CLASSEMENT */}
            <View style={{ marginBottom: 20, marginTop: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
                    <Ionicons name="trophy-outline" size={20} color={isLight ? THEME.textMain : "#fff"} />
                    <Text style={{ fontSize: 20, fontFamily: FontFamilies.heading, color: isLight ? THEME.textMain : "#fff" }}>Classement</Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                    {/* CARTE INDIVIDUEL */}
                    <TouchableOpacity activeOpacity={0.85} style={{ flex: 1 }} onPress={() => router.push({ pathname: "/defi", params: { view: "classement", rankingTab: "perso" } })}>
                    <LinearGradient
                        colors={isLight ? THEME.glassCardBg : ["rgba(0, 151, 178, 0.15)", "rgba(0, 151, 178, 0.05)"]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={[styles.rankCard, isLight ? styles.glassBorder : styles.darkBorder]}
                    >
                        {isLight && (
                            <View style={styles.rankWatermarkBottomRight}>
                                <Ionicons name="person" size={80} color={THEME.rankWatermark} />
                            </View>
                        )}
                        <View style={{ zIndex: 10, flex: 1, justifyContent: 'space-between' }}>
                            <Text style={[styles.rankCardLabel, { color: isLight ? THEME.textMuted : "#9FB9AE" }]}>Individuel</Text>
                            <Text style={[styles.rankCardValue, { color: isLight ? THEME.textMain : "#fff" }]}>
                                {positionLabel} <Text style={{ fontSize: 16, fontWeight: '400' }}>sur {totalUsers}</Text>
                            </Text>
                        </View>
                    </LinearGradient>
                    </TouchableOpacity>

                    {/* CARTE CLUB */}
                    <TouchableOpacity activeOpacity={0.85} style={{ flex: 1 }} disabled={!joinedClub} onPress={() => router.push({ pathname: "/defi", params: { view: "classement", rankingTab: "club" } })}>
                    <LinearGradient
                        colors={isLight ? THEME.glassCardBg : ["rgba(0, 151, 178, 0.15)", "rgba(0, 151, 178, 0.05)"]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={[styles.rankCard, isLight ? styles.glassBorder : styles.darkBorder]}
                    >
                        {isLight && (
                            <View style={styles.rankWatermarkTopRight}>
                                <Ionicons name="people" size={80} color={THEME.rankWatermark} />
                            </View>
                        )}
                        <View style={{ zIndex: 10, flex: 1, justifyContent: 'space-between' }}>
                            <Text style={[styles.rankCardLabel, { color: isLight ? THEME.textMuted : "#9FB9AE" }]}>Club</Text>
                            <Text style={[styles.rankCardValue, { color: isLight ? THEME.textMain : "#fff" }]}>
                                {joinedClub ? <>{clubLabel} <Text style={{ fontSize: 16, fontWeight: '400' }}>sur {totalClubs}</Text></> : "—"}
                            </Text>
                        </View>
                    </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>

            {/* AUTRES BLOCS */}
            <View style={styles.blockSpacing}>{hasStreakCalendar && <StreakCalendar />}</View>
            <View style={styles.blockSpacing}>{hasProgressionCard && <ProgressionCard done={defisFaient} total={defisTotal} pointsText="50 Points gagnés" streakText="2 jours de suite" />}</View>
            <View style={styles.blockSpacing}>{hasPremiumCard && <PremiumCard onSubscribe={startSubscription} />}</View>
            {current && current.status === 'active' && hasChallengeOfTheDay && (
            <View style={styles.blockSpacing}><ChallengeOfTheDay title={current.title} description={current.description} difficulty={current.difficulty} onValidate={() => router.push({ pathname: "/camera", params: { id: String(current.id) } })} /></View>
            )}
        </ScrollView>
        </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  pageHeader: { alignItems: "center", marginTop: 4, marginBottom: 8 },
  rankCard: { height: 125, borderRadius: 24, padding: 20, justifyContent: 'space-between', overflow: 'hidden', position: 'relative' },
  glassBorder: { borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.6)", shadowColor: "#005c4b", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  darkBorder: { borderWidth: 1, borderColor: 'rgba(0, 151, 178, 0.3)' },
  rankCardLabel: { fontSize: 15, fontFamily: FontFamilies.headingMedium },
  rankCardValue: { fontSize: 28, fontFamily: FontFamilies.heading, letterSpacing: -0.5 },
  blockSpacing: { marginBottom: 12 },
  rankWatermarkBottomRight: { position: 'absolute', bottom: -10, right: -10, transform: [{ rotate: '-10deg' }] },
  rankWatermarkTopRight: { position: 'absolute', top: -15, right: -15, transform: [{ rotate: '15deg' }] }
});