// hooks/club-context.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { auth, db } from "@/firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";

import {
  createClub,
  demoteOfficer,
  joinClub,
  leaveClub,
  promoteOfficer,
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

  joinClub: (c: ClubInfo) => Promise<void>;
  leaveClub: () => Promise<void>;

  updateClub: (
    data: Partial<Omit<ClubInfo, "id" | "participants">>
  ) => Promise<void>;

  promoteToOfficer: (uid: string) => Promise<void>;
  demoteOfficer: (uid: string) => Promise<void>;
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
});

// -------------------------------------------------------------
// PROVIDER
// -------------------------------------------------------------
export const ClubProvider = ({ children }: { children: React.ReactNode }) => {
  const [joinedClub, setJoinedClub] = useState<ClubInfo | null>(null);
  const [members, setMembers] = useState<ClubMember[]>([]);

  // Subscribe to the current user's club
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const userRef = doc(db, "users", uid);

    // listen to user doc → clubId change
    const unsubUser = onSnapshot(userRef, (snap) => {
      const data = snap.data();
      if (data?.clubId) {
        subscribeToClub(data.clubId);
      } else {
        setJoinedClub(null);
        setMembers([]);
      }
    });

    return () => {
      unsubUser();
    };
  }, []);

  // subscribe to club doc itself
  const subscribeToClub = (clubId: string) => {
    const clubRef = doc(db, "clubs", clubId);
    return onSnapshot(clubRef, (snap) => {
      const data: any = snap.data();
      if (!data) {
        setJoinedClub(null);
        setMembers([]);
        return;
      }

      setJoinedClub({
        id: clubId,
        name: data.name,
        desc: data.description ?? data.desc,
        city: data.city,
        photoUri: data.photoUrl,
        ownerId: data.ownerId,
        visibility: data.visibility,
        officers: data.officers || [],
        participants: (data.members || []).length,
        logo: data.logo,
      });

      const memberList: ClubMember[] = (data.members || []).map(
        (uid: string) => ({
          id: uid,
          points: 0, // you can later plug real points here
          name: uid, // TODO: resolve to display name if needed
          avatar: null,
        })
      );

      setMembers(memberList);
    });
  };

  // -----------------------------------------------------------
  // VALUE IMPLEMENTATION (using services/clubs.ts)
  // -----------------------------------------------------------
  const value: ClubContextType = {
    joinedClub,
    members,

    createClub: async (c) => {
      // services/clubs.ts → createClub(name, city, description, photoUri?)
      const created = await createClub(
        c.name,
        c.city,
        c.desc,
        c.photoUri
      );
      // created has same shape as payload + id
      return {
        ...created,
        participants: 1, // creator is first participant
      } as ClubInfo;

    },

    joinClub: async (c) => {
      await joinClub(c.id);
    },

    leaveClub: async () => {
      if (!joinedClub?.id) return;
      await leaveClub(joinedClub.id);
    },

    updateClub: async (data) => {
      if (!joinedClub?.id) return;
      await updateClubFirebase(joinedClub.id, {
        name: data.name,
        description: data.desc,   // FIXED HERE
        city: data.city,
        photoUri: data.photoUri,
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
  };

  return (
    <ClubContext.Provider value={value}>{children}</ClubContext.Provider>
  );
};

// -------------------------------------------------------------
// HOOK
// -------------------------------------------------------------
export const useClub = () => useContext(ClubContext);
