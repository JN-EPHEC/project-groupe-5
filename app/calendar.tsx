import { FontFamilies } from "@/constants/fonts";
import { useChallenges } from "@/hooks/challenges-context";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// 🎨 THEME CALENDAR HARMONISÉ
const calendarTheme = {
  // Light : Menthe Givrée
  light: {
    bgGradient: ["#DDF7E8", "#F4FDF9"] as const,
    glassCardBg: ["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.6)"] as const,
    glassBorder: "rgba(255, 255, 255, 0.8)",
    accent: "#008F6B",
    textMain: "#0A3F33",
    textMuted: "#4A665F",
    bubbleActive: "#008F6B",
    bubbleTodayBorder: "#FF8C66",
    statBg: ["rgba(255,255,255,0.8)", "rgba(255,255,255,0.4)"] as const
  },
  // Dark : Nuit Émeraude (Harmonisé avec Acceuil)
  dark: {
    bgGradient: ["#021114", "#0F3327"] as const, // Dégradé profond au lieu de noir pur
    glassCardBg: ["rgba(0, 151, 178, 0.15)", "rgba(0, 151, 178, 0.05)"] as const,
    glassBorder: "rgba(0, 151, 178, 0.3)",
    accent: "#0097B2", // Bleu lagon
    textMain: "#E6FFF5",
    textMuted: "#8AA39C",
    bubbleActive: "#0097B2",
    bubbleTodayBorder: "#FF8C66",
    statBg: ["rgba(0, 151, 178, 0.15)", "rgba(0, 151, 178, 0.05)"] as const
  }
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
  const months = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

export default function CalendarScreen() {
  const { mode } = useThemeMode();
  const { activities } = useChallenges();
  const router = useRouter();
  const isLight = mode === "light";
  const theme = isLight ? calendarTheme.light : calendarTheme.dark;

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
        const key = d.toISOString().slice(0, 10);
        const act = activities[key];
        return act && (act as any).status === 'validated';
    })
    .length;

  // Calcul Streak (Placeholder)
  const currentStreak = useMemo(() => {
      return 0; 
  }, [activities]);

  // Découpage en semaines
  const weeks = [] as Date[][];
  for (let i = 0; i < grid.length; i += 7) weeks.push(grid.slice(i, i + 7));
  
  return (
    <View style={{ flex: 1 }}>
      {/* FOND DÉGRADÉ HARMONISÉ */}
      <LinearGradient 
        colors={theme.bgGradient} 
        style={StyleSheet.absoluteFill} 
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* HEADER */}
        <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={theme.textMain} />
            </TouchableOpacity>
            
            <View style={[styles.monthSwitcher, { backgroundColor: isLight ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.3)", borderColor: theme.glassBorder, borderWidth: isLight ? 0 : 1 }]}>
                <TouchableOpacity onPress={() => setDisplayDate(d => { const n = new Date(d); n.setMonth(d.getMonth()-1); return n; })} style={styles.arrowBtn}>
                    <Ionicons name="chevron-back" size={20} color={theme.textMain} />
                </TouchableOpacity>
                <Text style={[styles.monthTitle, { color: theme.textMain }]}>{monthName}</Text>
                <TouchableOpacity onPress={() => setDisplayDate(d => { const n = new Date(d); n.setMonth(d.getMonth()+1); return n; })} style={styles.arrowBtn}>
                    <Ionicons name="chevron-forward" size={20} color={theme.textMain} />
                </TouchableOpacity>
            </View>
            
            <View style={{ width: 40 }} /> 
        </View>

        {/* STATS */}
        <View style={styles.statsContainer}>
            <LinearGradient
                colors={theme.statBg}
                style={[styles.statBox, { borderColor: theme.glassBorder }]}
            >
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>Série actuelle</Text>
                <Text style={[styles.statValue, { color: theme.accent }]}>-- <Text style={{ fontSize: 14 }}>jours</Text></Text>
            </LinearGradient>
            
            <LinearGradient
                colors={theme.statBg}
                style={[styles.statBox, { borderColor: theme.glassBorder }]}
            >
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>Activités ce mois</Text>
                <Text style={[styles.statValue, { color: theme.textMain }]}>{activeDaysThisMonth}</Text>
            </LinearGradient>
        </View>

        {/* CALENDRIER */}
        <LinearGradient
            colors={theme.glassCardBg}
            style={[styles.calendarCard, { borderColor: theme.glassBorder }]}
        >
            <View style={styles.weekHeader}>
                {/* ✅ CORRECTION ICI : On utilise l'index 'i' comme clé pour éviter les doublons 'M' */}
                {['L','M','M','J','V','S','D'].map((d, i) => (
                    <Text key={i} style={[styles.weekDay, { color: theme.textMuted }]}>{d}</Text>
                ))}
            </View>

            {weeks.map((week, wi) => (
                <View key={wi} style={styles.weekRow}>
                    {week.map((d, di) => {
                        const key = d.toISOString().slice(0,10);
                        const inMonth = d.getMonth() === monthIndex;
                        const isToday = d.toDateString() === today.toDateString();
                        
                        const activity = activities[key];
                        // Validation stricte
                        const isValidated = activity && (activity as any).status === 'validated';

                        return (
                            <View key={di} style={styles.dayCell}> 
                                <View 
                                    style={[
                                        styles.dayBubble, 
                                        { 
                                            backgroundColor: isValidated ? theme.bubbleActive : 'transparent',
                                            borderColor: isToday ? theme.bubbleTodayBorder : 'transparent',
                                            borderWidth: isToday ? 2 : 0,
                                            opacity: inMonth ? 1 : 0.3
                                        }
                                    ]}
                                > 
                                    {isValidated ? (
                                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                    ) : (
                                        <Text style={{ 
                                            color: inMonth ? theme.textMain : theme.textMuted, 
                                            fontWeight: isToday ? '800' : '500' 
                                        }}>
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
  
  monthSwitcher: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 4 },
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