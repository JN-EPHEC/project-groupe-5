// src/classement/hooks/useCurrentCycle.ts
import { db } from "@/firebaseConfig";
import {
  collection,
  limit,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { ensureCurrentClassementCycle } from "../services/classementLifecycle";
import { ClassementCycle } from "../types/classement";

type UseCurrentCycleResult = {
  cycle: ClassementCycle | null;
  loading: boolean;
};

export function useCurrentCycle(): UseCurrentCycleResult {
  const [cycle, setCycle] = useState<ClassementCycle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    const init = async () => {
      try {
        // 🧠 Make sure a cycle exists for the current 2-week window
        await ensureCurrentClassementCycle();
      } catch (err) {
        console.error("Failed to ensure current classement cycle:", err);
        // Even if it fails, we still try to listen, in case a doc already exists
      }

      const q = query(
        collection(db, "classementCycles"),
        where("status", "in", ["active", "locking"]),
        limit(1)
      );

      unsub = onSnapshot(
        q,
        (snap) => {
          if (snap.empty) {
            setCycle(null);
            setLoading(false);
            return;
          }

          const docSnap = snap.docs[0];
          const data = docSnap.data();

          setCycle({
            id: docSnap.id,
            startAt: data.startAt.toDate(),
            endAt: data.endAt.toDate(),
            status: data.status,
          });
          setLoading(false);
        },
        (err) => {
          console.error("Error listening to classementCycles:", err);
          setCycle(null);
          setLoading(false);
        }
      );
    };

    init();

    return () => {
      if (unsub) unsub();
    };
  }, []);

  return { cycle, loading };
}
