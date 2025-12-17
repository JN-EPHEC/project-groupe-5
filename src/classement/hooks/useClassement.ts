// src/classement/hooks/useClassement.ts
import { useUser } from "@/hooks/user-context";
import { useMemo } from "react";
import { generateFakeUsers } from "../services/populateClassement";
import { ClassementUser } from "../types/classement";
import { getGreeniesForRank } from "../utils/rewardTable";
import { useCurrentCycle } from "./useCurrentCycle";
import { useLeagueUsers } from "./useLeagueUsers";

export function useClassement() {
  const classementId = "1"; // ONE league for now

  const { cycle, loading: cycleLoading } = useCurrentCycle();
  const cycleId = cycle?.id ?? null;

  const { users: realUsers, loading: usersLoading } =
    useLeagueUsers(cycleId, classementId);

  const { user } = useUser();

  const users = useMemo(() => {
    if (!cycle) return [];

    // 1. Rank real users
    let ranked: ClassementUser[] = realUsers.map((u, idx) => {
      const rank = idx + 1;
      return {
        ...u,
        rank,
        isCurrentUser: u.uid === user?.uid,
        greeniesEarned:
          cycle.status === "locked" ? getGreeniesForRank(rank) : undefined,
      };
    });

    // 2. Add fake users to reach 50 total
    const total = 50;
    if (ranked.length < total) {
      const fake = generateFakeUsers(total - ranked.length, ranked.length);
      ranked = [...ranked, ...fake];
    }

    return ranked;
  }, [realUsers, user?.uid, cycle]);

  return {
    users,
    loading: cycleLoading || usersLoading,
    cycleStatus: cycle?.status ?? null,
  };
}
