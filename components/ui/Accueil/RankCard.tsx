import { useThemeMode } from "@/hooks/theme-context";
import { StyleSheet, Text, View } from "react-native";

type RankCardProps = {
  position: number;   // e.g. 1 or 2
  total: number;      // e.g. 5 or 400
  title: "Individuel" | "Club"; // stays static
  isActive?: boolean; // highlights one card (optional)
};

export default function RankCard({
  position,
  total,
  title,
  isActive = false,
}: RankCardProps) {
  const { colors } = useThemeMode();

  // Display "1er" for first, "2e" for others
  const formattedRank = position === 1 ? `${position}er` : `${position}e`;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: isActive ? colors.surfaceAlt : colors.surface },
      ]}
    >
      <Text style={[styles.rankText, { color: colors.text }]}>
        {formattedRank} sur {total}
      </Text>
      <Text style={[styles.title, { color: colors.mutedText }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    width: "48%",
    borderRadius: 14,
  },
  rankText: {
    fontWeight: "600",
    fontSize: 16,
  },
  title: {
    marginTop: 4,
  },
});
