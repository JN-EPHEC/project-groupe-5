import { db } from "@/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

import { useUser } from "@/hooks/user-context";
import { useClassement } from "@/src/classement/hooks/useClassement";

type MaybeLegacyUser = {
  rankingPoints?: number;
  points?: number;
};

export type ClubClassementEntry = {
  id: string;
  name: string;
  pts: number;
  avatar: string;
  isMine?: boolean;
};

export function useClubClassement() {
  const { user } = useUser();

  // personal classement users including points
  const { users: classementUsers } = useClassement();

  const [clubs, setClubs] = useState<any[]>([]);

  // 🔹 Load ALL clubs from Firestore
  useEffect(() => {
    const fetchClubs = async () => {
      const snap = await getDocs(collection(db, "clubs"));

      const clubList: any[] = [];

      for (const clubDoc of snap.docs) {
        const data = clubDoc.data();

        // 🔸 fetch members subcollection if exists
        let members: string[] = [];

        try {
          const membersSnap = await getDocs(
            collection(db, "clubs", clubDoc.id, "members")
          );

          members = membersSnap.docs.map((m) => m.id);
        } catch {
          // fallback if you store memberIds array in doc
          members = data.memberIds || [];
        }

        clubList.push({
          id: clubDoc.id,
          name: data.name || "Club sans nom",
          avatar:
            data.logo ||
            `https://api.dicebear.com/8.x/shapes/svg?seed=${encodeURIComponent(
              data.name || clubDoc.id
            )}`,
          members,
        });
      }

      setClubs(clubList);
    };

    fetchClubs();
  }, []);

  // 🧮 compute points per club
  const ranked = useMemo<ClubClassementEntry[]>(() => {
    if (!clubs.length) return [];

    return clubs
      .map((club) => {
        // sum points of all members from classement data
        const totalPts = classementUsers
          .filter((u) => club.members.includes(u.uid))
          .reduce((sum, u) => {
            const user = u as MaybeLegacyUser;
            return sum + (user.rankingPoints ?? user.points ?? 0);
        }, 0);
        return {
          id: club.id,
          name: club.name,
          avatar: club.avatar,
          pts: totalPts,
          isMine: club.members.includes(user?.uid || ""),
        };
      })
      .sort((a, b) => b.pts - a.pts);
  }, [clubs, classementUsers, user?.uid]);

  return ranked;
}
