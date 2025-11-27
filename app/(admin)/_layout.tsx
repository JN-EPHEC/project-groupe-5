import { useUser } from "@/hooks/user-context";
import { Redirect, Stack } from "expo-router";

export default function AdminLayout() {
  const { user } = useUser();

  if (!user?.isAdmin) return <Redirect href="/profil" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="create-defi" />
      <Stack.Screen name="list-defis" />
    </Stack>
  );
}
