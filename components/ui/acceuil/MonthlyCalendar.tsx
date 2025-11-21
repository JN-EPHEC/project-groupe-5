import type { ChallengeCategory } from "@/components/ui/defi/types";
import { useChallenges } from "@/hooks/challenges-context";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

function categoryIcon(category: ChallengeCategory): any {
  switch (category) {
    case "Recyclage":
      return "sync-outline";
    case "Local":
      return "home-outline";
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

function monthMeta(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days = last.getDate();
  // 0=Dimanche → on veut 0=Lundi
  const startOffset = (first.getDay() + 6) % 7;
  return { year, month, days, startOffset };
}

export function MonthlyCalendar({ initialMonth, embedded }: { initialMonth?: Date; embedded?: boolean }) {
  const { completed } = useChallenges();
  const { colors, mode } = useThemeMode();
  const [monthDate, setMonthDate] = useState<Date>(initialMonth ?? new Date());
  const meta = monthMeta(monthDate);

  const grid = useMemo(() => {
    const cells = meta.startOffset + meta.days;
    return Array.from({ length: cells }).map((_, idx) => {
      if (idx < meta.startOffset) return null; // cell vide
      const day = idx - meta.startOffset + 1;
      const dateStr = `${meta.year}-${String(meta.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const entry = completed.find((c) => c.date === dateStr);
      return { day, entry };
    });
  }, [completed, meta]);

  const weeks = Math.ceil((meta.startOffset + meta.days) / 7);

  // stats très simples
  const activitiesCount = completed.filter((c) => {
    const d = new Date(c.date);
    return d.getMonth() === meta.month && d.getFullYear() === meta.year;
  }).length;

  return (
    <View style={[embedded ? { backgroundColor: colors.surface, borderRadius: 16, padding: 16 } : { paddingHorizontal: 16, paddingBottom: 80 }]}>
      {/* En-tête mois + navigation */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => setMonthDate(new Date(meta.year, meta.month - 1, 1))}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.h1, { color: colors.text }]}>
          {new Date(meta.year, meta.month, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        </Text>
        <TouchableOpacity onPress={() => setMonthDate(new Date(meta.year, meta.month + 1, 1))}>
          <Ionicons name="chevron-forward" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={[styles.statsRow, embedded ? { marginTop: 4 } : null]}>
        <View>
          <Text style={[styles.kicker, { color: colors.mutedText }]}>Votre série d'activités</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{weeks} Semaines</Text>
        </View>
        <View>
          <Text style={[styles.kicker, { color: colors.mutedText }]}>Activités de la série d'activités</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{activitiesCount}</Text>
        </View>
      </View>

      <View style={styles.dowRow}>
        {["L","M","M","J","V","S","D"].map((d) => (
          <Text key={d} style={[styles.dow, { color: colors.mutedText }]}>{d}</Text>
        ))}
      </View>

      <View style={{ rowGap: 12 }}>
        {Array.from({ length: weeks }).map((_, w) => (
          <View key={w} style={styles.weekRow}>
            {Array.from({ length: 7 }).map((__, i) => {
              const idx = w * 7 + i;
              const cell = grid[idx];
              if (!cell) return <View key={i} style={[styles.cell, { borderColor: colors.text }]} />;
              const has = !!cell.entry;
              return (
                <View
                  key={i}
                  style={[
                    styles.cell,
                    {
                      backgroundColor: has ? (mode === "dark" ? "#0B1412" : "#0F3327") : colors.surface,
                      borderColor: mode === "dark" ? colors.mutedText : "#0F3327",
                    },
                  ]}
                >
                  {has ? (
                    <Ionicons name={categoryIcon(cell.entry!.category)} size={16} color={mode === "dark" ? colors.accent : "#FFFFFF"} />
                  ) : (
                    <Text style={[styles.dayNum, { color: colors.text }]}>{cell.day}</Text>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  h1: { fontSize: 18, fontWeight: "800", marginVertical: 8, textTransform: "capitalize" },
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  kicker: { },
  statValue: { fontSize: 18, fontWeight: "800" },
  dowRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, marginBottom: 8 },
  dow: { width: 40, textAlign: "center" },
  weekRow: { flexDirection: "row", justifyContent: "space-between" },
  cell: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  dayNum: { fontWeight: "700" },
});
