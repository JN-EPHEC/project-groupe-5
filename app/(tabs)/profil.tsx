import { Header } from "@/components/ui/profil/Header";
import { LargeCard } from "@/components/ui/profil/LargeCard";
import { SettingsSection } from "@/components/ui/profil/SettingsSection";
import { StatCard } from "@/components/ui/profil/StatCard";
import { useThemeMode } from "@/hooks/theme-context";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

export default function ProfilScreen() {
  const { colors } = useThemeMode();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 80 }}>
      <Header />

      {/* Stats */}
      <View style={styles.row}>
        <StatCard icon="people-outline" value="182" label="Abonnés" />
        <StatCard icon="person-add-outline" value="96" label="Abonnements" />
        <StatCard icon="person-add" label="Amis +" accent />
      </View>

      <LargeCard icon="leaf-outline" label="Points totaux" value="115 pts" />
      <LargeCard icon="flame-outline" label="Série actuelle" value="2 jours" />

      {/* Classements */}
      <View style={styles.row}>
        <StatCard icon="person-outline" label="Classement individuel" value="#2" />
        <StatCard icon="people" label="Classement club" value="#1" />
      </View>

      {/* Paramètres */}
      <SettingsSection />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  row: { flexDirection: "row", justifyContent: "space-between", marginVertical: 10 },
});
