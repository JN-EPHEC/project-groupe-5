import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ClubVisibility = "public" | "private";
export type ClubInfo = { id: string; name: string; participants: number; desc?: string; visibility?: ClubVisibility; emoji?: string; photoUri?: string; city?: string; ownerId?: string; officers?: string[]; logo?: string };
export type ClubMember = { id: string; name: string; avatar: string; points: number };

type ClubContextType = {
  joinedClub: ClubInfo | null;
  members: ClubMember[]; // members of the joined club (excluding current user)
  joinClub: (club: ClubInfo) => boolean; // false if already in another club
  createClub: (data: { name: string; desc: string; visibility: ClubVisibility; emoji?: string; photoUri?: string; city: string }) => ClubInfo; // returns created club
  leaveClub: () => void;
  promoteToOfficer: (memberId: string) => void;
  demoteOfficer: (memberId: string) => void;
  updateClub: (patch: Partial<Omit<ClubInfo, 'id' | 'participants'>>) => void;
};

interface ClubContextType {
  joinedClub: any;
  members: any[];
  createClub: (c: any) => Promise<any>;
  joinClub: (c: any) => Promise<void>;
  leaveClub: () => Promise<void>;
  updateClub: (data: any) => Promise<void>;
  promoteToOfficer: (uid: string) => Promise<void>;
  demoteOfficer: (uid: string) => Promise<void>;
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
});

export const ClubProvider = ({ children }: any) => {
  const [joinedClub, setJoinedClub] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const userRef = doc(db, "users", uid);

    const unsub = onSnapshot(userRef, (snap) => {
      const data = snap.data();
      if (data?.clubId) {
        subscribeToClub(data.clubId);
      } else {
        setJoinedClub(null);
        setMembers([]);
      }
    });

    return () => unsub();
  }, []);

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
      });

      const memberList = (data.members || []).map((uid: string) => ({
        id: uid,
        points: 0,
        name: uid,
        avatar: null,
      }));

      setMembers(memberList);
    });
  };

  return (
    <ClubContext.Provider
      value={{
        joinedClub,
        members,

        createClub: async (c) => {
          return await createClubService(c.name, c.city, c.desc, c.photoUri);
        },

        joinClub: async (c) => {
          await joinClubService(c.id);
        },

        leaveClub: async () => {
          if (!joinedClub?.id) return;
          await leaveClubService(joinedClub.id);
        },

        updateClub: async (data) => {
          if (!joinedClub?.id) return;
          await updateClubFirebase(joinedClub.id, {
            name: data.name,
            description: data.desc,
            city: data.city,
            photoUri: data.photoUri,
          });
        },

        promoteToOfficer: async (uid) => {
          if (!joinedClub?.id) return;
          await promoteOfficerService(joinedClub.id, uid);
        },

        demoteOfficer: async (uid) => {
          if (!joinedClub?.id) return;
          await demoteOfficerService(joinedClub.id, uid);
        },
      }}
    >
      {children}
    </ClubContext.Provider>
  );
};

export const useClub = () => useContext(ClubContext);
