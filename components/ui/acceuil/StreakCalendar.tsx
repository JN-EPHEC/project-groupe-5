import { CATEGORY_CONFIG } from "@/components/ui/defi/constants";
import { FontFamilies } from "@/constants/fonts";
import { useChallenges } from "@/hooks/challenges-context";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
  const { colors, mode } = useThemeMode();
  const { activities } = useChallenges();
  const router = useRouter();
  const week = useMemo(() => getWeekDates(), []);
  const todayIndex = (new Date().getDay() + 6) % 7;
  const weekCount = week.reduce((acc, d) => acc + (activities[d.toISOString().slice(0,10)] ? 1 : 0), 0);
  const isLight = mode === "light";
  const darkCardGradient = ["rgba(0, 151, 178, 0.2)", "rgba(0, 151, 178, 0.05)"] as const;
  const gradientColors = isLight
    ? ([colors.cardAlt, colors.card] as const)
    : darkCardGradient;
  const borderColor = isLight ? "rgba(255,255,255,0.12)" : "rgba(0, 151, 178, 0.3)";
  const titleColor = isLight ? colors.cardText : colors.text;
  const mutedColor = isLight ? colors.cardMuted : colors.mutedText;
  const pillBackground = isLight ? colors.cardAlt : colors.pill;
  const pillBorder = isLight ? "rgba(255,255,255,0.12)" : colors.accent;
  const flameTextColor = isLight ? colors.cardText : colors.text;
  const flameIconColor = isLight ? colors.cardText : colors.accent;
  const circleBorder = isLight ? colors.cardAlt : "rgba(0, 151, 178, 0.3)";
  const circleTextColor = isLight ? colors.cardText : colors.text;

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { borderColor }]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: titleColor }]}>Votre série d'activités</Text>
        <Text onPress={() => router.push("/calendar")} style={[styles.link, { color: colors.accent }]}>Voir le calendrier</Text>
      </View>

      <View style={styles.contentRow}>
        <View
          style={[styles.flame, { backgroundColor: pillBackground, borderColor: pillBorder }]}
        >
          <Text style={[styles.flameCount, { color: flameTextColor, marginRight: 6 }]}>{weekCount}</Text>
          <Ionicons name="flame" size={18} color={flameIconColor} />
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.daysRow}>
            {['L','M','M','J','V','S','D'].map((d, i) => (
              <View key={i} style={styles.col}>
                <Text style={[styles.dayLabel, { color: mutedColor }]}>{d}</Text>
              </View>
            ))}
          </View>
          <View style={styles.circlesRow}>
            {week.map((date, i) => {
              const isToday = i === todayIndex;
              const key = date.toISOString().slice(0, 10);
              const cat = activities[key];
              const hasActivity = Boolean(cat);
              const bg = hasActivity ? colors.accent : "transparent";
              return (
                <View key={i} style={styles.col}>
                  <View
                    style={[styles.circle, { borderColor: circleBorder, backgroundColor: bg, borderWidth: isToday ? 3 : 2 }]}
                  >
                  {hasActivity ? (
                    <Ionicons name={CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG].icon as any} size={18} color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.circleText, { color: circleTextColor }]}>{String(date.getDate())}</Text>
                  )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const SIZE = 30;

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    width: "100%",
    position: "relative",
    shadowColor: "rgba(0, 0, 0, 0.4)",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 18, fontFamily: FontFamilies.heading },
  link: { fontFamily: FontFamilies.heading, textDecorationLine: "underline" },
  contentRow: { flexDirection: "row", marginTop: 12, alignItems: "center" },
  flame: {
    width: 72,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  flameCount: { fontSize: 18, fontFamily: FontFamilies.heading },
  daysRow: { flexDirection: "row", justifyContent: 'space-between', marginBottom: 6 },
  col: { flex: 1, alignItems: 'center' },
  dayLabel: { fontFamily: FontFamilies.headingMedium },
  circlesRow: { flexDirection: "row", justifyContent: 'space-between' },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  circleText: { fontFamily: FontFamilies.heading },
  // dots removed
});
