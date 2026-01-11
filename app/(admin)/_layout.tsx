// app/(admin)/_layout.tsx
import { useUser } from "@/hooks/user-context";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, Stack, useRouter } from "expo-router";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AdminLayout() {
  const { user } = useUser();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Si pas admin, on redirige
  if (!user?.isAdmin) return <Redirect href="/profil" />;

  return (
    <View style={{ flex: 1 }}>
      {/* La Stack gère la navigation interne de l'admin */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        {/* Ordre logique du Menu */}
        <Stack.Screen name="defis" />
        <Stack.Screen name="coupons" />  {/* ✅ NOUVEAU */}
        <Stack.Screen name="reports" />
        <Stack.Screen name="feedback" />
      </Stack>

      {/* BOUTON "QUITTER ADMIN" FLOTTANT */}
      <TouchableOpacity
        onPress={() => router.replace("/(tabs)/profil")}
        activeOpacity={0.8}
        style={[
          styles.backButton, 
          { 
            top: Platform.OS === 'ios' ? insets.top + 10 : 40, 
          }
        ]}
      >
        <View style={styles.buttonContent}>
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: "absolute",
    left: 24, // Alignement avec le padding des pages (souvent 24)
    zIndex: 9999,
  },
  buttonContent: {
    backgroundColor: "#FFFFFF",
    width: 44,
    height: 44,
    borderRadius: 14, // Arrondi moderne
    justifyContent: "center",
    alignItems: "center",
    // Ombre douce et propre
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    // Bordure très fine
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)"
  }
});