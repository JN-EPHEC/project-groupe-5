import { ChallengeOfTheDay } from "@/components/ui/acceuil/ChallengeOfTheDay";
import { HeaderProfile } from "@/components/ui/acceuil/HeaderProfile";
import { ProgressionCard } from "@/components/ui/acceuil/ProgressionCard";
import { RankCard } from "@/components/ui/acceuil/RankCard";
import StreakCalendar from "@/components/ui/acceuil/StreakCalendar";
import PremiumCard from "@/components/ui/recompenses/PremiumCard";
import { auth, db } from "@/firebaseConfig";
import { useChallenges } from "@/hooks/challenges-context";
import { useClub } from "@/hooks/club-context";
import { useFriends } from "@/hooks/friends-context";
import { usePoints } from "@/hooks/points-context";
import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { addDoc, collection, onSnapshot } from "firebase/firestore";
import { Image, ScrollView as RNScrollView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function AcceuilScreen() {
  const { colors } = useThemeMode();
  const { totalEarned } = usePoints();
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

  // Classement entre amis basé sur totalEarned
  const friendPoints = [...friends.map(a => a.points), totalEarned];
  const sorted = [...friendPoints].sort((a,b) => b - a);
  const position = sorted.indexOf(totalEarned) + 1;
  const totalFriends = sorted.length;
  const positionLabel = position === 1 ? "1er" : position + "e";

  // Classement Club
  const clubAllPoints = joinedClub ? [...members.map(m => m.points), totalEarned] : [];
  const clubSorted = joinedClub ? [...clubAllPoints].sort((a,b) => b - a) : [];
  const clubPosition = joinedClub ? clubSorted.indexOf(totalEarned) + 1 : 0;
  const clubTotal = joinedClub ? clubSorted.length : 0;
  const clubLabel = clubPosition === 1 ? "1er" : clubPosition + "e";

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 100 }}>
      <Text style={[styles.bigTitle, { color: colors.text }]}>Green{"\n"}Up</Text>
      {/* Section: Profil -> components/ui/acceuil/HeaderProfile */}
      <HeaderProfile />

      {/* Section: Points (simple bloc inline ici; si besoin, on l’extrait plus tard) */}
      <View style={[styles.pointsBox, { backgroundColor: colors.surface }]}>
        <Text style={[styles.pointsNumber, { color: colors.accent }]}>{totalEarned}</Text>
        <Text style={[styles.pointsLabel, { color: colors.mutedText }]}>Points</Text>
      </View>

      {/* Section: Classement -> components/ui/acceuil/RankCard */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Classement</Text>
      <View style={styles.row}>
        <TouchableOpacity activeOpacity={0.85} style={{ width: "48%" }} onPress={() => router.push({ pathname: "/social", params: { tab: "amis" } })}>
          <RankCard value={`${positionLabel} sur ${totalFriends}`} label="Entre amis" />
        </TouchableOpacity>
        {joinedClub ? (
          <TouchableOpacity
            activeOpacity={0.85}
            style={{ width: "48%" }}
            onPress={() => router.push({ pathname: "/social", params: { tab: "clubs", view: "clubRanking" } })}
          >
            <RankCard value={`${clubLabel} sur ${clubTotal}`} label="Club" active />
          </TouchableOpacity>
        ) : (
          <RankCard value="—" label="Club" active style={{ width: "48%" }} />
        )}
      </View>

      {/* Barre "Moi" supprimée à la demande */}
      {/* Avatars des amis (en ligne: cercle vert) - sans l'utilisateur */}
      <RNScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10 }}>
        {friends.map((a: any) => (
          <Image
            key={a.id}
            source={{ uri: a.avatar }}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              marginRight: 8,
              borderWidth: a.online ? 2 : 0,
              borderColor: colors.accent,
            }}
          />
        ))}
      </RNScrollView>

      {/* Série d'activités (streak) */}
      <StreakCalendar />

      {/* Section: Progression -> components/ui/acceuil/ProgressionCard + components/ProgressCircle */}
        <ProgressionCard done={defisFaient} total={defisTotal} pointsText="50 Points gagnés" streakText="2 jours de suite 🔥" />

      {/* PREMIUM sous la progression */}
      <PremiumCard onSubscribe={startSubscription} />

      {/* Section: Défi en cours (seulement si status active) */}
      {current && current.status === 'active' && (
        <ChallengeOfTheDay
          title={current.title}
          description={current.description}
          difficulty={current.difficulty}
          onValidate={() => router.push({ pathname: "/camera", params: { id: String(current.id) } })}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  bigTitle: { fontSize: 34, fontWeight: '700', lineHeight: 36, marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pointsBox: { padding: 14, borderRadius: 14, alignItems: "center", marginBottom: 20 },
  pointsNumber: { fontWeight: "700", fontSize: 24 },
  pointsLabel: { marginTop: 2 },
  sectionTitle: { fontWeight: "600", marginVertical: 10, fontSize: 16 },
  myRow: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, marginTop: 8 },
  myAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#E45353", marginRight: 10 },
  myName: { fontWeight: "600" },
  myPoints: { fontWeight: "700" },
});
