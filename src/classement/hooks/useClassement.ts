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

  // ✅ 1. On récupère tes infos LIVE du contexte
  const { user } = useUser();

  const users = useMemo(() => {
    if (!cycle) return [];

    // 1. Rank real users
    let ranked: ClassementUser[] = realUsers.map((u, idx) => {
      const rank = idx + 1;
      const isMe = u.uid === user?.uid;

      // ✅ 2. FUSION MAGIQUE : Si c'est toi, on écrase avec les données du contexte
      if (isMe && user) {
        // Construction robuste du nom (comme dans Social/Header)
        const liveDisplayName = 
            user.username || 
            [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || 
            u.displayName || 
            "Moi";

        return {
          ...u,
          rank,
          qualified: u.qualified ?? false,
          isCurrentUser: true,
          greeniesEarned: cycle.status === "locked" ? getGreeniesForRank(rank) : undefined,
          
          // 👇 DONNÉES LIVE DU CONTEXTE
          displayName: liveDisplayName,
          avatarUrl: user.photoURL || null, 
          // On force la couleur du contexte, ou le vert par défaut
          avatarColor: user.avatarColor || "#19D07D", 
        } as ClassementUser;
      }

      // POUR LES AUTRES UTILISATEURS
      return {
        ...u,
        rank,
        qualified: u.qualified ?? false,
        isCurrentUser: false,
        greeniesEarned: cycle.status === "locked" ? getGreeniesForRank(rank) : undefined,
        // On récupère la couleur si elle a été chargée par useLeagueUsers, sinon vert
        avatarColor: (u as any).avatarColor || "#19D07D", 
      } as ClassementUser;
    });

    // 2. Add fake users to reach 50 total
    const total = 50;
    if (ranked.length < total) {
      const fake = generateFakeUsers(total - ranked.length, ranked.length);
      ranked = [...ranked, ...fake];
    }

    return ranked;
  }, [realUsers, user, cycle]); 

  return {
    users,
    loading: cycleLoading || usersLoading,
    cycleStatus: cycle?.status ?? null,
  };
}