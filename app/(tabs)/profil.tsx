import { Header } from "@/components/ui/profil/Header";
import { LargeCard } from "@/components/ui/profil/LargeCard";
import { SettingsSection } from "@/components/ui/profil/SettingsSection";
import { StatCard } from "@/components/ui/profil/StatCard";
import { amisData } from "@/components/ui/social/data";
import { useClub } from "@/hooks/club-context";
import { usePoints } from "@/hooks/points-context";
import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

export default function ProfilScreen() {
  const { colors } = useThemeMode();
  const { points } = usePoints();
  const { user } = useUser();
  const { joinedClub, members } = useClub();

  // Classement entre amis
  const friendRankLabel = useMemo(() => {
    const all = [...amisData.map(a => a.points), points].sort((a,b) => b - a);
    const position = all.indexOf(points) + 1;
    return `#${position}`;
  }, [points]);

  // Classement club (si club)
  const clubRankLabel = useMemo(() => {
    if (!joinedClub) return null;
    const arr = [...members.map(m => m.points), points].sort((a,b) => b - a);
    const pos = arr.indexOf(points) + 1;
    return `#${pos}`;
  }, [joinedClub, members, points]);

  const friendsCount = amisData.length;

  return (
  <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 140 }}>
      {/* EN-TÊTE PROFIL -> components/ui/profil/Header */}
      <Header />

  {/* STATS -> components/ui/profil/StatCard */}
      <View style={styles.row}>
        <StatCard icon="people-outline" value={String(friendsCount)} label="Abonnés" />
        <StatCard icon="person-add-outline" value={String(friendsCount)} label="Abonnements" />
        <StatCard icon="person-add" label="Amis +" accent />
      </View>

  {/* GRANDES CARTES -> components/ui/profil/LargeCard */}
  <LargeCard icon="leaf-outline" label="Points totaux" value={points + " pts"} />
  <LargeCard icon="flame-outline" label="Série actuelle" value="2 jours" />

  {/* CLASSEMENTS -> components/ui/profil/StatCard */}
      <View style={styles.row}>
        <StatCard icon="person-outline" label="Classement entre amis" value={friendRankLabel} />
        {clubRankLabel && <StatCard icon="people" label="Classement club" value={clubRankLabel} />}
      </View>

      {/* PARAMÈTRES -> components/ui/profil/SettingsSection (+ SettingSwitch) */}
      <SettingsSection />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  row: { flexDirection: "row", justifyContent: "space-between", marginVertical: 10 },
});
