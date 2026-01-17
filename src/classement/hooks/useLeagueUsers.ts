import { db } from "@/firebaseConfig";
import {
    collection,
    doc,
    getDoc,
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

    // On récupère la liste triée par points
    const q = query(ref, orderBy("rankingPoints", "desc"));

    const unsub = onSnapshot(q, async (snap) => {
      // 1. On récupère les données brutes du classement (Points & Rang)
      const rawParticipants = snap.docs.map((d) => ({
        uid: d.id,
        ...d.data(),
      }));

      // 2. On enrichit chaque participant avec ses données 'users' (Pseudo, Couleur, Photo)
      // Cela permet d'avoir les données à jour même si le doc du classement est vieux
      const enrichedUsers = await Promise.all(
        rawParticipants.map(async (p: any) => {
          let profile: any = {};
          try {
            // Récupération des infos fraîches du profil public
            const userSnap = await getDoc(doc(db, "users", p.uid));
            if (userSnap.exists()) {
              profile = userSnap.data();
            }
          } catch (e) {
            console.warn("Erreur fetch profil user", p.uid);
          }

          // Construction robuste du nom d'affichage
          const displayName =
            profile.username ||
            [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() ||
            p.displayName ||
            "Utilisateur";

          // Logique harmonisée pour avatarUrl, avatarColor, initials
          const avatarUrl = (typeof profile.photoURL === 'string' && profile.photoURL.length > 0)
            ? profile.photoURL
            : (typeof p.avatarUrl === 'string' && p.avatarUrl.length > 0)
              ? p.avatarUrl
              : null;

          const avatarColor = profile.avatarColor || p.avatarColor || "#19D07D";
          const isWhiteBg = ["#FFFFFF", "#ffffff", "#fff", "#FFF"].includes(avatarColor);

          // Initiales robustes : si pas de photo, calculer à partir du nom
          let initials = "";
          if (!avatarUrl) {
            initials = displayName
              .trim()
              .split(/\s+/)
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);
          }

          return {
            uid: p.uid,
            rankingPoints: p.rankingPoints ?? 0,
            qualified: p.qualified ?? false,
            displayName,
            avatarUrl,
            avatarColor,
            isWhiteBg,
            initials,
          } as ClassementUser;
        })
      );

      // 3. On met à jour l'état (le tri est conservé car map respecte l'ordre)
      setUsers(enrichedUsers);
      setLoading(false);
    });

    return () => unsub();
  }, [cycleId, classementId]);

  return { users, loading };
}