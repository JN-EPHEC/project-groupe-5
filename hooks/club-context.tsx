// hooks/club-context.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { db } from "@/firebaseConfig";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";

import { useUser } from "@/hooks/user-context";
import {
  createClub,
  deleteClub as deleteClubService,
  demoteOfficer,
  joinClub,
  leaveClub as leaveClubService,
  promoteOfficer,
  removeMember as removeMemberService,
  transferOwnership as transferOwnershipService,
  updateClubFirebase,
} from "@/services/clubs";

// TYPES
export type ClubVisibility = "public" | "private";

export type ClubInfo = {
  id: string;
  name: string;
  participants: number;
  desc?: string;
  visibility?: ClubVisibility;
  emoji?: string;
  photoUri?: string;
  city?: string;
  ownerId?: string;
  officers?: string[];
  logo?: string;
};

export type ClubMember = {
  id: string;
  name: string;
  avatar: string | null;
  points: number;
};

interface ClubContextType {
  joinedClub: ClubInfo | null;
  members: ClubMember[];
  createClub: (c: any) => Promise<ClubInfo | void>;
  joinClub: (clubId: string) => Promise<void>;
  leaveClub: (clubId?: string) => Promise<void>;
  updateClub: (data: any) => Promise<void>;
  promoteToOfficer: (uid: string) => Promise<void>;
  demoteOfficer: (uid: string) => Promise<void>;
  transferOwnership: (uid: string, clubId?: string) => Promise<void>;
  deleteClub: (clubId?: string) => Promise<void>;
  removeMember: (uid: string) => Promise<void>;
}

const ClubContext = createContext<ClubContextType>({
  joinedClub: null,
  members: [],
  createClub: async () => {},
  joinClub: async () => {},
  leaveClub: async () => {},
  updateClub: async () => {},
  promoteToOfficer: async () => {},
  demoteOfficer: async () => {},
  transferOwnership: async () => {},
  deleteClub: async () => {},
  removeMember: async () => {},
});

export const ClubProvider = ({ children }: { children: React.ReactNode }) => {
  const [joinedClub, setJoinedClub] = useState<ClubInfo | null>(null);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const { user } = useUser();
  const memberUnsubs = useRef<Record<string, () => void>>({});

  // Nettoyage des écouteurs membres
  const cleanupMemberListeners = () => {
    Object.values(memberUnsubs.current).forEach((unsub) => unsub());
    memberUnsubs.current = {};
    setMembers([]);
  };

  const detachMember = (uid: string) => {
    if (memberUnsubs.current[uid]) {
      memberUnsubs.current[uid]!();
      delete memberUnsubs.current[uid];
    }
    setMembers((prev) => prev.filter((member) => member.id !== uid));
  };

  const attachMember = (uid: string) => {
    if (memberUnsubs.current[uid]) return;

    // Placeholder pour éviter le saut visuel
    setMembers((prev) => {
      if (prev.some((m) => m.id === uid)) return prev;
      return [...prev, { id: uid, name: "...", avatar: null, points: 0 }];
    });

    const memberRef = doc(db, "users", uid);
    memberUnsubs.current[uid] = onSnapshot(memberRef, (snap) => {
      const data = snap.data();
      if (!data) {
        detachMember(uid);
        return;
      }
      const displayName = data.firstName || data.username || data.usernameLowercase || uid;
      const avatarUri = data.photoURL || data.avatar || data.photoUri || null;

      const nextMember: ClubMember = {
        id: uid,
        name: String(displayName),
        avatar: avatarUri,

        // use classement points if present
        points: typeof data.rankingPoints === "number"
          ? data.rankingPoints
          : (typeof data.points === "number" ? data.points : 0),
      };

      setMembers((prev) => {
        const others = prev.filter((m) => m.id !== uid);
        const next = [...others, nextMember];
        next.sort((a, b) => (b.points || 0) - (a.points || 0));
        return next;
      });
    });
  };

  const syncClubMembers = (ids: string[]) => {
    const uniqueIds = Array.from(new Set(ids.filter((id) => typeof id === "string" && id.length > 0)));
    Object.keys(memberUnsubs.current).forEach((trackedId) => {
      if (!uniqueIds.includes(trackedId)) detachMember(trackedId);
    });
    uniqueIds.forEach((uid) => attachMember(uid));
  };

  // Écouteur principal
  useEffect(() => {
    // Si déconnecté, on vide tout
    if (!user?.uid) {
      setJoinedClub(null);
      cleanupMemberListeners();
      return;
    }

    let unsubscribeClub: (() => void) | undefined;

    // Fonction interne pour s'abonner
    const subscribeToClubDoc = (clubId: string) => {
        return onSnapshot(doc(db, "clubs", clubId), (snap) => {
            const data: any = snap.data();
            if (!data) {
                // Le club n'existe plus ou erreur
                setJoinedClub(null);
                cleanupMemberListeners();
                return;
            }

            const memberIds: string[] = Array.isArray(data.members) ? data.members : [];

            setJoinedClub({
                id: clubId,
                name: data.name,
                desc: data.description ?? data.desc,
                city: data.city,
                photoUri: data.photoUrl,
                ownerId: data.ownerId,
                visibility: data.isPrivate ? 'private' : 'public',
                officers: data.officers || [],
                participants: memberIds.length,
                logo: data.logo,
            });

            syncClubMembers(memberIds);
        });
    };

    if (user.clubId) {
      // Cas 1: On a l'ID direct
      unsubscribeClub = subscribeToClubDoc(user.clubId);
    } else {
      // Cas 2: Fallback (recherche du club où on est membre)
      const q = query(collection(db, 'clubs'), where('members', 'array-contains', user.uid));
      const unsubQuery = onSnapshot(q, (snap) => {
        if (snap.docs.length > 0) {
          const foundClubId = snap.docs[0].id;
          if (unsubscribeClub) unsubscribeClub();
          unsubscribeClub = subscribeToClubDoc(foundClubId);
        } else {
          setJoinedClub(null);
          cleanupMemberListeners();
        }
      });
      // Cleanup spécial pour ce cas
      return () => {
          unsubQuery();
          if (unsubscribeClub) unsubscribeClub();
          cleanupMemberListeners();
      };
    }

    return () => {
      if (unsubscribeClub) unsubscribeClub();
      cleanupMemberListeners();
    };
  }, [user?.uid, user?.clubId]);

  const value: ClubContextType = {
    joinedClub,
    members,
    createClub: async (c) => {
      const created = await createClub(c.name, c.city, c.desc, c.photoUri, (c.visibility === 'private'));
      return { ...created, participants: 1 } as ClubInfo;
    },
    joinClub: async (clubId) => await joinClub(clubId),
    leaveClub: async (clubId) => {
      const targetId = clubId ?? joinedClub?.id;
      if (!targetId) return;
      
      try {
          await leaveClubService(targetId);
          // ✅ FORCER LE RESET LOCAL IMMÉDIATEMENT
          if (targetId === joinedClub?.id) {
              setJoinedClub(null);
              setMembers([]);
          }
      } catch (e) {
          throw e;
      }
    },
    updateClub: async (data) => {
      if (!joinedClub?.id) return;
      await updateClubFirebase(joinedClub.id, {
        name: data.name,
        description: data.desc,
        city: data.city,
        photoUri: data.photoUri,
        isPrivate: (data as any).visibility === 'private',
      });
    },
    promoteToOfficer: async (uid) => { if (joinedClub?.id) await promoteOfficer(joinedClub.id, uid); },
    demoteOfficer: async (uid) => { if (joinedClub?.id) await demoteOfficer(joinedClub.id, uid); },
    transferOwnership: async (uid, clubId) => {
      const targetId = clubId ?? joinedClub?.id;
      if (targetId) await transferOwnershipService(targetId, uid);
    },
    deleteClub: async (clubId) => {
      const targetId = clubId ?? joinedClub?.id;
      if (targetId) { await deleteClubService(targetId); setJoinedClub(null); }
    },
    removeMember: async (uid) => {
        if (joinedClub?.id) await removeMemberService(joinedClub.id, uid);
    }
  };

  return <ClubContext.Provider value={value}>{children}</ClubContext.Provider>;
};

export const useClub = () => useContext(ClubContext);