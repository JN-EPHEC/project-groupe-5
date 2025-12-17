// src/classement/hooks/useLeagueUsers.ts
import { db } from "@/firebaseConfig";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { ClassementUser } from "../types/classement";

export function useLeagueUsers(
  cycleId: string | null,
  classementId: string
) {
  const [users, setUsers] = useState<ClassementUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cycleId) {
      setUsers([]);
      setLoading(false);
      return;
    }

    const ref = collection(
      db,
      "classementCycles",
      cycleId,
      "classements",
      classementId,
      "users"
    );

    const q = query(ref, orderBy("rankingPoints", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      const list: ClassementUser[] = snap.docs.map((d) => {
        const data = d.data();

        return {
          uid: d.id,
          displayName: data.displayName ?? "Utilisateur",
          avatarUrl: data.avatarUrl,
          rankingPoints: data.rankingPoints ?? 0,
          qualified: data.qualified ?? false,
        };
      });
      setUsers(list);
      setLoading(false);
    });

    return () => unsub();
  }, [cycleId, classementId]);

  return { users, loading };
}
