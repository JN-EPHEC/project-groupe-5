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

// 🎨 THEME NAVBAR
const navTheme = {
  light: {
    bg: "rgba(240, 253, 244, 0.95)", // Le même fond "Menthe" que tes cartes
    border: "rgba(255, 255, 255, 0.8)",
    activeIconBg: "#008F6B", // Vert Marque pour la pastille active
    activeIconColor: "#FFFFFF", // Icône blanche sur fond vert
    inactiveColor: "#6E8580", // Gris vert
    activeText: "#0A3F33", // Vert Forêt
    shadow: "#005c4b",
  },
  dark: {
    bg: "rgba(20, 26, 24, 0.95)",
    border: "rgba(0, 151, 178, 0.3)",
    activeIconBg: "rgba(0, 151, 178, 0.2)",
    activeIconColor: "#E6FFF5",
    inactiveColor: "#8AA39C",
    activeText: "#E6FFF5",
    shadow: "#000",
  }
};

function CircleIcon({ name, color, focused, light }: any) {
  const scale = useSharedValue(focused ? 1 : 0.9);
  
  // Animation plus fluide
  useEffect(() => {
    scale.value = withTiming(focused ? 1 : 1, { duration: 200 });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const theme = light ? navTheme.light : navTheme.dark;

  return (
    <View pointerEvents="none" style={{ alignItems: 'center', justifyContent: 'center', marginTop: -4 }}> 
      <Animated.View
        style={[
          {
            width: 42, // Un peu plus grand pour être confortable
            height: 42,
            borderRadius: 21,
            justifyContent: "center",
            alignItems: "center",
            // Si actif : Fond Vert Marque. Sinon : Transparent.
            backgroundColor: focused ? theme.activeIconBg : "transparent",
            // Petit effet de bordure en mode Dark
            borderWidth: focused && !light ? 1 : 0,
            borderColor: theme.border,
          },
          animatedStyle,
        ]}
      >
        <Ionicons
          name={name}
          size={22}
          // Si actif : Blanc. Sinon : Couleur inactive du thème.
          color={focused ? theme.activeIconColor : color}
        />
      </Animated.View>
    </View>
  );
}

export default function TabLayout() {
  const { colors, mode } = useThemeMode();
  const { user, loading } = useUser();
  const insets = useSafeAreaInsets();
  const isLight = mode === "light";
  const theme = isLight ? navTheme.light : navTheme.dark;

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
          // On la décolle du bas pour l'effet flottant
          bottom: Platform.OS === "ios" ? insets.bottom + 10 : 20,
          left: 15,
          right: 15,
          height: 84, // Hauteur confortable
          borderRadius: 42, // Très arrondi
          
          // --- STYLE GLASSMORPHISM ---
          backgroundColor: theme.bg,
          borderTopWidth: 0,
          borderWidth: 1, // Bordure fine "verre"
          borderColor: theme.border,
          
          // --- OMBRES DOUCES ---
          elevation: 8,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isLight ? 0.1 : 0.3,
          shadowRadius: 16,
          
          paddingBottom: 16, // Espace pour le texte
          paddingTop: 8,
        },
        tabBarItemStyle: {
          // Centrage vertical
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: 6,
        },
        // Couleurs des textes
        tabBarActiveTintColor: theme.activeText,
        tabBarInactiveTintColor: theme.inactiveColor,
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="acceuil"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color, focused }) => (
            <CircleIcon name="home-outline" color={color} focused={focused} light={isLight} />
          ),
        }}
      />
      <Tabs.Screen
        name="defi"
        options={{
          title: "Défis",
          tabBarIcon: ({ color, focused }) => (
            <CircleIcon name="trophy-outline" color={color} focused={focused} light={isLight} />
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: "Social",
          tabBarIcon: ({ color, focused }) => (
            <CircleIcon name="people-outline" color={color} focused={focused} light={isLight} />
          ),
        }}
      />
      <Tabs.Screen
        name="recompenses"
        options={{
          title: "Cadeaux",
          tabBarIcon: ({ color, focused }) => (
            <CircleIcon name="gift-outline" color={color} focused={focused} light={isLight} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, focused }) => (
            <CircleIcon name="person-circle-outline" color={color} focused={focused} light={isLight} />
          ),
        }}
      />
    </Tabs>
  );
}