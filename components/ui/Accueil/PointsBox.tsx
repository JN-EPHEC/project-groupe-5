import { useThemeMode } from "@/hooks/theme-context";
import { StyleSheet, Text, View } from "react-native";

export default function PointsBox() {
  const { colors } = useThemeMode();

  return (
    <View style={[styles.pointsBox, { backgroundColor: colors.surface }]}>
      <Text style={[styles.pointsNumber, { color: colors.accent }]}>285</Text>
      <Text style={[styles.pointsLabel, { color: colors.mutedText }]}>Points</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pointsBox: {
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  pointsNumber: { fontWeight: "700", fontSize: 24 },
  pointsLabel: { marginTop: 2 },
});
