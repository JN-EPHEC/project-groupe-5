import type { ChallengeCategory } from "@/components/ui/defi/types";
import { useChallenges } from "@/hooks/challenges-context";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const daysLabels = ["L", "M", "M", "J", "V", "S", "D"];

function categoryIcon(category: ChallengeCategory): any {
  switch (category) {
    case "Recyclage":
      return "sync-outline"; // approximatif pour l'icône "roue recyclage"
    case "Local":
      // Ionicons ne propose pas toujours "storefront" selon la version; fallback simple
      return "home-outline" as any;
    case "Transports":
      return "bicycle-outline";
    case "Tri":
      return "trash-outline";
    case "Sensibilisation":
      return "megaphone-outline";
    default:
      return "leaf-outline";
  }
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // 0=Lundi
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function StreakStrip({ onOpenCalendar }: { onOpenCalendar: () => void }) {
  const { colors, mode } = useThemeMode();
  const { completed } = useChallenges();

  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date());
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const entry = completed.find((c) => c.date === key);
      return { date: d, label: daysLabels[i], entry };
    });
  }, [completed]);

  const streakWeeks = useMemo(() => {
    // streak simple: nombre de semaines consécutives avec >=1 activité
    let count = 0;
    const today = new Date();
    let cursor = startOfWeek(today);
    while (true) {
      const end = new Date(cursor); end.setDate(cursor.getDate() + 6);
      const has = completed.some((c) => {
        const d = new Date(c.date);
        return d >= cursor && d <= end;
      });
      if (has) { count++; cursor = new Date(cursor); cursor.setDate(cursor.getDate() - 7); }
      else break;
    }
    return count;
  }, [completed]);

  return (
    <View style={[styles.block]}>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>Votre série d'activités</Text>
        <TouchableOpacity onPress={onOpenCalendar}><Text style={[styles.link]}>Voir le calendrier</Text></TouchableOpacity>
      </View>
      <View style={styles.row}>        
        <View style={styles.flame}><Text style={styles.flameText}>{streakWeeks}</Text></View>
        <View style={{ flex: 1, flexDirection: "row", justifyContent: "space-between" }}>
          {weekDays.map((d, idx) => (
            <View key={idx} style={[styles.day]}>              
                <Text style={[styles.dayLabel, { color: colors.mutedText }]}>{d.label}</Text>
                <View style={[styles.circle, { backgroundColor: d.entry ? "#FFFFFF" : "transparent", borderColor: "#0F3327" }]}>                
                {d.entry ? (
                  <Ionicons name={categoryIcon(d.entry.category)} size={16} color="#fff" />
                ) : (
                    <Text style={[styles.dateNum, { color: colors.mutedText }]}>{d.date.getDate()}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { marginTop: 10 },
  card: { marginTop: 10, borderRadius: 16, padding: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  title: { fontWeight: "700", fontSize: 16 },
  link: { color: "#19D07D", fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center" },
  flame: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#19D07D", justifyContent: "center", alignItems: "center", marginRight: 12 },
  flameText: { color: "#fff", fontWeight: "900", fontSize: 18 },
  day: { alignItems: "center", width: 36 },
  dayLabel: { marginBottom: 6 },
  circle: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  dateNum: { fontWeight: "700" },
});
