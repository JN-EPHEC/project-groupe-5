import { useUser } from "@/hooks/user-context";
import { useMemo } from "react";
import { ClassementUser } from "../types/classement";
import { getGreeniesForRank } from "../utils/rewardTable";
import { useCurrentCycle } from "./useCurrentCycle";
import { useLeagueUsers } from "./useLeagueUsers";

type UseClassementResult = {
  users: ClassementUser[];
  loading: boolean;
  cycleStatus: string | null;
};

export function useClassement(): UseClassementResult {
  const { user } = useUser();
  const { cycle, loading: cycleLoading } = useCurrentCycle();

  // MVP assumption: single league per cycle
  const leagueId = cycle ? "default" : null;

  const {
    users: rawUsers,
    loading: usersLoading,
  } = useLeagueUsers(cycle?.id ?? null, leagueId);

  const users = useMemo(() => {
    return rawUsers.map((u, index) => {
      const rank = index + 1;

      return {
        ...u,
        rank,
        isCurrentUser: u.userId === user?.uid,
        greeniesEarned:
          cycle?.status === "locked"
            ? getGreeniesForRank(rank)
            : undefined,
      };
    });
  }, [rawUsers, user?.uid, cycle?.status]);

  return {
    users,
    loading: cycleLoading || usersLoading,
    cycleStatus: cycle?.status ?? null,
  };
}
