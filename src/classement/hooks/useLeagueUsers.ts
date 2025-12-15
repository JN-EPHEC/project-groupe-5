import { db } from "@/firebaseConfig";
import {
    collection,
    onSnapshot,
    orderBy,
    query,
    where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { ClassementUser } from "../types/classement";

type UseLeagueUsersResult = {
  users: ClassementUser[];
  loading: boolean;
};

export function useLeagueUsers(
  cycleId: string | null,
  leagueId: string | null
): UseLeagueUsersResult {
  const [users, setUsers] = useState<ClassementUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cycleId || !leagueId) {
      setUsers([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "classementUsers"),
      where("cycleId", "==", cycleId),
      where("leagueId", "==", leagueId),
      orderBy("rankingPoints", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: ClassementUser[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          userId: d.id,
          displayName: data.displayName,
          avatarUrl: data.avatarUrl,
          rankingPoints: data.rankingPoints ?? 0,
          qualified: data.qualified ?? false,
          greeniesEarned: data.greeniesEarned,
        };
      });

      setUsers(list);
      setLoading(false);
    });

    return () => unsub();
  }, [cycleId, leagueId]);

  return { users, loading };
}
