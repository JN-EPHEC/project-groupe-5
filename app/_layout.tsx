import { DarkTheme, DefaultTheme } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { ChallengesProvider } from "@/hooks/challenges-context";
import { ClubProvider } from "@/hooks/club-context";
import { CouponsProvider } from "@/hooks/coupons-context";
import { FriendsProvider } from "@/hooks/friends-context";
import { PointsProvider } from "@/hooks/points-context";
import { SubscriptionsProvider } from "@/hooks/subscriptions-context";
import { ThemeProviderCustom, useThemeMode } from "@/hooks/theme-context";
import { usePresence } from "@/hooks/use-presence";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { UserProvider } from "@/hooks/user-context";
import React from "react";
import { Platform } from "react-native";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

function RootNavigation() {
  usePresence();
  const { mode } = useThemeMode();
  const colorScheme = useColorScheme();
  const theme = (mode ?? colorScheme) === "dark" ? DarkTheme : DefaultTheme;
  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="amis-plus" options={{ headerShown: false }} />
        <Stack.Screen name="calendar" options={{ headerShown: false }} />
        <Stack.Screen name="camera" options={{ headerShown: false }} />
        <Stack.Screen name="commentaire" options={{ headerShown: false }} />
        <Stack.Screen name="premium" options={{ headerShown: false }} />
        <Stack.Screen name="validation" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProviderCustom>
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
    </ThemeProviderCustom>
  );
}
