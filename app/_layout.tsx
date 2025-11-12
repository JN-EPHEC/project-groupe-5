import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { ThemeProviderCustom, useThemeMode } from "@/hooks/theme-context";
import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

function RootNavigation() {
  const { mode } = useThemeMode();
  const colorScheme = useColorScheme();
  const theme = (mode ?? colorScheme) === "dark" ? DarkTheme : DefaultTheme;
  return (
    <ThemeProvider value={theme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProviderCustom>
      <RootNavigation />
    </ThemeProviderCustom>
  );
}
