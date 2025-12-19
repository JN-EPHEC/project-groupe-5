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
import { useSafeAreaInsets } from "react-native-safe-area-context";

function CircleIcon({ name, color, focused, light }: any) {
  const scale = useSharedValue(focused ? 1 : 0.9);
  const opacity = useSharedValue(focused ? 1 : 0.6);

  useEffect(() => {
    scale.value = withTiming(focused ? 1 : 0.9, { duration: 220 });
    opacity.value = withTiming(focused ? 1 : 0.6, { duration: 220 });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View pointerEvents="none" style={{ alignItems: 'center', justifyContent: 'center', marginTop: -5 }}> 
      <Animated.View
        style={[
          {
            width: 38, // Encore plus petit pour laisser de la place au texte en dessous
            height: 38,
            borderRadius: 19,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: focused
              ? light ? "#FFFFFF" : "#E3F9F1"
              : "transparent",
            borderWidth: focused && light ? 2 : 0,
            borderColor: light ? "#19D07D" : "transparent",
          },
          animatedStyle,
        ]}
      >
        <Ionicons
          name={name}
          size={20} // Icône légèrement plus petite
          color={focused ? "#0F3327" : color}
        />
      </Animated.View>
    </View>
  );
}

export default function TabLayout() {
  const { colors, mode } = useThemeMode();
  const { user, loading } = useUser();
  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          position: "absolute",
          // On remonte la barre un peu pour ne pas être gêné par le trait iOS
          bottom: Platform.OS === "ios" ? insets.bottom + 10 : 20,
          left: 15,
          right: 15,
          height: 80, // Hauteur augmentée pour respirer
          backgroundColor: mode === "dark" ? "rgba(20,26,24,0.95)" : "#E6E9E8",
          borderRadius: 40,
          borderTopWidth: 0,
          borderWidth: mode === "light" ? 2 : 0,
          borderColor: mode === "light" ? "#0F3327" : "transparent",
          elevation: 5,
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 8,
          zIndex: 100,
          paddingBottom: 15, // Donne de l'espace au texte en bas
        },
        tabBarItemStyle: {
          height: 70,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 9, // Légèrement plus petit pour être sûr que ça tienne
          fontWeight: "700",
          marginTop: 5, 
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