import DonationBanner from "@/components/ui/profil/DonationBanner";
import { Header } from "@/components/ui/profil/Header";
import { LargeCard } from "@/components/ui/profil/LargeCard";
import { SettingsSection } from "@/components/ui/profil/SettingsSection";
import { StatCard } from "@/components/ui/profil/StatCard";
import { ShareQRModal } from "@/components/ui/qr/ShareQRModal";
import { useClub } from "@/hooks/club-context";
import { useFriends } from "@/hooks/friends-context";
import { usePoints } from "@/hooks/points-context";
import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ProfilScreen() {
  const { colors } = useThemeMode();
  const { points } = usePoints();
  const { user } = useUser();
  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  const { joinedClub, members } = useClub();
  const [showQR, setShowQR] = useState(false);
  const { friends } = useFriends();
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

  const friendsCount = friends.length;

  return (
  <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 140 }}>
      {/* EN-TÊTE PROFIL -> components/ui/profil/Header */}
      <Header />

      <TouchableOpacity
        style={{ backgroundColor: colors.surfaceAlt, alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14, marginBottom: 12 }}
        onPress={() => setShowQR(true)}
      >
        <Text style={{ color: colors.text, fontWeight: '600' }}>📱 Partager mon profil (QR)</Text>
      </TouchableOpacity>

  {/* STATS -> components/ui/profil/StatCard */}
      <View style={styles.row}>
        <StatCard icon="people-outline" value={String(friendsCount)} label="Abonnés" />
        <StatCard icon="person-add-outline" value={String(friendsCount)} label="Abonnements" />
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.8} onPress={() => router.push("/amis-plus")}> 
          <StatCard icon="person-add" label="Amis +" accent />
        </TouchableOpacity>
      </View>

  {/* GRANDES CARTES -> components/ui/profil/LargeCard */}
  <LargeCard icon="leaf-outline" label="Points totaux" value={points + " pts"} />
  <LargeCard icon="flame-outline" label="Série actuelle" value="2 jours" />

  {/* CLASSEMENTS -> components/ui/profil/StatCard */}
      <View style={styles.row}>
        <StatCard icon="person-outline" label="Classement entre amis" value={friendRankLabel} />
        {clubRankLabel && <StatCard icon="people" label="Classement club" value={clubRankLabel} />}
      </View>

      {/* BANNIÈRE DON */}
      <DonationBanner />

      {/* PARAMÈTRES -> components/ui/profil/SettingsSection (+ SettingSwitch) */}
      <SettingsSection />

      {/* ADMIN PANEL (visible uniquement pour les admins) */}
      {user.isAdmin && (
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
