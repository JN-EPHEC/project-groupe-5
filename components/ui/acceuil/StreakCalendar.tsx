import { FontFamilies } from "@/constants/fonts";
import { useChallenges } from "@/hooks/challenges-context";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

// Fonction utilitaire pour obtenir les dates de la semaine (Lundi -> Dimanche)
function getWeekDates(): Date[] {
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // Lundi = 0
  const monday = new Date(now);
  monday.setDate(now.getDate() - day);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

// Formatage clé date (YYYY-MM-DD)
const formatDateKey = (date: Date) => date.toISOString().slice(0, 10);

const THEME = {
    glassBg: ["rgba(240, 253, 244, 0.95)", "rgba(255, 255, 255, 0.85)"] as const,
    title: "#0A3F33",
    border: "rgba(255, 255, 255, 0.6)",
};

export default function StreakCalendar() {
  const { colors, mode } = useThemeMode();
  const { activities } = useChallenges();
  const router = useRouter();
  
  const week = useMemo(() => getWeekDates(), []);
  const todayIndex = (new Date().getDay() + 6) % 7;
  const isLight = mode === "light";

  // 🔥 CALCUL DU STREAK (SÉRIE)
  const currentStreak = useMemo(() => {
    let streak = 0;
    const iterator = new Date();
    
    // 1. Vérification d'aujourd'hui
    const todayKey = formatDateKey(new Date());
    const todayActivity = activities[todayKey];
    
    // ✅ CORRECTION TS : On utilise (as any) pour accéder à .status
    const todayValid = todayActivity && (todayActivity as any).status === 'validated';
    
    if (todayValid) {
        streak++;
    }

    // 2. Remonter dans le passé (à partir d'hier)
    iterator.setDate(iterator.getDate() - 1); 
    
    while (true) {
        const key = formatDateKey(iterator);
        const act = activities[key];
        
        // ✅ CORRECTION TS
        const isValid = act && (act as any).status === 'validated';

        if (isValid) {
            streak++;
            iterator.setDate(iterator.getDate() - 1); // Jour précédent
        } else {
            break; // Série brisée
        }
    }

    return streak;
  }, [activities]);

  if (isLight) {
      return (
        <LinearGradient
            colors={THEME.glassBg}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.card, styles.glassEffect]}
        >
          {renderInner(true)}
        </LinearGradient>
      );
  }

  // Dark mode
  return (
    <LinearGradient
        colors={["rgba(0, 151, 178, 0.2)", "rgba(0, 151, 178, 0.05)"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.card, { borderColor: "rgba(0, 151, 178, 0.3)", borderWidth: 1 }]}
    >
      {renderInner(false)}
    </LinearGradient>
  );

  function renderInner(light: boolean) {
      return (
        <>
        <View style={styles.headerRow}>
            <Text style={[styles.title, { color: light ? THEME.title : colors.text }]}>Votre série d'activités</Text>
            <Text onPress={() => router.push("/calendar")} style={[styles.link, { color: light ? "#008F6B" : colors.accent }]}>Voir le calendrier</Text>
        </View>
        
        <View style={styles.contentRow}>
            <View style={[styles.flame, { backgroundColor: light ? "#FFF5F2" : colors.pill, borderColor: light ? "#FFE4DC" : colors.accent }]}>
                <Text style={[styles.flameCount, { color: light ? "#FF8C66" : colors.text, marginRight: 6 }]}>
                    {currentStreak}
                </Text>
                <Ionicons name="flame" size={18} color={light ? "#FF8C66" : colors.accent} />
            </View>

            <View style={{ flex: 1 }}>
                <View style={styles.daysRow}>
                    {['L','M','M','J','V','S','D'].map((d, i) => (
                        <View key={i} style={styles.col}>
                            <Text style={[styles.dayLabel, { color: light ? "#4A665F" : colors.mutedText }]}>{d}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.circlesRow}>
                    {week.map((date, i) => {
                        const isToday = i === todayIndex;
                        const key = formatDateKey(date);
                        
                        const activity = activities[key];
                        // ✅ CORRECTION TS
                        const isValidated = activity && (activity as any).status === 'validated';
                        
                        const bg = isValidated ? (light ? "#008F6B" : colors.accent) : "transparent";
                        
                        return (
                            <View key={i} style={styles.col}>
                                <View style={[
                                    styles.circle, 
                                    { 
                                        borderColor: light ? (isToday ? "#0A3F33" : "#E2E8F0") : "rgba(0, 151, 178, 0.3)", 
                                        backgroundColor: bg, 
                                        borderWidth: isToday ? 2 : (light && !isValidated ? 1 : 2) 
                                    }
                                ]}>
                                    {isValidated ? (
                                        <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                                    ) : (
                                        <Text style={[styles.circleText, { color: light ? "#0A3F33" : colors.text }]}>
                                            {String(date.getDate())}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>
            </View>
        </View>
        </>
      )
  }
}

const SIZE = 30;
const styles = StyleSheet.create({
  card: { borderRadius: 26, padding: 20, width: "100%" },
  glassEffect: { borderWidth: 1, borderColor: THEME.border, shadowColor: "#005c4b", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 18, fontFamily: FontFamilies.heading },
  link: { fontFamily: FontFamilies.heading, textDecorationLine: "underline" },
  contentRow: { flexDirection: "row", marginTop: 12, alignItems: "center" },
  flame: { width: 72, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 8, alignItems: "center", marginRight: 12, borderWidth: 1, flexDirection: 'row', justifyContent: 'center' },
  flameCount: { fontSize: 18, fontFamily: FontFamilies.heading },
  daysRow: { flexDirection: "row", justifyContent: 'space-between', marginBottom: 6 },
  col: { flex: 1, alignItems: 'center' },
  dayLabel: { fontFamily: FontFamilies.headingMedium, fontSize: 12 },
  circlesRow: { flexDirection: "row", justifyContent: 'space-between' },
  circle: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, justifyContent: "center", alignItems: "center" },
  circleText: { fontFamily: FontFamilies.heading, fontSize: 12 },
});