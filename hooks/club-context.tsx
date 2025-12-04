import { auth, db } from "@/firebaseConfig";
import { createClub as createClubService, demoteOfficer as demoteOfficerService, joinClub as joinClubService, leaveClub as leaveClubService, promoteOfficer as promoteOfficerService, updateClubFirebase } from "@/services/clubs";
import { doc, onSnapshot, Unsubscribe } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";

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
  const clubUnsubRef = useRef<Unsubscribe | null>(null);
  const memberUnsubsRef = useRef<Record<string, Unsubscribe>>({});

  const resetMemberListeners = () => {
    Object.values(memberUnsubsRef.current).forEach((fn) => fn());
    memberUnsubsRef.current = {};
    setMembers([]);
  };

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const userRef = doc(db, "users", uid);
    let currentClubId: string | null = null;

    const unsub = onSnapshot(userRef, (snap) => {
      const data = snap.data();
      const clubId = data?.clubId ?? null;

      if (clubId === currentClubId) {
        return;
      }

      currentClubId = clubId;

      if (!clubId) {
        clubUnsubRef.current?.();
        clubUnsubRef.current = null;
        setJoinedClub(null);
        resetMemberListeners();
        return;
      }

      clubUnsubRef.current?.();
      clubUnsubRef.current = subscribeToClub(clubId);
    });

    return () => {
      unsub();
      clubUnsubRef.current?.();
      clubUnsubRef.current = null;
      resetMemberListeners();
    };
  }, []);

  const subscribeToClub = (clubId: string) => {
    const clubRef = doc(db, "clubs", clubId);
    return onSnapshot(clubRef, (snap) => {
      const data: any = snap.data();
      if (!data) {
        setJoinedClub(null);
        resetMemberListeners();
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
        emoji: data.emoji || "🌿",
      });

      hydrateMembers(Array.isArray(data.members) ? data.members : []);
    });
  };

  const hydrateMembers = (memberIds: string[]) => {
    const nextIds = new Set(memberIds);

    Object.keys(memberUnsubsRef.current).forEach((uid) => {
      if (!nextIds.has(uid)) {
        memberUnsubsRef.current[uid]?.();
        delete memberUnsubsRef.current[uid];
        setMembers((prev) => prev.filter((m) => m.id !== uid));
      }
    });

    memberIds.forEach((uid) => {
      if (memberUnsubsRef.current[uid]) {
        return;
      }

      const userRef = doc(db, "users", uid);
      memberUnsubsRef.current[uid] = onSnapshot(userRef, (userSnap) => {
        if (!userSnap.exists()) {
          setMembers((prev) => prev.filter((m) => m.id !== uid));
          return;
        }

        const data: any = userSnap.data();
        const displayName =
          data?.username ||
          data?.usernameLowercase ||
          [data?.firstName, data?.lastName].filter(Boolean).join(" ") ||
          uid;

        const pointsValue = typeof data?.points === "number" ? data.points : 0;

        setMembers((prev) => {
          const filtered = prev.filter((m) => m.id !== uid);
          const next = [
            ...filtered,
            {
              id: uid,
              name: String(displayName).trim() || "Membre",
              points: pointsValue,
              avatar: data?.photoURL ?? null,
            },
          ];
          return next.sort((a, b) => (b.points || 0) - (a.points || 0));
        });
      });
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
