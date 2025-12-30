// hooks/use-streaks.ts
import { auth } from "@/firebaseConfig";
import { addStreakDayFromStartedAt, StreakMap, subscribeToStreakDays } from "@/services/streaks";
import { getBelgiumDateKey } from "@/utils/dateKey";
import { useEffect, useMemo, useState } from "react";

export function useStreaks() {
  const [days, setDays] = useState<StreakMap>({});

  // 🔔 live Firestore subscription
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const unsub = subscribeToStreakDays(uid, setDays);
    return () => unsub();
  }, []);

  // 🔥 compute current streak length
  const currentStreak = useMemo(() => {
    if (!days || Object.keys(days).length === 0) return 0;

    // Start from "today if done", otherwise "yesterday"
    const cursor = new Date();
    const todayKey = getBelgiumDateKey(cursor);

    if (!days[todayKey]) {
      cursor.setDate(cursor.getDate() - 1);
    }

    let streak = 0;

    while (true) {
      const key = getBelgiumDateKey(cursor);

      if (days[key]) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }, [days]);

  return {
    days,
    currentStreak,
    addStreakDayFromStartedAt,
  };
}
