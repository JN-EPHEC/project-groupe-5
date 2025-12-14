import { useUser } from "@/hooks/user-context";
import { Redirect, Stack } from "expo-router";

export default function AdminLayout() {
  const { user } = useUser();

  // Si pas admin, on redirige
  if (!user?.isAdmin) return <Redirect href="/profil" />;

  return (
    // Ce headerShown: false cache les headers À L'INTÉRIEUR de l'admin
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="create-defi" />
      <Stack.Screen name="list-defis" />
      <Stack.Screen name="reports" />
    </Stack>
  );
}