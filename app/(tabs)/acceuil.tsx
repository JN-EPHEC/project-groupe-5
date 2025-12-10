import { ChallengeOfTheDay } from "@/components/ui/acceuil/ChallengeOfTheDay";
import { HeaderProfile } from "@/components/ui/acceuil/HeaderProfile";
import { ProgressionCard } from "@/components/ui/acceuil/ProgressionCard";
import StreakCalendar from "@/components/ui/acceuil/StreakCalendar";
import PremiumCard from "@/components/ui/recompenses/PremiumCard";
import { FontFamilies } from "@/constants/fonts";
import { auth, db } from "@/firebaseConfig";
import { useChallenges } from "@/hooks/challenges-context";
import { useClub } from "@/hooks/club-context";
import { useFriends } from "@/hooks/friends-context";
import { usePoints } from "@/hooks/points-context";
import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { addDoc, collection, onSnapshot } from "firebase/firestore";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
          price: "price_1SZwHCCh6MpiIMZkbiSw63ty",
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
  const rankingGradient = isLight ? [colors.cardAlt, colors.card] : [colors.surfaceAlt, colors.surface];
  const rankingBorder = isLight ? "rgba(255,255,255,0.12)" : colors.surfaceAlt;
  const miniCardBg = isLight ? colors.cardAlt : "#123C2F";
  const miniCardBorder = isLight ? "rgba(255,255,255,0.12)" : "#0E2B21";
  const miniCardLabel = isLight ? colors.cardMuted : colors.mutedText;
  const miniCardValue = isLight ? colors.cardText : colors.text;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "left", "right", "bottom"]}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View style={styles.pageHeader}>
          <Text style={[styles.screenTitle, { color: colors.text }]}>Green Up</Text>
        </View>
        {/* Section: Profil -> components/ui/acceuil/HeaderProfile */}
        <HeaderProfile clubName={joinedClub?.name} />

        {/* Section: Classement + Points regroupés */}
        <LinearGradient
          colors={rankingGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.rankingWrapper, { borderColor: rankingBorder, shadowColor: isLight ? colors.card : "#000000" }]}
        >
          <Text style={[styles.sectionTitle, { color: miniCardValue, marginBottom: 14 }]}>Classement</Text>
          <View style={styles.rankingRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.miniCard, { backgroundColor: miniCardBg, borderColor: miniCardBorder }]}
              onPress={() => router.push({ pathname: "/social", params: { tab: "amis" } })}
            >
              <Text style={[styles.miniLabel, { color: miniCardLabel }]}>Entre amis</Text>
              <Text style={[styles.miniValue, { color: miniCardValue }]}>{`${positionLabel} / ${totalFriends}`}</Text>
            </TouchableOpacity>

            <View
              style={[styles.miniCard, { backgroundColor: miniCardBg, borderColor: miniCardBorder }]}
            >
              <Text style={[styles.miniLabel, { color: miniCardLabel }]}>Points</Text>
              <Text style={[styles.miniValue, { color: miniCardValue }]}>{myPoints}</Text>
            </View>

            <TouchableOpacity
              activeOpacity={joinedClub ? 0.85 : 1}
              style={[styles.miniCard, { backgroundColor: miniCardBg, borderColor: miniCardBorder }]}
              disabled={!joinedClub}
              onPress={() => router.push({ pathname: "/social", params: { tab: "clubs", view: "clubRanking" } })}
            >
              <Text style={[styles.miniLabel, { color: miniCardLabel }]}>Club</Text>
              <Text style={[styles.miniValue, { color: miniCardValue }]}
              >
                {joinedClub ? `${clubLabel} / ${clubTotal}` : "—"}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Série d'activités (streak) */}
        <View style={styles.blockSpacing}>
          <StreakCalendar />
        </View>

        {/* Section: Progression -> components/ui/acceuil/ProgressionCard + components/ProgressCircle */}
        <View style={styles.blockSpacing}>
          <ProgressionCard
            done={defisFaient}
            total={defisTotal}
            pointsText="50 Points gagnés"
            streakText="2 jours de suite"
          />
        </View>

        {/* PREMIUM sous la progression */}
        <View style={styles.blockSpacing}>
          <PremiumCard onSubscribe={startSubscription} />
        </View>

        {/* Section: Défi en cours (seulement si status active) */}
        {current && current.status === 'active' && (
          <View style={styles.blockSpacing}>
            <ChallengeOfTheDay
              title={current.title}
              description={current.description}
              difficulty={current.difficulty}
              onValidate={() => router.push({ pathname: "/camera", params: { id: String(current.id) } })}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  pageHeader: { alignItems: "center", marginTop: 8, marginBottom: 20 },
  screenTitle: {
    fontSize: 34,
    lineHeight: 38,
    fontFamily: FontFamilies.heading,
  },
  rankingWrapper: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 18,
    marginBottom: 17,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  rankingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
    flexWrap: "wrap",
  },
  miniCard: {
    flexGrow: 1,
    flexBasis: "30%",
    minWidth: 100,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    marginHorizontal: 4,
  },
  miniLabel: { fontSize: 13, fontFamily: FontFamilies.headingMedium },
  miniValue: { fontSize: 18, fontFamily: FontFamilies.heading },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
    fontFamily: FontFamilies.heading,
  },
  blockSpacing: { marginBottom: 17 },
});
