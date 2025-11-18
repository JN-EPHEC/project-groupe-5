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

import { onAuthStateChanged, User } from "firebase/auth";
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

  // 🔐 On écoute Firebase pour savoir si un utilisateur est connecté
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });

    return unsubscribe;
  }, []);

  // ⏳ Pendant le chargement de l'état d'authentification
  if (user === undefined) {
    return (
      <>
        <StatusBar style={mode === "dark" ? "light" : "dark"} />
      </>
    );
  }

  // ✅ Une fois qu'on sait si l'utilisateur est connecté ou pas
  return (
    <>
      <Stack>
        {user ? (
          // Utilisateur connecté → on montre les tabs
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        ) : (
          // Pas connecté → on montre l'écran login
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