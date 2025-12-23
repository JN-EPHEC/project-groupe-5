import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router"; // ⚠️ Plus de "Redirect" ici !
import React, { useEffect } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

//debugger();
if (typeof window !== "undefined") {
  const originalError = console.error;

  console.error = (...args: any[]) => {
    const message = String(args[0] ?? "");

    if (message.includes("Unexpected text node")) {
      throw new Error(
        "FORCED CRASH: Unexpected text node detected.\n" +
        "This means a string or number is rendered inside a <View>."
      );
    }

    originalError(...args);
  };
}



// 🎨 THEME NAVBAR
const navTheme = {
  light: {
    bg: "rgba(240, 253, 244, 0.95)",
    border: "rgba(255, 255, 255, 0.8)",
    activeIconBg: "#008F6B",
    activeIconColor: "#FFFFFF",
    inactiveColor: "#6E8580",
    activeText: "#0A3F33",
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
            width: 42,
            height: 42,
            borderRadius: 21,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: focused ? theme.activeIconBg : "transparent",
            borderWidth: focused && !light ? 1 : 0,
            borderColor: theme.border,
          },
          animatedStyle,
        ]}
      >
        <Ionicons
          name={name}
          size={22}
          color={focused ? theme.activeIconColor : color}
        />
      </Animated.View>
    </View>
  );
}

export default function TabLayout() {
  const { colors, mode } = useThemeMode();
  const { loading } = useUser(); // On n'a besoin que du loading ici
  const insets = useSafeAreaInsets();
  const isLight = mode === "light";
  const theme = isLight ? navTheme.light : navTheme.dark;

  // Affichage du loader uniquement si on charge
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  // ❌ SUPPRESSION DE LA REDIRECTION ICI : C'est le RootLayout qui s'en charge maintenant.

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          position: "absolute",
          bottom: Platform.OS === "ios" ? insets.bottom + 10 : 20,
          left: 15,
          right: 15,
          height: 84,
          borderRadius: 42,
          backgroundColor: theme.bg,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: theme.border,
          elevation: 8,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isLight ? 0.1 : 0.3,
          shadowRadius: 16,
          paddingBottom: 16,
          paddingTop: 8,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: 6,
        },
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