import { db } from "@/firebaseConfig";
import { collection, limit, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ClassementCycle } from "../types/classement";

type UseCurrentCycleResult = {
  cycle: ClassementCycle | null;
  loading: boolean;
};

export function useCurrentCycle(): UseCurrentCycleResult {
  const [cycle, setCycle] = useState<ClassementCycle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "classementCycles"),
      where("status", "in", ["active", "locking"]),
      limit(1)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (snap.empty) {
        setCycle(null);
        setLoading(false);
        return;
      }

      const doc = snap.docs[0];
      const data = doc.data();

      setCycle({
        id: doc.id,
        startAt: data.startAt.toDate(),
        endAt: data.endAt.toDate(),
        status: data.status,
      });

      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { cycle, loading };
}
