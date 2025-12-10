import { FontFamilies } from "@/constants/fonts";
import { useNotificationsSettings } from "@/hooks/notifications-context";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import React, { useState } from "react";
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { auth } from "../../../firebaseConfig";
import { SettingSwitch } from "./SettingSwitch";

export const SettingsSection = () => {
  const { colors, mode, toggle } = useThemeMode();
  const isLight = mode === "light";
  const { enabled: pushEnabled, setEnabled: setPushEnabled, loading: notificationsLoading } = useNotificationsSettings();
  const router = useRouter();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [email, setEmail] = useState(false);
  const [sound, setSound] = useState(true);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {
      Alert.alert("Error", "Could not log out. Please try again.");
    }
  };

  const gradientColors = isLight ? [colors.cardAlt, colors.card] : [colors.surfaceAlt, colors.surface];
  const cardBackground = isLight ? colors.card : colors.surface;
  const titleColor = isLight ? colors.cardText : colors.text;
  const mutedColor = isLight ? colors.cardMuted : colors.mutedText;
  const dividerColor = isLight ? "rgba(255,255,255,0.12)" : colors.surfaceAlt;

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradientWrapper, { shadowColor: colors.accent }]}
    >
      <View
        style={[styles.container, { backgroundColor: cardBackground, borderColor: dividerColor }]}
      >
        {/* Notifications */}
        <TouchableOpacity style={[styles.row, { borderColor: dividerColor }]} onPress={() => setShowNotifications(!showNotifications)} activeOpacity={0.85}>
          <Ionicons name="notifications-outline" size={22} color={titleColor} />
          <Text style={[styles.text, { color: titleColor }]}>Notifications</Text>
          <Ionicons
            name={showNotifications ? "chevron-down" : "chevron-forward"}
            size={18}
            color={mutedColor}
          />
        </TouchableOpacity>

        {showNotifications && (
          <View
            style={[styles.subMenu, { backgroundColor: isLight ? colors.cardAlt : "rgba(15, 51, 39, 0.1)" }]}
          >
            <SettingSwitch
              label="Notifications Push"
              value={pushEnabled}
              onValueChange={async (next) => {
                await setPushEnabled(next);
              }}
              disabled={notificationsLoading}
            />
            <SettingSwitch label="Emails" value={email} onValueChange={setEmail} />
            <SettingSwitch label="Sons" value={sound} onValueChange={setSound} />
          </View>
        )}

        {/* Theme */}
        <View style={[styles.row, { borderColor: dividerColor }]}>
          <Ionicons name="moon-outline" size={22} color={titleColor} />
          <Text style={[styles.text, { color: titleColor }]}>Thème sombre</Text>
          <Switch
            value={mode === "dark"}
            onValueChange={toggle}
            thumbColor={mode === "dark" ? "#f5f5f5" : "#f3f4f6"}
            trackColor={{ false: isLight ? "rgba(255,255,255,0.25)" : "#3f3f46", true: isLight ? colors.accent : "#1f8f5a" }}
          />
        </View>


        {/* Settings */}
        <TouchableOpacity style={[styles.row, { borderColor: dividerColor }]} onPress={() => setShowSettings(!showSettings)} activeOpacity={0.85}>
          <Ionicons name="settings-outline" size={22} color={titleColor} />
          <Text style={[styles.text, { color: titleColor }]}>Paramètres</Text>
          <Ionicons
            name={showSettings ? "chevron-down" : "chevron-forward"}
            size={18}
            color={mutedColor}
          />
        </TouchableOpacity>

        {showSettings && (
          <View
            style={[
              styles.subMenu,
              { backgroundColor: isLight ? colors.cardAlt : "rgba(15, 51, 39, 0.1)" },
            ]}
          >
            <TouchableOpacity activeOpacity={0.8} onPress={() => router.push("/change-password")}>
              <Text style={[styles.subText, { color: mutedColor }]}>Modifier le mot de passe</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} onPress={() => router.push("/conditions-generales")}>
              <Text style={[styles.subText, { color: mutedColor }]}>Conditions Générales d’Utilisation</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} onPress={() => router.push("/mentions-legales")}>
              <Text style={[styles.subText, { color: mutedColor }]}>Mentions Légales</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} onPress={() => router.push("/politique-de-confidentialite")}>
              <Text style={[styles.subText, { color: mutedColor }]}>Politique de confidentialité</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Logout */}
        <TouchableOpacity
          style={[styles.row, styles.logoutRow]}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <Ionicons name="exit-outline" size={22} color="#F26767" />
          <Text style={[styles.text, { color: "#F26767" }]}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientWrapper: {
    marginTop: 12,
    borderRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  container: {
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    paddingBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: "transparent",
  },
  text: { marginLeft: 10, flex: 1, fontFamily: FontFamilies.headingMedium, fontSize: 16 },
  subMenu: { paddingLeft: 48, paddingVertical: 12, gap: 6 },
  langOption: { paddingVertical: 6 },
  langText: { fontSize: 14, fontFamily: FontFamilies.bodyRegular },
  subText: { fontSize: 14, fontFamily: FontFamilies.body },
  logoutRow: { borderBottomWidth: 0 },
});
