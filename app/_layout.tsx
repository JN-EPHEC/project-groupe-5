import { DarkTheme, DefaultTheme } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChallengesProvider } from "@/hooks/challenges-context";
import { ClubProvider } from "@/hooks/club-context";
import { CouponsProvider } from "@/hooks/coupons-context";
import { FriendsProvider } from "@/hooks/friends-context";
import { NotificationsProvider } from "@/hooks/notifications-context";
import { PointsProvider } from "@/hooks/points-context";
import { SubscriptionsProvider } from "@/hooks/subscriptions-context";
import { ThemeProviderCustom, useThemeMode } from "@/hooks/theme-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { UserProvider } from "@/hooks/user-context";
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
import { Platform, Text, TextInput } from "react-native";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync().catch(() => {});

// Preventing font scaling globally
if ((Text as any).defaultProps == null) (Text as any).defaultProps = {};
(Text as any).defaultProps.allowFontScaling = false;

if ((TextInput as any).defaultProps == null) (TextInput as any).defaultProps = {};
(TextInput as any).defaultProps.allowFontScaling = false;

function RootNavigation() {
  const { mode } = useThemeMode();
  const colorScheme = useColorScheme();
  const theme = (mode ?? colorScheme) === "dark" ? DarkTheme : DefaultTheme;

  useEffect(() => {
    setBackgroundColorAsync(theme.colors.background);
  }, [theme]);

  return (
    <>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="amis-plus" options={{ headerShown: false }} />
          <Stack.Screen name="change-password" options={{ headerShown: false }} />
          <Stack.Screen name="calendar" options={{ headerShown: false }} />
          <Stack.Screen name="camera" options={{ headerShown: false }} />
          <Stack.Screen name="commentaire" options={{ headerShown: false }} />
          <Stack.Screen name="premium" options={{ headerShown: false }} />
          <Stack.Screen name="validation" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaView>

      <StatusBar style={mode === "dark" ? "light" : "dark"} />
    </>
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

    const applyDefaultFont = (component: any) => {
      const existing = component.defaultProps ?? {};
      const existingStyle = existing.style
        ? Array.isArray(existing.style)
          ? existing.style
          : [existing.style]
        : [];
      component.defaultProps = {
        ...existing,
        style: [...existingStyle, { fontFamily: "Quicksand_500Medium" }],
      };
    };

    applyDefaultFont(Text as any);
    applyDefaultFont(TextInput as any);

    SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProviderCustom>
      <NotificationsProvider>
        <UserProvider>
          <PointsProvider>
            <CouponsProvider>
              <ClubProvider>
                <ChallengesProvider>
                  <FriendsProvider>
                    <SubscriptionsProvider>
                      <RootNavigation />
                    </SubscriptionsProvider>
                    {Platform.OS === 'web' && (
                      <style>{`
                        html, body, #root, #__next { -ms-overflow-style: none; scrollbar-width: none; }
                        html::-webkit-scrollbar, body::-webkit-scrollbar, div::-webkit-scrollbar { display: none; }
                      `}</style>
                    )}
                  </FriendsProvider>
                </ChallengesProvider>
              </ClubProvider>
            </CouponsProvider>
          </PointsProvider>
        </UserProvider>
      </NotificationsProvider>
    </ThemeProviderCustom>
  );
}
