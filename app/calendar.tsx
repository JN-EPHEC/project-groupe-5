// app/calendar.tsx
import { FontFamilies } from "@/constants/fonts";
import { useThemeMode } from "@/hooks/theme-context";
import { useStreaks } from "@/hooks/use-streaks";
import { getBelgiumDateKey } from "@/utils/dateKey";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// 🎨 THEME CALENDAR
const calendarTheme = {
    bgGradient: ["#DDF7E8", "#F4FDF9"] as const,
    glassCardBg: ["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.6)"] as const,
    glassBorder: "rgba(255, 255, 255, 0.8)",
    accent: "#008F6B", // Vert Marque
    textMain: "#0A3F33", 
    textMuted: "#4A665F",
    bubbleActive: "#008F6B",
    bubbleTodayBorder: "#FF8C66" // Corail pour aujourd'hui
};

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
  const { colors, mode } = useThemeMode();
  const { days: activities } = useStreaks();
  const router = useRouter();
  const isLight = mode === "light";

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

  // Calcul du nombre de jours validés ce mois-ci
  const activeDaysThisMonth = grid
    .filter((d) => d.getMonth() === monthIndex)
    .filter((d) => {
        const key = getBelgiumDateKey(d);
        return !!activities[key];
    })
    .length;


  // Calcul Streak (Logique simplifiée pour l'affichage, à connecter au vrai calcul si besoin)
  // Ici on laisse 0 pour l'instant ou on peut reprendre la logique de StreakCalendar si on veut l'afficher ici
  let streakWeeks = 0; 

  // Découpage en semaines pour l'affichage
  const weeks = [] as Date[][];
  for (let i = 0; i < grid.length; i += 7) weeks.push(grid.slice(i, i + 7));
  
  // Couleurs dynamiques
  const titleColor = isLight ? calendarTheme.textMain : colors.text;
  const textColor = isLight ? calendarTheme.textMuted : colors.mutedText;
  const accentColor = isLight ? calendarTheme.accent : colors.accent;

  // Wrapper Fond
  const BackgroundComponent = isLight ? LinearGradient : View;
  const bgProps = isLight 
    ? { colors: calendarTheme.bgGradient, style: StyleSheet.absoluteFill } 
    : { style: [StyleSheet.absoluteFill, { backgroundColor: "#021114" }] };

  return (
    <View style={{ flex: 1 }}>
      <BackgroundComponent {...(bgProps as any)} />

      <SafeAreaView style={styles.safeArea}>
        {/* HEADER */}
        <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={titleColor} />
            </TouchableOpacity>
            <View style={styles.monthSwitcher}>
                <TouchableOpacity onPress={() => setDisplayDate(d => { const n = new Date(d); n.setMonth(d.getMonth()-1); return n; })} style={styles.arrowBtn}>
                    <Ionicons name="chevron-back" size={20} color={titleColor} />
                </TouchableOpacity>
                <Text style={[styles.monthTitle, { color: titleColor }]}>{monthName}</Text>
                <TouchableOpacity onPress={() => setDisplayDate(d => { const n = new Date(d); n.setMonth(d.getMonth()+1); return n; })} style={styles.arrowBtn}>
                    <Ionicons name="chevron-forward" size={20} color={titleColor} />
                </TouchableOpacity>
            </View>
            <View style={{ width: 40 }} /> 
        </View>

        {/* STATS */}
        <View style={styles.statsContainer}>
            <LinearGradient
                colors={isLight ? ["rgba(255,255,255,0.8)", "rgba(255,255,255,0.4)"] : ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
                style={[styles.statBox, { borderColor: isLight ? calendarTheme.glassBorder : "rgba(255,255,255,0.1)" }]}
            >
                <Text style={[styles.statLabel, { color: textColor }]}>Série actuelle</Text>
                {/* On pourra connecter le vrai streak ici plus tard */}
                <Text style={[styles.statValue, { color: accentColor }]}>-- <Text style={{ fontSize: 14 }}>jours</Text></Text>
            </LinearGradient>
            <LinearGradient
                colors={isLight ? ["rgba(255,255,255,0.8)", "rgba(255,255,255,0.4)"] : ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
                style={[styles.statBox, { borderColor: isLight ? calendarTheme.glassBorder : "rgba(255,255,255,0.1)" }]}
            >
                <Text style={[styles.statLabel, { color: textColor }]}>Activités ce mois</Text>
                <Text style={[styles.statValue, { color: titleColor }]}>{activeDaysThisMonth}</Text>
            </LinearGradient>
        </View>

        {/* CALENDRIER */}
        <LinearGradient
            colors={isLight ? calendarTheme.glassCardBg : ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]}
            style={[styles.calendarCard, { borderColor: isLight ? calendarTheme.glassBorder : "rgba(255,255,255,0.1)" }]}
        >
            <View style={styles.weekHeader}>
                {['L','M','M','J','V','S','D'].map((d) => (
                    <Text key={d} style={[styles.weekDay, { color: textColor }]}>{d}</Text>
                ))}
            </View>

            {weeks.map((week, wi) => (
                <View key={wi} style={styles.weekRow}>
                    {week.map((d, di) => {
                        const key = getBelgiumDateKey(d);
                        const inMonth = d.getMonth() === monthIndex;
                        const isToday = d.toDateString() === today.toDateString();

                        const isValidated = !!activities[key];
                        return (
                            <View key={di} style={styles.dayCell}> 
                                <View 
                                    style={[
                                        styles.dayBubble, 
                                        { 
                                            backgroundColor: isValidated ? (isLight ? calendarTheme.bubbleActive : accentColor) : 'transparent',
                                            borderColor: isToday ? calendarTheme.bubbleTodayBorder : 'transparent',
                                            borderWidth: isToday ? 2 : 0,
                                            opacity: inMonth ? 1 : 0.3
                                        }
                                    ]}
                                > 
                                    {/* ✅ Icône Checkmark si validé */}
                                    {isValidated ? (
                                        <Ionicons 
                                            name="checkmark" 
                                            size={16} 
                                            color="#FFFFFF" 
                                        />
                                    ) : (
                                        <Text style={{ color: inMonth ? titleColor : textColor, fontWeight: isToday ? '800' : '500' }}>
                                            {d.getDate()}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>
            ))}
        </LinearGradient>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, paddingHorizontal: 20 },
  
  headerRow: { 
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
      marginBottom: 20, marginTop: 10 
  },
  backBtn: { padding: 8, borderRadius: 12 },
  
  monthSwitcher: { flexDirection: 'row', alignItems: 'center', backgroundColor: "rgba(255,255,255,0.5)", borderRadius: 20, padding: 4 },
  arrowBtn: { padding: 8 },
  monthTitle: { fontSize: 16, fontWeight: '700', textTransform: 'capitalize', marginHorizontal: 10, fontFamily: FontFamilies.heading },

  statsContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statBox: { 
      flex: 1, padding: 16, borderRadius: 20, borderWidth: 1,
      alignItems: 'center', justifyContent: 'center'
  },
  statLabel: { fontSize: 12, marginBottom: 4, fontFamily: FontFamilies.body },
  statValue: { fontSize: 20, fontWeight: '800', fontFamily: FontFamilies.heading },

  calendarCard: {
      padding: 16, borderRadius: 24, borderWidth: 1,
      shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 4
  },
  
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  weekDay: { width: '13.5%', textAlign: 'center', fontWeight: '700', fontSize: 12 },
  
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  dayCell: { width: '13.5%', alignItems: 'center' },
  dayBubble: { 
      width: 36, height: 36, borderRadius: 18, 
      justifyContent: 'center', alignItems: 'center' 
  },
});