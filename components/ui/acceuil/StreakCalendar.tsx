import { CATEGORY_CONFIG } from "@/components/ui/defi/constants";
import { useChallenges } from "@/hooks/challenges-context";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

function getWeekDates(): Date[] {
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // 0=Mon .. 6=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - day);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export default function StreakCalendar() {
  const { colors } = useThemeMode();
  const { activities } = useChallenges();
  const router = useRouter();
  const week = useMemo(() => getWeekDates(), []);
  const todayIndex = (new Date().getDay() + 6) % 7;
  const streakWeeks = 3; // placeholder value for UI
  const monday = week[0];
  const weekCount = week.reduce((acc, d) => acc + (activities[d.toISOString().slice(0,10)] ? 1 : 0), 0);

  return (
    <View style={[styles.card, { backgroundColor: "#0B0F0E", borderColor: colors.surfaceAlt }]}> 
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: "#FFFFFF" }]}>Votre série d'activités</Text>
        <Text onPress={() => router.push("/calendar")} style={[styles.link, { color: colors.accent }]}>Voir le calendrier</Text>
      </View>

      <View style={styles.contentRow}>
        <View style={[styles.flame, { backgroundColor: colors.pill, borderColor: colors.accent }]}> 
          <Text style={[styles.flameCount, { color: "#FFFFFF", marginRight: 8 }]}>{weekCount}</Text>
          <Ionicons name="flame" size={22} color={colors.accent} />
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.daysRow}>
            {['L','M','M','J','V','S','D'].map((d, i) => (
              <View key={i} style={styles.col}> 
                <Text style={[styles.dayLabel, { color: "#B8C7C0" }]}>{d}</Text>
              </View>
            ))}
          </View>
          <View style={styles.circlesRow}>
            {week.map((date, i) => {
              const isToday = i === todayIndex;
              const key = date.toISOString().slice(0, 10);
              const cat = activities[key];
              const hasActivity = Boolean(cat);
              const bg = hasActivity ? "#0F3327" : "transparent";
              return (
                <View key={i} style={styles.col}>
                  <View style={[styles.circle, { borderColor: "#2B3A35", backgroundColor: bg, borderWidth: isToday ? 3 : 2 }]}> 
                  {hasActivity ? (
                    <Ionicons name={CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG].icon as any} size={18} color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.circleText, { color: "#FFFFFF" }]}>{String(date.getDate())}</Text>
                  )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const COL_PERCENT = '14.285%';
const SIZE = 34;

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginTop: 12,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 18, fontWeight: "800" },
  link: { fontWeight: "800" },
  contentRow: { flexDirection: "row", marginTop: 12, alignItems: "center" },
  flame: {
    width: 96,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  flameCount: { fontSize: 20, fontWeight: "900" },
  daysRow: { flexDirection: "row", justifyContent: 'space-between', paddingHorizontal: 6, marginBottom: 6, flexWrap: 'nowrap' },
  col: { width: COL_PERCENT, alignItems: 'center' },
  dayLabel: { fontWeight: "700" },
  circlesRow: { flexDirection: "row", justifyContent: 'space-between', paddingHorizontal: 6 },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  circleText: { fontWeight: "800" },
  // dots removed
});
