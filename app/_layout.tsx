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

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

function RootNavigation() {
  const { mode } = useThemeMode();
  const colorScheme = useColorScheme();
  const theme = (mode ?? colorScheme) === "dark" ? DarkTheme : DefaultTheme;
  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
