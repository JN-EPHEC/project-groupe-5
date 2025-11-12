import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

export default function ProfilScreen() {
  const { mode, toggle, colors } = useThemeMode();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [language, setLanguage] = useState("Français");

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 60 }}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="walk-outline" size={60} color="#fff" />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>10</Text>
          </View>
        </View>
        <Text style={[styles.name, { color: colors.text }]}>Bonjour Marie</Text>
        <Text style={[styles.club, { color: colors.mutedText }]}>Éco-Warriors</Text>
      </View>

      {/* STATS */}
      <View style={styles.statsRow}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Ionicons name="people-outline" size={24} color={colors.accent} />
          <Text style={[styles.cardNumber, { color: colors.text }]}>182</Text>
          <Text style={[styles.cardLabel, { color: colors.mutedText }]}>Abonnés</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Ionicons name="person-add-outline" size={24} color={colors.accent} />
          <Text style={[styles.cardNumber, { color: colors.text }]}>96</Text>
          <Text style={[styles.cardLabel, { color: colors.mutedText }]}>Abonnements</Text>
        </View>

        <View style={[styles.card, styles.greenCard, { backgroundColor: colors.accent }]}>
          <Ionicons name="person-add" size={24} color={colors.surface} />
          <Text style={[styles.cardLabelLight, { color: colors.surface }]}>Amis +</Text>
        </View>
      </View>

      {/* POINTS */}
      <View style={[styles.largeCard, { backgroundColor: colors.surface }]}>
        <Ionicons name="leaf-outline" size={24} color={colors.accent} />
        <Text style={[styles.cardLabel, { color: colors.mutedText }]}>Points totaux</Text>
        <Text style={[styles.points, { color: colors.text }]}>115 pts</Text>
      </View>

      {/* SERIE */}
      <View style={[styles.largeCard, { backgroundColor: colors.surface }]}>
        <Ionicons name="flame-outline" size={24} color={colors.accent} />
        <Text style={[styles.cardLabel, { color: colors.mutedText }]}>Série actuelle</Text>
        <Text style={[styles.points, { color: colors.text }]}>2 jours</Text>
      </View>

      {/* CLASSEMENT */}
      <View style={styles.statsRow}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Ionicons name="person-outline" size={24} color="#3B82F6" />
          <Text style={[styles.cardLabel, { color: colors.mutedText }]}>Classement individuel</Text>
          <Text style={[styles.points, { color: colors.text }]}>#2</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Ionicons name="people" size={24} color={colors.accent} />
          <Text style={[styles.cardLabel, { color: colors.mutedText }]}>Classement club</Text>
          <Text style={[styles.points, { color: colors.text }]}>#1</Text>
        </View>
      </View>

      {/* PARAMÈTRES */}
  <View style={[styles.settingsCard, { backgroundColor: colors.surface }]}>

        {/* Notifications */}
        <TouchableOpacity style={styles.settingsRow} onPress={() => setShowNotifications(!showNotifications)}>
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          <Text style={[styles.settingsText, { color: colors.text }]}>Notifications</Text>
          <Ionicons name={showNotifications ? "chevron-down" : "chevron-forward"} size={18} color={colors.mutedText} />
        </TouchableOpacity>

        {showNotifications && (
          <View style={styles.subMenu}>
            <SettingSwitch label="Notifications Push" value={pushEnabled} onValueChange={setPushEnabled} />
            <SettingSwitch label="Emails" value={emailEnabled} onValueChange={setEmailEnabled} />
            <SettingSwitch label="Sons" value={soundEnabled} onValueChange={setSoundEnabled} />
          </View>
        )}

        {/* Thème */}
        <View style={styles.settingsRow}>
          <Ionicons name="moon-outline" size={22} color={colors.text} />
          <Text style={[styles.settingsText, { color: colors.text }]}>Thème sombre</Text>
          <Switch value={mode === "dark"} onValueChange={toggle} thumbColor="#19D07D" />
        </View>

        {/* Langue */}
        <TouchableOpacity style={styles.settingsRow} onPress={() => setShowLanguage(!showLanguage)}>
          <Ionicons name="language-outline" size={22} color={colors.text} />
          <Text style={[styles.settingsText, { color: colors.text }]}>Langue</Text>
          <Ionicons name={showLanguage ? "chevron-down" : "chevron-forward"} size={18} color={colors.mutedText} />
        </TouchableOpacity>

        {showLanguage && (
          <View style={styles.subMenu}>
            <TouchableOpacity onPress={() => setLanguage("Français")} style={styles.languageOption}>
              <Text style={[styles.languageText, { color: colors.mutedText }, language === "Français" && { color: colors.accent, fontWeight: "700" }]}>Français</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setLanguage("Anglais")} style={styles.languageOption}>
              <Text style={[styles.languageText, { color: colors.mutedText }, language === "Anglais" && { color: colors.accent, fontWeight: "700" }]}>Anglais</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Paramètres généraux */}
        <TouchableOpacity style={styles.settingsRow} onPress={() => setShowSettings(!showSettings)}>
          <Ionicons name="settings-outline" size={22} color="#fff" />
          <Text style={styles.settingsText}>Paramètres</Text>
          <Ionicons name={showSettings ? "chevron-down" : "chevron-forward"} size={18} color="#888" />
        </TouchableOpacity>

        {showSettings && (
          <View style={styles.subMenu}>
            <Text style={styles.subMenuItem}>Modifier le mot de passe</Text>
            <Text style={styles.subMenuItem}>Gestion des données</Text>
            <Text style={styles.subMenuItem}>À propos</Text>
          </View>
        )}

        <TouchableOpacity style={[styles.settingsRow, { borderTopWidth: 0.5, borderColor: "#24403A" }]}>
          <Ionicons name="exit-outline" size={22} color="#F26767" />
          <Text style={[styles.settingsText, { color: "#F26767" }]}>Se déconnecter</Text>
        </TouchableOpacity>

      </View>

    </ScrollView>
  );
}

type SettingSwitchProps = {
  label: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
};
function SettingSwitch({ label, value, onValueChange }: SettingSwitchProps) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.switchText}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} thumbColor="#19D07D" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B141A", paddingHorizontal: 20 },
  header: { alignItems: "center", marginTop: 40, marginBottom: 20 },
  avatarContainer: { backgroundColor: "#EF4444", borderRadius: 60, padding: 25, position: "relative" },
  badge: { position: "absolute", bottom: 5, right: 0, backgroundColor: "#10B981", borderRadius: 15, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: "#fff", fontWeight: "bold" },
  name: { color: "#fff", fontSize: 22, fontWeight: "bold", marginTop: 10 },
  club: { color: "#A1A1AA" },
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 10 },
  card: { flex: 1, backgroundColor: "#1E293B", margin: 5, borderRadius: 15, alignItems: "center", paddingVertical: 15 },
  greenCard: { backgroundColor: "#10B981" },
  cardNumber: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  cardLabel: { color: "#A1A1AA", fontSize: 12 },
  cardLabelLight: { color: "#fff", fontWeight: "bold", marginTop: 5 },
  largeCard: { backgroundColor: "#1E293B", borderRadius: 15, padding: 20, marginVertical: 8, alignItems: "center" },
  points: { color: "#fff", fontSize: 18, fontWeight: "bold", marginTop: 5 },

  settingsCard: { marginTop: 20, backgroundColor: "#1E293B", borderRadius: 15, paddingBottom: 10 },
  settingsRow: { flexDirection: "row", alignItems: "center", padding: 15 },
  settingsText: { color: "#fff", marginLeft: 10, flex: 1 },
  
  subMenu: { paddingLeft: 48, paddingTop: 5, paddingBottom: 10 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  switchText: { color: "#A1A1AA", fontSize: 14 },

  languageOption: { paddingVertical: 6 },
  languageText: { color: "#A1A1AA", fontSize: 14 },
  languageActive: { color: "#19D07D", fontWeight: "700" },

  subMenuItem: { color: "#A1A1AA", marginVertical: 6, fontSize: 14 },
});
