import { useNotifications } from "@/hooks/notifications-context";
import { useThemeMode } from "@/hooks/theme-context"; // ✅ Import du hook thème
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export const NotificationBell = () => {
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const { mode } = useThemeMode();
  const isLight = mode === "light";

  // --- COULEURS DYNAMIQUES ---
  // Light : Fond Blanc / Icone Vert Foncé
  // Dark  : Fond Bleu Glacé / Icone Bleu
  const containerBg = isLight ? "#FFF" : "rgba(0, 151, 178, 0.15)";
  const containerBorder = isLight ? "transparent" : "rgba(0, 151, 178, 0.3)";
  const iconColor = isLight ? "#0A3F33" : "#0097B2"; // "met la en bleu"

  // Light : Orange
  // Dark  : Vert clair fluo
  const badgeBg = isLight ? "#FF8C66" : "#00D68F"; 
  const badgeBorder = isLight ? "#FFF" : "#021114"; // Bordure adaptée au fond

  return (
    <TouchableOpacity 
        onPress={() => router.push("/notifications" as any)} 
        style={[
            styles.container, 
            { 
                backgroundColor: containerBg,
                borderColor: containerBorder,
                borderWidth: isLight ? 0 : 1
            }
        ]}
    >
      <Ionicons name="notifications-outline" size={26} color={iconColor} />
      
      {unreadCount > 0 && (
        <View style={[styles.badge, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
          <Text style={styles.badgeText}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 40, height: 40,
    justifyContent: "center", alignItems: "center",
    borderRadius: 20,
    // Ombres uniquement en mode light pour le relief sur fond blanc
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  badge: {
    position: "absolute", top: -2, right: -2,
    minWidth: 18, height: 18, borderRadius: 9,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1.5,
  },
  badgeText: {
    color: "#FFF", fontSize: 10, fontWeight: "bold", paddingHorizontal: 2,
  },
});