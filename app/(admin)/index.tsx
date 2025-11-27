import { useThemeMode } from "@/hooks/theme-context";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export default function AdminHome() {
  const { colors } = useThemeMode();
  const router = useRouter();

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: colors.background }}>
      <Text style={{ fontSize: 26, fontWeight: "700", color: colors.text }}>
        Espace Administrateur
      </Text>

      <Text style={{ color: colors.mutedText, marginBottom: 30 }}>
        Gestion des défis
      </Text>

      <TouchableOpacity
        style={{ padding: 16, backgroundColor: colors.accent, borderRadius: 12, marginBottom: 12 }}
        onPress={() => router.push("/(admin)/create-defi")}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>Créer un défi</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ padding: 16, backgroundColor: colors.surface, borderRadius: 12 }}
        onPress={() => router.push("/(admin)/list-defis")}
      >
        <Text style={{ color: colors.text, fontWeight: "600" }}>Voir les défis</Text>
      </TouchableOpacity>
    </View>
  );
}
