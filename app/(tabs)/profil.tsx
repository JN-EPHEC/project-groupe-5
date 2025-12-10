import { ChallengeHistoryList } from "@/components/ui/profil/ChallengeHistoryList";
import { Header } from "@/components/ui/profil/Header";
import { SettingsSection } from "@/components/ui/profil/SettingsSection";
import { StatCard } from "@/components/ui/profil/StatCard";
import { ShareQRModal } from "@/components/ui/qr/ShareQRModal";
import PremiumCard from "@/components/ui/recompenses/PremiumCard";
import { FontFamilies } from "@/constants/fonts";
import { auth, db } from "@/firebaseConfig";
import { useClub } from "@/hooks/club-context";
import { useFriends } from "@/hooks/friends-context";
import { usePoints } from "@/hooks/points-context";
import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { addDoc, collection, onSnapshot } from "firebase/firestore";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ProfilScreen() {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";
  const { points } = usePoints();
  const { user } = useUser();
  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  const { joinedClub, members } = useClub();
  const { friends } = useFriends();
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
    } catch (error: any) {
      alert(error?.message || "Une erreur est survenue.");
    }
  };

  const myPoints = useMemo(() => (typeof points === "number" ? points : user?.points ?? 0), [points, user?.points]);

  const friendRankLabel = useMemo(() => {
    const totals = [...friends.map((friend) => friend.points || 0), myPoints].sort((a, b) => b - a);
    const pos = totals.findIndex((value) => value === myPoints) + 1;
    return `#${pos || 1}`;
  }, [friends, myPoints]);

  const clubRankLabel = useMemo(() => {
    if (!joinedClub) return null;
    const clubTotals = [...members.map((member) => member.points || 0), myPoints].sort((a, b) => b - a);
    const position = clubTotals.findIndex((value) => value === myPoints) + 1;
    return `#${position || 1}`;
  }, [joinedClub, members, myPoints]);

  const neonGradient = isLight ? [colors.cardAlt, colors.card] : [colors.surfaceAlt, colors.surface];
  const primaryButtonText = isLight ? colors.cardText : colors.text;
  const sectionSpacing = { marginBottom: 17 } as const;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 160 }}
    >
      <View style={styles.titleRow}>
        <Text style={[styles.titleText, { color: colors.text }]}>Profil</Text>
      </View>

      <Header />

      <View style={[sectionSpacing, styles.firstBlockMargin]}>
        <View style={styles.actionRow}>
          <LinearGradient
            colors={neonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1, borderRadius: 18 }}
          >
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.push("/edit-profile")}
              activeOpacity={0.85}
            >
              <Text style={[styles.primaryBtnText, { color: primaryButtonText }]}>Modifier mon profil</Text>
            </TouchableOpacity>
          </LinearGradient>

          <LinearGradient
            colors={neonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1, borderRadius: 18 }}
          >
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => setShowQR(true)}
              activeOpacity={0.85}
            >
              <Text style={[styles.primaryBtnText, { color: primaryButtonText }]}>Partager mon profil</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>

      <View style={sectionSpacing}>
        <View style={styles.row}>
          <StatCard icon="person-outline" label="Classement entre amis" value={friendRankLabel} />
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={0.8}
            onPress={() => router.push("/social?tab=clubs&view=clubRanking")}
          >
            <StatCard icon="people" label="Classement club" value={clubRankLabel ?? "—"} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={sectionSpacing}>
        <PremiumCard onSubscribe={startSubscription} />
      </View>

      <View style={sectionSpacing}>
        <ChallengeHistoryList />
      </View>

      <View style={[sectionSpacing, styles.tighterSpacing]}>
        <SettingsSection />
      </View>

      {user?.isAdmin && (
        <TouchableOpacity
          onPress={() => router.push("../(admin)")}
          style={{
            backgroundColor: colors.accent,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 14,
            marginTop: 20,
          }}
        >
          <Text style={{ color: "#fff", textAlign: "center", fontFamily: FontFamilies.heading }}>
            Accéder à l’espace administrateur
          </Text>
        </TouchableOpacity>
      )}

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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  firstBlockMargin: { marginTop: 10 },
  tighterSpacing: { marginTop: -4 },
  titleRow: { alignItems: "center", justifyContent: "center", marginTop: 18, marginBottom: 16 },
  titleText: { fontSize: 30, fontFamily: FontFamilies.display },
  primaryBtn: { flex: 1, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 18, alignItems: "center" },
  primaryBtnText: { fontFamily: FontFamilies.heading, textAlign: "center" },
  actionRow: { flexDirection: "row", columnGap: 10 },
});
