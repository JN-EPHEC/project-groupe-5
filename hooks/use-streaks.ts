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
    let streak = 0;

    const iterator = new Date();

    // walk backwards day by day
    while (true) {
      const key = getBelgiumDateKey(iterator);

      if (days[key]) {
        streak++;
        iterator.setDate(iterator.getDate() - 1);
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
