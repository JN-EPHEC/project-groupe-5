import { FontFamilies } from "@/constants/fonts";
import { useNotificationsSettings } from "@/hooks/notifications-context";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
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

  const gradientColors = isLight
    ? ([colors.glass, colors.glass] as const)
    : (["rgba(0, 151, 178, 0.2)", "rgba(0, 151, 178, 0.05)"] as const);
  const cardBackground = isLight ? colors.glass : "rgba(0, 151, 178, 0.1)";
  const titleColor = isLight ? colors.cardText : colors.text;
  const mutedColor = isLight ? colors.cardMuted : colors.mutedText;
  const dividerColor = isLight ? colors.glassBorder : "rgba(0, 151, 178, 0.2)";

  return (
    <View
      style={[styles.gradientWrapper, { shadowColor: colors.accent }]}
    >
      <View
        style={[styles.container, { backgroundColor: cardBackground, borderColor: dividerColor, borderWidth: 1 }]}
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
            style={[styles.subMenu, { backgroundColor: isLight ? colors.cardAlt : colors.cardAlt }]}
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
            trackColor={{ false: isLight ? "rgba(255,255,255,0.25)" : "#3f3f46", true: colors.accent }}
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
              { backgroundColor: isLight ? colors.cardAlt : colors.cardAlt },
            ]}
          >
            <TouchableOpacity style={styles.subRow} activeOpacity={0.8} onPress={() => router.push("/change-password")}>
              <View style={styles.subRowLeft}>
                <Ionicons name="lock-closed-outline" size={20} color={mutedColor} style={{ marginRight: 10 }} />
                <Text style={[styles.subText, { color: titleColor }]}>Modifier le mot de passe</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={mutedColor} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.subRow} activeOpacity={0.8} onPress={() => router.push("/conditions-generales")}>
              <View style={styles.subRowLeft}>
                <Ionicons name="document-text-outline" size={20} color={mutedColor} style={{ marginRight: 10 }} />
                <Text style={[styles.subText, { color: titleColor }]}>Conditions Générales</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={mutedColor} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.subRow} activeOpacity={0.8} onPress={() => router.push("/mentions-legales")}>
              <View style={styles.subRowLeft}>
                <Ionicons name="information-circle-outline" size={20} color={mutedColor} style={{ marginRight: 10 }} />
                <Text style={[styles.subText, { color: titleColor }]}>Mentions Légales</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={mutedColor} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.subRow} activeOpacity={0.8} onPress={() => router.push("/politique-de-confidentialite")}>
              <View style={styles.subRowLeft}>
                <Ionicons name="shield-checkmark-outline" size={20} color={mutedColor} style={{ marginRight: 10 }} />
                <Text style={[styles.subText, { color: titleColor }]}>Politique de confidentialité</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={mutedColor} />
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
    </View>
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
  subMenu: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  subRowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  langOption: { paddingVertical: 6 },
  langText: { fontSize: 14, fontFamily: FontFamilies.bodyRegular },
  subText: { fontSize: 14, fontFamily: FontFamilies.body },
  logoutRow: { borderBottomWidth: 0 },
});
