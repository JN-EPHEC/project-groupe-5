import { DarkTheme, DefaultTheme } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { ChallengesProvider } from "@/hooks/challenges-context";
import { ClubProvider } from "@/hooks/club-context";
import { PointsProvider } from "@/hooks/points-context";
import { ThemeProviderCustom, useThemeMode } from "@/hooks/theme-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { UserProvider } from "@/hooks/user-context";
import { configureNotificationHandling, registerPushToken } from "@/services/push";
import { onAuthStateChanged, type User } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { auth } from "../firebaseConfig";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

function RootNavigation() {
  const { mode } = useThemeMode();
  const colorScheme = useColorScheme();
  const theme = (mode ?? colorScheme) === "dark" ? DarkTheme : DefaultTheme;

  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        configureNotificationHandling();
        await registerPushToken();
      }
    });
    return unsub;
  }, []);

  if (user === undefined) {
    return (
      <>
        <StatusBar style={mode === "dark" ? "light" : "dark"} />
      </>
    );
  }

  return (
    <>
      <Stack>
        {user ? (
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        ) : (
          <Stack.Screen name="login" options={{ headerShown: false }} />
        )}
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
          <ClubProvider>
            <ChallengesProvider>
              <RootNavigation />
            </ChallengesProvider>
          </ClubProvider>
        </PointsProvider>
      </UserProvider>
    </ThemeProviderCustom>
  );
}
