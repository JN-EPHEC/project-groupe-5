import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const AdminNav = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useThemeMode();
  const insets = useSafeAreaInsets();
  const isDark = theme === "dark";

  const tabs = [
    { label: "Accueil", icon: "home-outline", route: "/(admin)" },
    // FUSIONNÉ ICI : "Défis" pointe vers la page unique
    { label: "Défis", icon: "trophy-outline", route: "/(admin)/defis" }, 
    { label: "Coupons", icon: "ticket-outline", route: "/(admin)/coupons" }, 
    { label: "Avis", icon: "star-outline", route: "/(admin)/feedback" },
    { label: "Alertes", icon: "alert-circle-outline", route: "/(admin)/reports" },
  ];

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: isDark ? "#1F2937" : "#FFFFFF", 
        paddingBottom: insets.bottom > 0 ? insets.bottom : 20,
        borderTopColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"
      }
    ]}>
      {tabs.map((tab, index) => {
        // Détection de l'onglet actif
        // Si on est sur "/(admin)" tout court, c'est l'accueil
        // Sinon on vérifie si le pathname commence par la route (pour les sous-pages éventuelles)
        const isActive = tab.route === "/(admin)" 
            ? pathname === "/(admin)" || pathname === "/(admin)/"
            : pathname.startsWith(tab.route);

        const activeColor = "#008F6B";
        const inactiveColor = isDark ? "#9CA3AF" : "#6B7280";

        return (
          <TouchableOpacity
            key={index}
            onPress={() => router.push(tab.route as any)}
            style={styles.tab}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, isActive && { backgroundColor: isDark ? "rgba(0,143,107,0.2)" : "#E0F7EF" }]}>
              <Ionicons 
                name={tab.icon as any} 
                size={24} 
                color={isActive ? activeColor : inactiveColor} 
              />
            </View>
            <Text style={[styles.label, { color: isActive ? activeColor : inactiveColor }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 12,
    borderTopWidth: 1,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  iconContainer: {
    padding: 6,
    borderRadius: 12,
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
  },
});