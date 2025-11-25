import { CATEGORY_CONFIG } from "@/components/ui/defi/constants";
import { useChallenges } from "@/hooks/challenges-context";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

function getMonthMatrix(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startDay = (firstOfMonth.getDay() + 6) % 7; // Monday first
  const startDate = new Date(year, month, 1 - startDay);
  const matrix: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    matrix.push(d);
  }
  return matrix;
}

function formatMonthYear(date: Date) {
  try {
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  } catch {
    const months = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }
}

export default function CalendarScreen() {
  const { colors } = useThemeMode();
  const { activities } = useChallenges();
  const router = useRouter();
  const [displayDate, setDisplayDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0,0,0,0);
    return d;
  });
  const today = new Date();
  const grid = useMemo(() => getMonthMatrix(displayDate), [displayDate]);
  const monthName = formatMonthYear(displayDate);
  const monthIndex = displayDate.getMonth();

  const activeDaysThisMonth = grid
    .filter((d) => d.getMonth() === monthIndex)
    .filter((d) => activities[d.toISOString().slice(0,10)])
    .length;

  // naive weekly streak: count non-empty weeks ending at current week
  const weeks = [] as Date[][];
  for (let i = 0; i < grid.length; i += 7) weeks.push(grid.slice(i, i + 7));
  const currentWeekIdx = weeks.findIndex(w => w.some(d => d.toDateString() === today.toDateString()));
  let streakWeeks = 0;
  for (let i = currentWeekIdx; i >= 0; i--) {
    const has = weeks[i].some(d => activities[d.toISOString().slice(0,10)]);
    if (has) streakWeeks += 1; else break;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIconBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.monthSwitcher}>
          <TouchableOpacity onPress={() => setDisplayDate(d => { const n = new Date(d); n.setMonth(d.getMonth()-1); return n; })} style={styles.arrowBtn}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: colors.text }]}>{monthName}</Text>
          <TouchableOpacity onPress={() => setDisplayDate(d => { const n = new Date(d); n.setMonth(d.getMonth()+1); return n; })} style={styles.arrowBtn}>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <View>
          <Text style={{ color: colors.mutedText }}>Votre série d'activités</Text>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '900' }}>{streakWeeks} Semaines</Text>
        </View>
        <View>
          <Text style={{ color: colors.mutedText }}>Activités de la série d'activités</Text>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '900' }}>{activeDaysThisMonth}</Text>
        </View>
      </View>

      <View style={styles.calendarBody}>
        <View style={styles.weekHeader}>
          {['L','M','M','J','V','S','D'].map((d) => (
            <Text key={d} style={[styles.weekDay, { color: colors.mutedText }]}>{d}</Text>
          ))}
        </View>
        {weeks.map((week, wi) => (
          <View key={wi} style={styles.weekRow}>
            {week.map((d, di) => {
              const key = d.toISOString().slice(0,10);
              const inMonth = d.getMonth() === monthIndex;
              const isToday = d.toDateString() === today.toDateString();
              const cat = activities[key];
              const has = Boolean(cat);
              return (
                <View key={di} style={styles.dayCell}> 
                  <View style={[styles.dayBubble, { borderColor: inMonth ? '#2B3A35' : '#1B2723', backgroundColor: has ? '#0F3327' : 'transparent', borderWidth: isToday ? 3 : 2 }]}> 
                    {has ? (
                      <Ionicons name={CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG].icon as any} size={18} color="#FFFFFF" />
                    ) : (
                      <Text style={{ color: inMonth ? '#FFFFFF' : '#6A7A73', fontWeight: '800' }}>{d.getDate()}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ))}
        {/* streak strip removed for cleaner calendar view */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  headerIconBtn: { padding: 6, borderRadius: 10 },
  monthSwitcher: { flexDirection: 'row', alignItems: 'center' },
  arrowBtn: { padding: 6 },
  monthTitle: { fontSize: 18, fontWeight: '800', textTransform: 'capitalize' },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  weekDay: { width: '13.5%', textAlign: 'center', fontWeight: '700' },
  calendarBody: { position: 'relative' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  dayCell: { width: '13.5%', alignItems: 'center' },
  dayBubble: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  // streakStrip removed
});
