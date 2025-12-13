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
    transferOwnership as transferOwnershipService,
    updateClubFirebase,
} from "@/services/clubs";

// -------------------------------------------------------------
// TYPES
// -------------------------------------------------------------
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

// This is the ONLY ClubContextType we keep
interface ClubContextType {
  joinedClub: ClubInfo | null;
  members: ClubMember[];

  // all async to match your current usage
  createClub: (c: {
    name: string;
    desc: string;
    visibility: ClubVisibility;
    emoji?: string;
    photoUri?: string;
    city: string;
  }) => Promise<ClubInfo | void>;

  joinClub: (clubId: string) => Promise<void>;
  leaveClub: (clubId?: string) => Promise<void>;

  updateClub: (
    data: Partial<Omit<ClubInfo, "id" | "participants">>
  ) => Promise<void>;

  promoteToOfficer: (uid: string) => Promise<void>;
  demoteOfficer: (uid: string) => Promise<void>;
  transferOwnership: (uid: string, clubId?: string) => Promise<void>;
  deleteClub: (clubId?: string) => Promise<void>;
}

// -------------------------------------------------------------
// CONTEXT + DEFAULT VALUE
// -------------------------------------------------------------
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
});

// -------------------------------------------------------------
// PROVIDER
// -------------------------------------------------------------
export const ClubProvider = ({ children }: { children: React.ReactNode }) => {
  const [joinedClub, setJoinedClub] = useState<ClubInfo | null>(null);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const { user } = useUser();
  const memberUnsubs = useRef<Record<string, () => void>>({});

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

    // placeholder entry to keep ordering while profile loads
    setMembers((prev) => {
      if (prev.some((m) => m.id === uid)) return prev;
      const placeholder: ClubMember = {
        id: uid,
        name: "Membre",
        avatar: null,
        points: 0,
      };
      const next = [...prev, placeholder];
      next.sort((a, b) => (b.points || 0) - (a.points || 0));
      return next;
    });

    const memberRef = doc(db, "users", uid);
    memberUnsubs.current[uid] = onSnapshot(memberRef, (snap) => {
      const data = snap.data();
      if (!data) {
        detachMember(uid);
        return;
      }

      const displayName =
        data.firstName ||
        data.username ||
        data.usernameLowercase ||
        data.displayName ||
        uid;

      const avatarUri =
        typeof data.photoURL === "string" && data.photoURL.length > 0
          ? data.photoURL
          : typeof data.avatar === "string" && data.avatar.length > 0
          ? data.avatar
          : null;

      const nextMember: ClubMember = {
        id: uid,
        name: String(displayName),
        avatar: avatarUri,
        points: typeof data.points === "number" ? data.points : 0,
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
      if (!uniqueIds.includes(trackedId)) {
        detachMember(trackedId);
      }
    });

    uniqueIds.forEach((uid) => {
      attachMember(uid);
    });
  };

  // Subscribe to the current user's club (via user context to ensure reactivity)
  useEffect(() => {
    if (!user?.uid) {
      setJoinedClub(null);
      cleanupMemberListeners();
      return;
    }

    let unsubscribeClub: (() => void) | undefined;

    if (user.clubId) {
      unsubscribeClub = subscribeToClub(user.clubId);
    } else {
      // If no explicit clubId on user, watch clubs collection for a club that contains this user
      setJoinedClub(null);
      cleanupMemberListeners();
      const q = query(collection(db, 'clubs'), where('members', 'array-contains', user.uid));
      const unsubQuery = onSnapshot(q, (snap) => {
        if (snap.docs.length > 0) {
          const clubId = snap.docs[0].id;
          // unsubscribe previous club listener if any
          if (unsubscribeClub) unsubscribeClub();
          unsubscribeClub = subscribeToClub(clubId);
        } else {
          if (unsubscribeClub) {
            unsubscribeClub();
            unsubscribeClub = undefined;
          }
          setJoinedClub(null);
          cleanupMemberListeners();
        }
      });

      // ensure we clean the query listener on unmount
      const origUnsub = unsubscribeClub;
      const wrappedUnsubscribe = () => {
        try { unsubQuery(); } catch (e) {}
        try { if (origUnsub) origUnsub(); } catch (e) {}
      };
      // replace unsubscribeClub with wrapped so outer return() will call it
      unsubscribeClub = wrappedUnsubscribe;
    }

    return () => {
      if (unsubscribeClub) unsubscribeClub();
      cleanupMemberListeners();
    };
  }, [user?.uid, user?.clubId]);

  // subscribe to club doc itself
  const subscribeToClub = (clubId: string) => {
    const clubRef = doc(db, "clubs", clubId);
    const unsubscribe = onSnapshot(clubRef, (snap) => {
      const data: any = snap.data();
      if (!data) {
        setJoinedClub(null);
        cleanupMemberListeners();
        return;
      }

      const memberIds: string[] = Array.isArray(data.members)
        ? data.members
        : [];

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
    return () => {
      unsubscribe();
      cleanupMemberListeners();
    };
  };

  // -----------------------------------------------------------
  // VALUE IMPLEMENTATION (using services/clubs.ts)
  // -----------------------------------------------------------
  const value: ClubContextType = {
    joinedClub,
    members,

    createClub: async (c) => {
      // services/clubs.ts → createClub(name, city, description, photoUri?, isPrivate?)
      const created = await createClub(
        c.name,
        c.city,
        c.desc,
        c.photoUri,
        (c.visibility === 'private')
      );
      // created has same shape as payload + id
      return {
        ...created,
        participants: 1, // creator is first participant
      } as ClubInfo;

    },

    joinClub: async (clubId) => {
      await joinClub(clubId);
    },

    leaveClub: async (clubId) => {
      const targetId = clubId ?? joinedClub?.id;
      if (!targetId) return;
      await leaveClubService(targetId);
    },

    updateClub: async (data) => {
      if (!joinedClub?.id) return;
      await updateClubFirebase(joinedClub.id, {
        name: data.name,
        description: data.desc,   // FIXED HERE
        city: data.city,
        photoUri: data.photoUri,
        isPrivate: (data as any).visibility === 'private' || (data as any).isPrivate,
      });
    },


    promoteToOfficer: async (uid) => {
      if (!joinedClub?.id) return;
      await promoteOfficer(joinedClub.id, uid);
    },

    demoteOfficer: async (uid) => {
      if (!joinedClub?.id) return;
      await demoteOfficer(joinedClub.id, uid);
    },

    transferOwnership: async (uid, clubId) => {
      const targetId = clubId ?? joinedClub?.id;
      if (!targetId) return;
      await transferOwnershipService(targetId, uid);
    },

    deleteClub: async (clubId) => {
      const targetId = clubId ?? joinedClub?.id;
      if (!targetId) return;
      await deleteClubService(targetId);
    },
  };

  return (
    <ClubContext.Provider value={value}>{children}</ClubContext.Provider>
  );
};

// -------------------------------------------------------------
// HOOK
// -------------------------------------------------------------
export const useClub = () => useContext(ClubContext);
