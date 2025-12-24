import { DarkTheme, DefaultTheme } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import "react-native-reanimated";

// PROVIDERS
import { ChallengesProvider } from "@/hooks/challenges-context";
import { ClubProvider } from "@/hooks/club-context";
import { CouponsProvider } from "@/hooks/coupons-context";
import { FriendsProvider } from "@/hooks/friends-context";
import { GlobalPopupProvider } from "@/hooks/global-popup-context";
import { NotificationsProvider } from "@/hooks/notifications-context";
import { PointsProvider } from "@/hooks/points-context";
import { SubscriptionsProvider } from "@/hooks/subscriptions-context";
import { ThemeProviderCustom, useThemeMode } from "@/hooks/theme-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { UserProvider, useUser } from "@/hooks/user-context";

// FONTS
import {
    Baloo2_400Regular,
    Baloo2_500Medium,
    Baloo2_600SemiBold,
} from "@expo-google-fonts/baloo-2";
import { FredokaOne_400Regular } from "@expo-google-fonts/fredoka-one";
import {
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_600SemiBold,
} from "@expo-google-fonts/quicksand";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { setBackgroundColorAsync } from 'expo-system-ui';
import React, { useEffect, useRef } from "react";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigation() {
  const { mode } = useThemeMode();
  const { user, loading } = useUser();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = (mode ?? colorScheme) === "dark" ? DarkTheme : DefaultTheme;

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)/acceuil');
    }
  }, [user, loading, segments]);

  useEffect(() => {
    setBackgroundColorAsync(theme.colors.background);
  }, [theme]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
        <StatusBar style={mode === "dark" ? "light" : "dark"} />
      </View>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    FredokaOne_400Regular,
    Baloo2_400Regular,
    Baloo2_500Medium,
    Baloo2_600SemiBold,
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_600SemiBold,
  });

  const defaultsAppliedRef = useRef(false);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (!fontsLoaded || defaultsAppliedRef.current) return;
    defaultsAppliedRef.current = true;
    SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProviderCustom>
      {/* ⚠️ ORDRE CRUCIAL ⚠️ */}
      <UserProvider> 
        {/* UserProvider doit être le parent de NotificationsProvider */}
        <NotificationsProvider>
          <GlobalPopupProvider>
            <PointsProvider>
              <CouponsProvider>
                <ClubProvider>
                  <ChallengesProvider>
                    <FriendsProvider>
                      <SubscriptionsProvider>
                        <RootNavigation />
                      </SubscriptionsProvider>
                    </FriendsProvider>
                  </ChallengesProvider>
                </ClubProvider>
              </CouponsProvider>
            </PointsProvider>
          </GlobalPopupProvider>
        </NotificationsProvider>
      </UserProvider>
    </ThemeProviderCustom>
  );
}