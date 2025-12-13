import { useUser } from "@/hooks/user-context";
import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useThemeMode } from "@/hooks/theme-context";

export default function AuthLayout() {
  const { user, loading } = useUser();
  const { colors } = useThemeMode();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
