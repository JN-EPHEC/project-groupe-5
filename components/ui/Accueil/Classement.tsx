import { useThemeMode } from "@/hooks/theme-context";
import { StyleSheet, Text, View } from "react-native";

export default function Classement() {
  const { colors } = useThemeMode();

  return (
    <>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Classement</Text>
      <View style={styles.row}>
        <View style={[styles.rankCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.rankNumber, { color: colors.text }]}>2e sur 400</Text>
          <Text style={[styles.rankLabel, { color: colors.mutedText }]}>Individuel</Text>
        </View>

        <View style={[styles.rankCardActive, { backgroundColor: colors.surfaceAlt }]}>
          <Text style={[styles.rankNumber, { color: colors.text }]}>1er sur 5</Text>
          <Text style={[styles.rankLabel, { color: colors.mutedText }]}>Club</Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontWeight: "600", marginVertical: 10, fontSize: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rankCard: { padding: 16, width: "48%", borderRadius: 14 },
  rankCardActive: { padding: 16, width: "48%", borderRadius: 14 },
  rankNumber: { fontWeight: "600", fontSize: 16 },
  rankLabel: { marginTop: 4 },
});
