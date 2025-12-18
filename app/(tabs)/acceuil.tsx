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
import { useFriends } from "@/hooks/friends-context";
import { usePoints } from "@/hooks/points-context";
import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { addDoc, collection, onSnapshot } from "firebase/firestore";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AcceuilScreen() {
  const { colors, mode } = useThemeMode();
  const { points } = usePoints();
  const { user } = useUser();
  const router = useRouter();
  const { joinedClub, members } = useClub();
  const { current } = useChallenges();
  const { friends } = useFriends();
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
        if (data.error) {
          alert(data.error.message);
        }
        if (data.url) {
          Linking.openURL(data.url);
        }
      });
    } catch (e: any) {
      alert(e?.message || "Une erreur est survenue.");
    }
  };

  const defisFaient = 2; // TODO: derive from real data
  const defisTotal = 5;  // TODO: derive from real data

  const myPoints = typeof points === "number" ? points : user?.points ?? 0;

  // Classement entre amis basé sur les points actuels
  const friendPoints = [...friends.map((friend) => friend.points || 0), myPoints];
  const sorted = [...friendPoints].sort((a, b) => b - a);
  const positionIndex = sorted.findIndex((value) => value === myPoints);
  const position = positionIndex >= 0 ? positionIndex + 1 : sorted.length;
  const totalFriends = sorted.length;
  const positionLabel = position === 1 ? "1er" : `${position}e`;

  // Classement Club
  const clubAllPoints = joinedClub ? [...members.map((member) => member.points || 0), myPoints] : [];
  const clubSorted = joinedClub ? [...clubAllPoints].sort((a, b) => b - a) : [];
  const clubPositionIndex = joinedClub ? clubSorted.findIndex((value) => value === myPoints) : -1;
  const clubPosition = clubPositionIndex >= 0 ? clubPositionIndex + 1 : clubSorted.length;
  const clubTotal = joinedClub ? clubSorted.length : 0;
  const clubLabel = clubPosition === 1 ? "1er" : `${clubPosition}e`;

  const isLight = mode === "light";
  // Defensive checks to prevent "Element type is invalid" runtime errors
  const hasProgressionCard = typeof ProgressionCard !== "undefined";
  const hasChallengeOfTheDay = typeof ChallengeOfTheDay !== "undefined";
  const hasStreakCalendar = typeof StreakCalendar !== "undefined";
  const hasPremiumCard = typeof PremiumCard !== "undefined";

  if (!hasProgressionCard) console.warn("Missing ProgressionCard import (undefined)");
  if (!hasChallengeOfTheDay) console.warn("Missing ChallengeOfTheDay import (undefined)");
  if (!hasStreakCalendar) console.warn("Missing StreakCalendar import (undefined)");
  if (!hasPremiumCard) console.warn("Missing PremiumCard import (undefined)");
  
  // Liquid Ice Theme (Dark Mode)
  const darkBg = "#021114";
  const darkCardGradient = ["rgba(0, 151, 178, 0.2)", "rgba(0, 151, 178, 0.05)"] as const;
  const darkCardBorder = "rgba(0, 151, 178, 0.3)";
  const darkMiniCardBg = "rgba(0, 151, 178, 0.1)";
  const darkMiniCardBorder = "rgba(0, 151, 178, 0.2)";

  const rankingGradient = isLight
    ? ([colors.card, colors.card] as const)
    : darkCardGradient;
  const rankingBorder = isLight ? "transparent" : darkCardBorder;
  const miniCardBg = isLight ? colors.cardAlt : darkMiniCardBg;
  const miniCardBorder = isLight ? "transparent" : darkMiniCardBorder;
  const miniCardLabel = isLight ? colors.cardMuted : colors.mutedText;
  const miniCardValue = isLight ? colors.cardText : colors.text;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: isLight ? colors.background : darkBg }]}
      edges={["top", "left", "right", "bottom"]}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: isLight ? colors.background : darkBg }]}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View style={styles.pageHeader}>
          <Image
            source={
              isLight
                ? require("../../assets/images/logo_Green_UP_noir_degradé-removebg-preview.png")
                : require("../../assets/images/logo_fond_vert_degradé__1_-removebg-preview.png")
            }
            style={{ width: 160, height: 50 }}
            resizeMode="contain"
          />
          <View style={{ position: 'absolute', right: 8, top: 6 }}>
            <NotificationBell />
          </View>
        </View>
        
        <Header />

        {/* Section: Classement Cards */}
        <View style={{ marginBottom: 20, marginTop: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 }}>
            <Ionicons name="trophy-outline" size={20} color={isLight ? colors.text : "#fff"} />
            <Text style={{ fontSize: 20, fontFamily: FontFamilies.heading, color: isLight ? colors.text : "#fff" }}>
              Classement
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            {/* Card Individuel */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.rankCard,
                { 
                  backgroundColor: isLight ? colors.card : "rgba(0, 151, 178, 0.15)",
                  borderWidth: 1,
                  borderColor: isLight ? '#007AFF' : 'rgba(0, 151, 178, 0.3)'
                }
              ]}
              onPress={() => router.push({ pathname: "/social", params: { tab: "amis" } })}
            >
              <Text style={[styles.rankCardLabel, { color: isLight ? colors.mutedText : "#9FB9AE" }]}>Individuel</Text>
              <Text style={[styles.rankCardValue, { color: isLight ? colors.text : "#fff" }]}>
                {positionLabel} <Text style={{ fontSize: 16, fontWeight: '400' }}>sur {totalFriends}</Text>
              </Text>
              <View style={{ alignItems: 'flex-end', marginTop: 'auto' }}>
                <Ionicons name="person" size={24} color={isLight ? colors.mutedText : "rgba(255,255,255,0.5)"} />
              </View>
            </TouchableOpacity>

            {/* Card Club */}
            <TouchableOpacity
              activeOpacity={joinedClub ? 0.85 : 1}
              style={[
                styles.rankCard,
                { 
                  backgroundColor: isLight ? colors.card : "rgba(0, 151, 178, 0.15)",
                  borderWidth: 1,
                  borderColor: isLight ? '#007AFF' : 'rgba(0, 151, 178, 0.3)'
                }
              ]}
              disabled={!joinedClub}
              onPress={() => router.push({ pathname: "/social", params: { tab: "clubs", view: "clubRanking" } })}
            >
              <Text style={[styles.rankCardLabel, { color: isLight ? colors.mutedText : "#9FB9AE" }]}>Club</Text>
              <Text style={[styles.rankCardValue, { color: isLight ? colors.text : "#fff" }]}>
                {joinedClub ? (
                  <>
                    {clubLabel} <Text style={{ fontSize: 16, fontWeight: '400' }}>sur {clubTotal}</Text>
                  </>
                ) : (
                  "—"
                )}
              </Text>
              <View style={{ alignItems: 'flex-end', marginTop: 'auto' }}>
                <Ionicons name="people" size={24} color={isLight ? colors.mutedText : "rgba(255,255,255,0.5)"} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Série d'activités (streak) */}
        <View style={styles.blockSpacing}>
          {hasStreakCalendar ? (
            <StreakCalendar />
          ) : (
            <Text style={{ color: isLight ? colors.text : "#fff" }}>Calendar indisponible</Text>
          )}
        </View>

        {/* Section: Progression -> components/ui/acceuil/ProgressionCard + components/ProgressCircle */}
        <View style={styles.blockSpacing}>
          {hasProgressionCard ? (
            <ProgressionCard
              done={defisFaient}
              total={defisTotal}
              pointsText="50 Points gagnés"
              streakText="2 jours de suite"
            />
          ) : (
            <Text style={{ color: isLight ? colors.text : "#fff" }}>Progression indisponible</Text>
          )}
        </View>

        {/* PREMIUM sous la progression */}
        <View style={styles.blockSpacing}>
          {hasPremiumCard ? (
            <PremiumCard onSubscribe={startSubscription} />
          ) : (
            <Text style={{ color: isLight ? colors.text : "#fff" }}>Premium indisponible</Text>
          )}
        </View>

        {/* Section: Défi en cours (seulement si status active) */}
        {current && current.status === 'active' && (
          <View style={styles.blockSpacing}>
            {hasChallengeOfTheDay ? (
              <ChallengeOfTheDay
                title={current.title}
                description={current.description}
                difficulty={current.difficulty}
                onValidate={() => router.push({ pathname: "/camera", params: { id: String(current.id) } })}
              />
            ) : (
              <Text style={{ color: isLight ? colors.text : "#fff" }}>Défi indisponible</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  pageHeader: { alignItems: "center", marginTop: 8, marginBottom: 20, position: 'relative' },
  screenTitle: {
    fontSize: 34,
    lineHeight: 38,
    fontFamily: FontFamilies.heading,
  },
  rankCard: {
    flex: 1,
    height: 110,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
  },
  rankCardLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  rankCardValue: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
  },
  blockSpacing: { marginBottom: 17 },
});
