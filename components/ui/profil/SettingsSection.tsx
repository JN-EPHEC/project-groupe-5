import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import React, { useState } from "react";
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { auth } from "../../../firebaseConfig";
import { SettingSwitch } from "./SettingSwitch";

export const SettingsSection = () => {
  const { colors, mode, toggle } = useThemeMode();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [language, setLanguage] = useState("Français");

  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(false);
  const [sound, setSound] = useState(true);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {
      Alert.alert("Error", "Could not log out. Please try again.");
    }
  };


  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Notifications */}
      <TouchableOpacity style={styles.row} onPress={() => setShowNotifications(!showNotifications)}>
        <Ionicons name="notifications-outline" size={22} color={colors.text} />
        <Text style={[styles.text, { color: colors.text }]}>Notifications</Text>
        <Ionicons
          name={showNotifications ? "chevron-down" : "chevron-forward"}
          size={18}
          color={colors.mutedText}
        />
      </TouchableOpacity>

      {showNotifications && (
        <View style={styles.subMenu}>
          <SettingSwitch label="Notifications Push" value={push} onValueChange={setPush} />
          <SettingSwitch label="Emails" value={email} onValueChange={setEmail} />
          <SettingSwitch label="Sons" value={sound} onValueChange={setSound} />
        </View>
      )}

      {/* Theme */}
      <View style={styles.row}>
        <Ionicons name="moon-outline" size={22} color={colors.text} />
        <Text style={[styles.text, { color: colors.text }]}>Thème sombre</Text>
        <Switch value={mode === "dark"} onValueChange={toggle} thumbColor="#19D07D" />
      </View>


      {/* Settings */}
      <TouchableOpacity style={styles.row} onPress={() => setShowSettings(!showSettings)}>
        <Ionicons name="settings-outline" size={22} color={colors.text} />
        <Text style={[styles.text, { color: colors.text }]}>Paramètres</Text>
        <Ionicons
          name={showSettings ? "chevron-down" : "chevron-forward"}
          size={18}
          color={colors.mutedText}
        />
      </TouchableOpacity>

      {showSettings && (
        <View style={styles.subMenu}>
          <Text style={[styles.subText, { color: colors.mutedText }]}>Modifier le mot de passe</Text>
          <Text style={[styles.subText, { color: colors.mutedText }]}>Gestion des données</Text>
          <Text style={[styles.subText, { color: colors.mutedText }]}>À propos</Text>
        </View>
      )}

      {/* Logout */}
      <TouchableOpacity
        style={[styles.row, { borderTopWidth: 0.5, borderColor: "#24403A" }]}
        onPress={handleLogout}
      >
        <Ionicons name="exit-outline" size={22} color="#F26767" />
        <Text style={[styles.text, { color: "#F26767" }]}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 20, borderRadius: 15, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", padding: 15 },
  text: { marginLeft: 10, flex: 1 },
  subMenu: { paddingLeft: 48, paddingBottom: 10 },
  langOption: { paddingVertical: 6 },
  langText: { fontSize: 14 },
  subText: { marginVertical: 6, fontSize: 14 },
});
