import { AdminNav } from "@/components/ui/(admin)/AdminNav";
import { useThemeMode } from "@/hooks/theme-context";
import { Text, View } from "react-native";

export default function AdminReports() {
  const { colors } = useThemeMode();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Contenu vide pour l'instant */}
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Text style={{ color: colors.mutedText, fontSize: 16, textAlign: "center" }}>
          Aucun signalement pour le moment.
        </Text>
      </View>

      {/* Barre de navigation */}
      <AdminNav />
    </View>
  );
}