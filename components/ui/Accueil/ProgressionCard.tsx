import ProgressCircle from "@/components/ui/ProgressCircle";
import { useThemeMode } from "@/hooks/theme-context";
import { StyleSheet, Text, View } from "react-native";

type ProgressionCardProps = {
  completedDays: number;  // number of daily challenges completed this week
  totalDays: number;      // number of total days in the week (e.g. 1..7)
  pointsEarned: number;   // total points earned this week
  streak: number;         // number of days in a row (can go beyond 7)
};

export default function ProgressionCard({
  completedDays,
  totalDays,
  pointsEarned,
  streak,
}: ProgressionCardProps) {
  const { colors } = useThemeMode();

  // Calculate completion percentage for the circle
  const progress = totalDays > 0 ? completedDays / totalDays : 0;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Progression de la semaine
      </Text>

      <View style={styles.row}>
        <ProgressCircle done={completedDays} total={totalDays} />

        <View style={styles.details}>
          <Text style={[styles.points, { color: colors.text }]}>
            {pointsEarned} Points gagnés
          </Text>
          <Text style={[styles.streak, { color: colors.mutedText }]}>
            {streak} jours de suite 🔥
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 14,
    marginTop: 14,
  },
  title: {
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  details: {
    marginLeft: 16,
  },
  points: {
    fontWeight: "600",
    fontSize: 15,
  },
  streak: {
    marginTop: 4,
  },
});
