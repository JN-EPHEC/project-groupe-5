import { ChallengeHistoryList } from "@/components/ui/profil/ChallengeHistoryList";
import { Header } from "@/components/ui/profil/Header";
import { SettingsSection } from "@/components/ui/profil/SettingsSection";
import { StatCard } from "@/components/ui/profil/StatCard";
import { ShareQRModal } from "@/components/ui/qr/ShareQRModal";
import PremiumCard from "@/components/ui/recompenses/PremiumCard";
import { auth, db } from "@/firebaseConfig";
import { useClub } from "@/hooks/club-context";
import { useFriends } from "@/hooks/friends-context";
import { usePoints } from "@/hooks/points-context";
import { useSubscriptions } from "@/hooks/subscriptions-context";
import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { addDoc, collection, onSnapshot } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ProfilScreen() {
  const { colors } = useThemeMode();
  const { points } = usePoints();
  const { user } = useUser();
  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  const { joinedClub, members } = useClub();
  const [showQR, setShowQR] = useState(false);
  const { friends } = useFriends();
  const { followers, following } = useSubscriptions();
  const router = useRouter();
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
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

  // Live friend requests section
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    return onSnapshot(collection(db, 'users', uid, 'friendRequests'), (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setFriendRequests(arr);
    });
  }, []);

  const myPoints = useMemo(() => (typeof points === "number" ? points : user?.points ?? 0), [points, user?.points]);

  // Classement entre amis
  const friendRankLabel = useMemo(() => {
    const source = [...friends.map((friend) => friend.points || 0), myPoints];
    const sorted = source.sort((a, b) => b - a);
    const position = sorted.findIndex((value) => value === myPoints) + 1;
    return `#${position || 1}`;
  }, [friends, myPoints]);

  // Classement club (si club)
  const clubRankLabel = useMemo(() => {
    if (!joinedClub) return null;
    const arr = [...members.map((member) => member.points || 0), myPoints].sort((a, b) => b - a);
    const pos = arr.findIndex((value) => value === myPoints) + 1;
    return `#${pos || 1}`;
  }, [joinedClub, members, myPoints]);

  const pendingCount = friendRequests.filter(r => r.status === 'pending').length;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 140 }}>
      <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text, marginTop: 16 }}>Profil</Text>
      {/* EN-TÊTE PROFIL -> components/ui/profil/Header */}
      <Header />

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: colors.surfaceAlt, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14 }}
          onPress={() => router.push("/edit-profile")}
        >
          <Text style={{ color: colors.text, fontWeight: '700', textAlign: 'center' }}>Modifier mon profil</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: colors.surfaceAlt, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14 }}
          onPress={() => setShowQR(true)}
        >
          <Text style={{ color: colors.text, fontWeight: '700', textAlign: 'center' }}>Partager mon profil </Text>
        </TouchableOpacity>
      </View>

  {/* STATS -> components/ui/profil/StatCard */}
      <View style={styles.row}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.8} onPress={() => router.push('/social?tab=amis')}>
          <StatCard icon="people-outline" value={String(friends.length)} label="Amis" />
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.8} onPress={() => router.push('/social?tab=amis')}>
          <StatCard icon="person-add-outline" value={String(pendingCount)} label="Demandes d'amis" />
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.8} onPress={() => router.push("/amis-plus")}> 
          <StatCard icon="person-add" label="Amis +" accent />
        </TouchableOpacity>
      </View>

  {/* Suppression de la carte Série actuelle */}

  {/* CLASSEMENTS -> components/ui/profil/StatCard */}
      <View style={styles.row}>
        <StatCard icon="person-outline" label="Classement entre amis" value={friendRankLabel} />
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.8} onPress={() => router.push('/social?tab=clubs&view=clubRanking')}>
            <StatCard icon="people" label="Classement club" value={clubRankLabel ?? '—'} />
          </TouchableOpacity>
      </View>

      {/* HISTORIQUE DES DEFIS (placé juste après les points) */}
      <ChallengeHistoryList />

      {/* PREMIUM: juste au-dessus de la bannière Don */}
      <PremiumCard onSubscribe={startSubscription} />

      {/* BANNIÈRE DON supprimée */}

      
      {/* DEMANDES D'AMIS supprimé */}

      {/* PARAMÈTRES -> components/ui/profil/SettingsSection (+ SettingSwitch) */}
      <SettingsSection />

      {/* ADMIN PANEL (visible uniquement pour les admins) */}
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
          <Text style={{ color: "#fff", textAlign: "center", fontWeight: "600" }}>
            🔧 Accéder à l’espace administrateur
          </Text>
        </TouchableOpacity>
      )}


      <ShareQRModal
        visible={showQR}
        onClose={() => setShowQR(false)}
        title={"Partager mon profil"}
        subtitle={"Scanne pour voir mon profil"}
        qrValue={`app://user/${encodeURIComponent(fullName)}`}
        shareText={`Voici mon profil sur l'app : app://user/${encodeURIComponent(fullName)}`}
        accentColor={colors.accent}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  row: { flexDirection: "row", justifyContent: "space-between", marginVertical: 10 },
});
