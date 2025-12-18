import { useUser } from "@/hooks/user-context";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, Stack, useRouter } from "expo-router";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AdminLayout() {
  const { user } = useUser();
  const router = useRouter();
  const insets = useSafeAreaInsets(); // Pour gérer l'encoche de l'iPhone

  // Si pas admin, on redirige
  if (!user?.isAdmin) return <Redirect href="/profil" />;

  return (
    <View style={{ flex: 1 }}>
      {/* La Stack gère la navigation interne de l'admin */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="create-defi" />
        <Stack.Screen name="list-defis" />
        <Stack.Screen name="reports" />
        <Stack.Screen name="feedback" />
      </Stack>

      {/* BOUTON RETOUR FLOTTANT (Z-Index élevé) */}
      <TouchableOpacity
        onPress={() => router.replace("/(tabs)/profil")} // Renvoie vers le profil utilisateur
        style={[
          styles.backButton, 
          { 
            top: Platform.OS === 'ios' ? insets.top + 10 : 40, // S'adapte à l'écran
          }
        ]}
      >
        <View style={styles.blurCircle}>
          <Ionicons name="arrow-back" size={24} color="#0F3327" />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: "absolute",
    left: 20,
    zIndex: 9999, // Très important pour passer au-dessus de tout
  },
  blurCircle: {
    backgroundColor: "rgba(255,255,255,0.8)", // Petit fond blanc semi-transparent pour la lisibilité
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  }
});