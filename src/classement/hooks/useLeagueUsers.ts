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
          // Priorité : username > prénom+nom > nom stocké dans le classement > "Utilisateur"
          const displayName = 
            profile.username || 
            [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() || 
            p.displayName || 
            "Utilisateur";

          return {
            uid: p.uid,
            // Les points et la qualif viennent du classement (cycle)
            rankingPoints: p.rankingPoints ?? 0,
            qualified: p.qualified ?? false,
            
            // Le style vient du profil utilisateur (global)
            displayName: displayName,
            avatarUrl: profile.photoURL || p.avatarUrl || null,
            avatarColor: profile.avatarColor || "#19D07D", // ✅ Récupération de la couleur perso
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