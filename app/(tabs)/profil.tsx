import { ChallengeHistoryList } from "@/components/ui/profil/ChallengeHistoryList";
import DonationBanner from "@/components/ui/profil/DonationBanner";
import { Header } from "@/components/ui/profil/Header";
import { SettingsSection } from "@/components/ui/profil/SettingsSection";
import { StatCard } from "@/components/ui/profil/StatCard";
import { ShareQRModal } from "@/components/ui/qr/ShareQRModal";
import { useClub } from "@/hooks/club-context";
import { useFriends } from "@/hooks/friends-context";
import { usePoints } from "@/hooks/points-context";
import { useSubscriptions } from "@/hooks/subscriptions-context";
import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ProfilScreen() {
  const { colors } = useThemeMode();
  const { points, totalEarned, totalSpent, transactions } = usePoints();
  const { user } = useUser();
  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  const { joinedClub, members } = useClub();
  const [showQR, setShowQR] = useState(false);
  const { friends } = useFriends();
  const { followers, following } = useSubscriptions();
  const router = useRouter();

  // Classement entre amis
  const friendRankLabel = useMemo(() => {
    const all = [...friends.map(a => a.points), points].sort((a,b) => b - a);
    const position = all.indexOf(points) + 1;
    return `#${position}`;
  }, [friends, points]);

  // Classement club (si club)
  const clubRankLabel = useMemo(() => {
    if (!joinedClub) return null;
    const arr = [...members.map(m => m.points), points].sort((a,b) => b - a);
    const pos = arr.indexOf(points) + 1;
    return `#${pos}`;
  }, [joinedClub, members, points]);

  const followersCount = followers.length;
  const followingCount = following.length;

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
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.8} onPress={() => router.push('/abonnements')}>
          <StatCard icon="people-outline" value={String(followersCount)} label="Abonnés" />
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.8} onPress={() => router.push('/abonnements')}>
          <StatCard icon="person-add-outline" value={String(followingCount)} label="Abonnements" />
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.8} onPress={() => router.push("/amis-plus")}> 
          <StatCard icon="person-add" label="Amis +" accent />
        </TouchableOpacity>
      </View>

  {/* Suppression de la carte Série actuelle */}

  {/* CLASSEMENTS -> components/ui/profil/StatCard */}
      <View style={styles.row}>
        <StatCard icon="person-outline" label="Classement entre amis" value={friendRankLabel} />
        <StatCard icon="people" label="Classement club" value={clubRankLabel ?? '—'} />
      </View>

      {/* HISTORIQUE DE POINTS (carte unique, seulement 2 dernières) */}
      <View style={{ backgroundColor: colors.surface, padding: 16, borderRadius: 16, marginVertical: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>Historique des points</Text>
          <Text style={{ color: colors.mutedText, fontWeight: '600' }}>{totalEarned} pts</Text>
        </View>
        {transactions.length === 0 ? (
          <Text style={{ color: colors.mutedText }}>Aucune transaction pour le moment.</Text>
        ) : (
          (transactions.slice(0, 2)).map((tx) => (
            <View key={tx.id} style={{ backgroundColor: colors.surfaceAlt, padding: 12, borderRadius: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '600' }}>{tx.source}</Text>
                <Text style={{ color: colors.mutedText, fontSize: 12 }}>{new Date(tx.timestamp).toLocaleString()}</Text>
              </View>
              <Text style={{ color: tx.type === 'earn' ? '#2ECC71' : '#E74C3C', fontWeight: '700' }}>
                {tx.type === 'earn' ? `+${tx.amount}` : `-${tx.amount}`} pts
              </Text>
            </View>
          ))
        )}
        <TouchableOpacity onPress={() => router.push('/profil-historique')} style={{ marginTop: 6, alignSelf: 'flex-end' }}>
          <Text style={{ color: colors.accent, fontWeight: '600' }}>Voir tout l'historique</Text>
        </TouchableOpacity>
      </View>

      {/* HISTORIQUE DES DEFIS (placé juste après les points) */}
      <ChallengeHistoryList />

      {/* BANNIÈRE DON */}
      <DonationBanner />

      

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
