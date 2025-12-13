import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context"; // <--- IMPORT CRUCIAL

// Constantes
const BG_DARK = "#0B1412";

function CircleIcon({ name, color, focused, light }: any) {
  const scale = useSharedValue(focused ? 1 : 0.9);
  const opacity = useSharedValue(focused ? 1 : 0.6);

  useEffect(() => {
    scale.value = withTiming(focused ? 1 : 0.9, { duration: 220 });
    opacity.value = withTiming(focused ? 1 : 0.6, { duration: 220 });
  }, [focused, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    // pointerEvents="none" est l'astuce magique : 
    // ça empêche l'icône de bloquer le clic destiné au bouton en dessous.
    <View pointerEvents="none"> 
      <Animated.View
        style={[
          {
            width: 46,
            height: 46,
            borderRadius: 23,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: focused
              ? light
                ? "#FFFFFF"
                : "#E3F9F1"
              : "transparent",
            borderWidth: focused && light ? 2 : 0,
            borderColor: light ? "#19D07D" : "transparent",
          },
          animatedStyle,
        ]}
      >
        <Ionicons
          name={name}
          size={24}
          color={focused ? (light ? "#0F3327" : "#0F3327") : color}
        />
      </Animated.View>
    </View>
  );
}

export default function TabLayout() {
  const { colors, mode } = useThemeMode();
  const { user, loading } = useUser();
  const insets = useSafeAreaInsets(); // <--- Récupère les marges de l'iPhone 15

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          position: "absolute",
          // CALCUL DYNAMIQUE : On ajoute 10px au-dessus de la barre système (insets.bottom)
          bottom: Platform.OS === "ios" ? insets.bottom + 10 : 20,
          left: 20,
          right: 20,
          height: 70, // Hauteur fixe
          paddingBottom: 0, // Important sur iOS pour centrer verticalement
          backgroundColor: mode === "dark" ? "rgba(20,26,24,0.95)" : "#E6E9E8",
          borderRadius: 35,
          borderTopWidth: 0,
          borderWidth: mode === "light" ? 2 : 0,
          borderColor: mode === "light" ? "#0F3327" : "transparent",
          elevation: 10,
          shadowColor: "#000",
          shadowOpacity: 0.3,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 5 },
          zIndex: 9999, // Force la barre au-dessus de tout le reste
        },
        tabBarItemStyle: {
          // Force les boutons à prendre toute la hauteur pour être faciles à cliquer
          height: 70, 
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          marginBottom: 10,
          fontWeight: "600",
        },
        tabBarActiveTintColor: mode === "dark" ? "#E6FFF5" : "#0F3327",
        tabBarInactiveTintColor: mode === "dark" ? "#8AA39C" : "#0F3327AA",
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />

      <Tabs.Screen
        name="acceuil"
        options={{
          title: "Accueil",
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
          title: "Cadeaux",
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