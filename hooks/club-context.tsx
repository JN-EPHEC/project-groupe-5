import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ClubVisibility = "public" | "private";
export type ClubInfo = { id: string; name: string; participants: number; desc?: string; visibility?: ClubVisibility; emoji?: string; photoUri?: string };
export type ClubMember = { id: string; name: string; avatar: string; points: number };

type ClubContextType = {
  joinedClub: ClubInfo | null;
  members: ClubMember[]; // members of the joined club (excluding current user)
  joinClub: (club: ClubInfo) => boolean; // false if already in another club
  createClub: (data: { name: string; desc: string; visibility: ClubVisibility; emoji?: string; photoUri?: string }) => ClubInfo; // returns created club
  leaveClub: () => void;
};

const ClubContext = createContext<ClubContextType | undefined>(undefined);

export function ClubProvider({ children }: { children: React.ReactNode }) {
  const [joinedClub, setJoinedClub] = useState<ClubInfo | null>(null);
  const [members, setMembers] = useState<ClubMember[]>([]);

  const joinClub = useCallback((club: ClubInfo) => {
    // if already in a different club, refuse
    if (joinedClub && joinedClub.id !== club.id) {
      return false;
    }
    // if not in a club, set and hydrate members from amisData as placeholder
    if (!joinedClub) {
      setJoinedClub({ id: club.id, name: club.name, participants: club.participants, desc: club.desc, visibility: club.visibility, emoji: club.emoji, photoUri: club.photoUri });
      // generate club members (excluding current user). We'll create N-1 generic members
      const total = Math.max(1, club.participants);
      const generated: ClubMember[] = Array.from({ length: Math.max(0, total - 1) }).map((_, idx) => {
        const id = String(idx + 1);
        const gender = idx % 2 === 0 ? "men" : "women";
        const avatar = `https://randomuser.me/api/portraits/${gender}/${(idx % 80) + 1}.jpg`;
        const name = gender === "men" ? `Alex ${idx + 1}` : `Lina ${idx + 1}`;
        const points = 200 + ((idx * 37) % 500); // pseudo-random stable points
        return { id, name, avatar, points };
      });
      setMembers(generated);
    }
    return true;
  }, [joinedClub]);

  const leaveClub = useCallback(() => {
    setJoinedClub(null);
    setMembers([]);
  }, []);

  const createClub = useCallback((data: { name: string; desc: string; visibility: ClubVisibility; emoji?: string; photoUri?: string }) => {
    const newClub: ClubInfo = {
      id: Date.now().toString(),
      name: data.name,
      participants: 1,
      desc: data.desc,
      visibility: data.visibility,
      emoji: data.emoji,
      photoUri: data.photoUri,
    };
    // auto-join creator
    joinClub(newClub);
    return newClub;
  }, [joinClub]);

  const value = useMemo(() => ({ joinedClub, members, joinClub, leaveClub, createClub }), [joinedClub, members, joinClub, leaveClub, createClub]);
  return <ClubContext.Provider value={value}>{children}</ClubContext.Provider>;
}

export function useClub() {
  const ctx = useContext(ClubContext);
  if (!ctx) throw new Error("useClub must be used within a ClubProvider");
  return ctx;
}
