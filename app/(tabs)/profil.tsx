import { Header } from "@/components/ui/profil/Header";
import { LargeCard } from "@/components/ui/profil/LargeCard";
import { SettingsSection } from "@/components/ui/profil/SettingsSection";
import { StatCard } from "@/components/ui/profil/StatCard";
import { ShareQRModal } from "@/components/ui/qr/ShareQRModal";
import { amisData } from "@/components/ui/social/data";
import { useClub } from "@/hooks/club-context";
import { usePoints } from "@/hooks/points-context";
import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import React, { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../firebaseConfig";

export default function ProfilScreen() {
  const { colors } = useThemeMode();
  const { points } = usePoints();
  const { user } = useUser();
  const { joinedClub, members } = useClub();
  const [showQR, setShowQR] = useState(false);

  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);          // 🔐 déconnexion Firebase
      // On peut laisser RootLayout gérer la redirection via onAuthStateChanged,
      // mais on force aussi la navigation par sécurité :
  router.replace("/login" as any);
    } catch (error: any) {
      console.log(error);
      Alert.alert(
        "Erreur",
        error?.message || "Impossible de se déconnecter pour le moment."
      );
    }
  };

  // Classement entre amis
  const friendRankLabel = useMemo(() => {
    const all = [...amisData.map((a) => a.points), points].sort(
      (a, b) => b - a
    );
    const position = all.indexOf(points) + 1;
    return `#${position}`;
  }, [points]);

  // Classement club (si club)
  const clubRankLabel = useMemo(() => {
    if (!joinedClub) return null;
    const arr = [...members.map((m) => m.points), points].sort(
      (a, b) => b - a
    );
    const pos = arr.indexOf(points) + 1;
    return `#${pos}`;
  }, [joinedClub, members, points]);

  const friendsCount = amisData.length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 140 }}
    >
      {/* EN-TÊTE PROFIL */}
      <Header />

      {/* Bouton QR */}
      <TouchableOpacity
        style={{
          backgroundColor: colors.surfaceAlt,
          alignSelf: "center",
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: 14,
          marginBottom: 12,
        }}
        onPress={() => setShowQR(true)}
      >
        <Text style={{ color: colors.text, fontWeight: "600" }}>
          📱 Partager mon profil (QR)
        </Text>
      </TouchableOpacity>

      {/* STATS AMIS */}
      <View style={styles.row}>
        <StatCard
          icon="people-outline"
          value={String(friendsCount)}
          label="Abonnés"
        />
        <StatCard
          icon="person-add-outline"
          value={String(friendsCount)}
          label="Abonnements"
        />
        <StatCard icon="person-add" label="Amis +" accent />
      </View>

      {/* GRANDES CARTES */}
      <LargeCard icon="leaf-outline" label="Points totaux" value={points + " pts"} />
      <LargeCard icon="flame-outline" label="Série actuelle" value="2 jours" />

      {/* CLASSEMENTS */}
      <View style={styles.row}>
        <StatCard
          icon="person-outline"
          label="Classement entre amis"
          value={friendRankLabel}
        />
        {clubRankLabel && (
          <StatCard
            icon="people"
            label="Classement club"
            value={clubRankLabel}
          />
        )}
      </View>

      {/* PARAMÈTRES */}
      <SettingsSection />

      {/* BOUTON DECONNEXION */}
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: colors.surfaceAlt }]}
        onPress={handleLogout}
      >
        <Text style={[styles.logoutText, { color: colors.accent }]}>
          Se déconnecter
        </Text>
      </TouchableOpacity>

      {/* MODAL QR */}
      <ShareQRModal
        visible={showQR}
        onClose={() => setShowQR(false)}
        title={"Partager mon profil"}
        subtitle={"Scanne pour voir mon profil"}
        qrValue={`app://user/${encodeURIComponent(user?.name ?? "inconnu")}`}
        shareText={`Voici mon profil sur l'app : app://user/${encodeURIComponent(
          user?.name ?? "inconnu"
        )}`}
        accentColor={colors.accent}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  logoutButton: {
    marginTop: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  logoutText: {
    fontWeight: "700",
    fontSize: 16,
  },
});