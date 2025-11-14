import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useRef } from "react";
import { Animated } from "react-native";

// Couleurs constantes
const BG_DARK = "#0B1412";
const TAB_BG = "rgba(20,26,24,0.92)"; // gris très sombre translucide
const TAB_ACTIVE_GRADIENT = ["#90F7D5", "#38D793", "#23C37A"]; // utilisé via style simple

function CircleIcon({ name, color, focused, light }: { name: any; color: string; focused: boolean; light?: boolean }) {
  const scale = useRef(new Animated.Value(focused ? 1 : 0.9)).current;
  const opacity = useRef(new Animated.Value(focused ? 1 : 0.6)).current;

  Animated.timing(scale, {
    toValue: focused ? 1 : 0.9,
    duration: 220,
    useNativeDriver: true,
  }).start();
  Animated.timing(opacity, {
    toValue: focused ? 1 : 0.6,
    duration: 220,
    useNativeDriver: true,
  }).start();

  return (
    <Animated.View
      style={{
        width: 46,
        height: 46,
        borderRadius: 23,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: focused
          ? light
            ? "#FFFFFF" // cercle blanc en mode clair actif
            : "#E3F9F1"
          : "transparent",
        borderWidth: focused && light ? 2 : 0,
        borderColor: light ? "#19D07D" : "transparent",
        transform: [{ scale }],
        opacity,
      }}
    >
      <Ionicons name={name} size={24} color={focused ? (light ? "#0F3327" : "#0F3327") : color} />
    </Animated.View>
  );
}

export default function TabLayout() {
  const { colors, mode } = useThemeMode();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          position: "absolute",
          bottom: 16,
          left: 16,
          right: 16,
          height: 74,
          paddingHorizontal: 6,
          backgroundColor: mode === "dark" ? "rgba(20,26,24,0.92)" : "#E6E9E8",
          borderRadius: 28,
          borderTopWidth: 0,
          borderWidth: mode === "light" ? 2 : 0,
          borderColor: mode === "light" ? "#0F3327" : "transparent",
          elevation: 8,
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
        },
        tabBarItemStyle: {
          marginTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 4,
          fontWeight: "500",
        },
        tabBarActiveTintColor: mode === "dark" ? "#E6FFF5" : "#0F3327",
        tabBarInactiveTintColor: mode === "dark" ? "#8AA39C" : "#0F3327AA",
      }}
    >
      <Tabs.Screen
        name="acceuil"
        options={{
          title: "Acceuil",
          tabBarIcon: ({ color, focused }) => (
            <CircleIcon name="home-outline" color={color} focused={focused} light={mode === "light"} />
          ),
        }}
      />
      <Tabs.Screen
        name="defi"
        options={{
          title: "Défis",
          tabBarIcon: ({ color, focused }) => (
            <CircleIcon name="trophy-outline" color={color} focused={focused} light={mode === "light"} />
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: "Social",
          tabBarIcon: ({ color, focused }) => (
            <CircleIcon name="people-outline" color={color} focused={focused} light={mode === "light"} />
          ),
        }}
      />
      <Tabs.Screen
        name="recompenses"
        options={{
          title: "Récompenses",
          tabBarIcon: ({ color, focused }) => (
            <CircleIcon name="gift-outline" color={color} focused={focused} light={mode === "light"} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, focused }) => (
            <CircleIcon name="person-circle-outline" color={color} focused={focused} light={mode === "light"} />
          ),
        }}
      />
    </Tabs>
  );
}
