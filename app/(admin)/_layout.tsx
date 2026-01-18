import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { useEffect } from "react";
import { Platform, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  useEffect(() => { scale.value = withTiming(focused ? 1.1 : 1, { duration: 200 }); }, [focused]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const theme = light ? navTheme.light : navTheme.dark;

  return (
    <View pointerEvents="none" style={{ alignItems: 'center', justifyContent: 'center', marginTop: -4 }}> 
      <Animated.View style={[{
            width: 42, height: 42, borderRadius: 21,
            justifyContent: "center", alignItems: "center",
            backgroundColor: focused ? theme.activeIconBg : "transparent",
            borderWidth: focused && !light ? 1 : 0,
            borderColor: theme.border,
          }, animatedStyle]}>
        <Ionicons name={name} size={22} color={focused ? theme.activeIconColor : color} />
      </Animated.View>
    </View>
  );
}

export default function AdminLayout() {
  const { mode } = useThemeMode();
  const insets = useSafeAreaInsets();
  const isLight = mode === "light";
  const theme = isLight ? navTheme.light : navTheme.dark;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          position: "absolute",
          bottom: Platform.OS === "ios" ? insets.bottom + 10 : 20,
          left: 15, right: 15,
          height: 84, borderRadius: 42,
          backgroundColor: theme.bg,
          borderTopWidth: 0, borderWidth: 1, borderColor: theme.border,
          elevation: 8, shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16,
          paddingBottom: 16, paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600", marginTop: 6 },
        tabBarActiveTintColor: theme.activeText,
        tabBarInactiveTintColor: theme.inactiveColor,
      }}
    >
      <Tabs.Screen name="index" options={{ 
        title: "Admin", 
        tabBarIcon: (p) => <CircleIcon name="shield-checkmark-outline" {...p} light={isLight} /> 
      }} />
      
      <Tabs.Screen name="defis" options={{ 
        title: "Défis", 
        tabBarIcon: (p) => <CircleIcon name="trophy-outline" {...p} light={isLight} /> 
      }} />

      <Tabs.Screen name="coupons" options={{ 
        title: "Coupons", 
        tabBarIcon: (p) => <CircleIcon name="ticket-outline" {...p} light={isLight} /> 
      }} />

      <Tabs.Screen name="feedback" options={{ 
        title: "Avis", 
        tabBarIcon: (p) => <CircleIcon name="chatbubble-ellipses-outline" {...p} light={isLight} /> 
      }} />

      <Tabs.Screen name="reports" options={{ 
        title: "Alertes", 
        tabBarIcon: (p) => <CircleIcon name="warning-outline" {...p} light={isLight} /> 
      }} />

      {/* Pages cachées */}
      <Tabs.Screen name="create-defi" options={{ href: null }} />
    </Tabs>
  );
}