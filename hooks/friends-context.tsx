import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type Friend = {
  id: string;
  name: string;
  points: number;
  online: boolean;
  avatar: string;
};

type FriendsContextType = {
  friends: Friend[];
  addFriend: (f: Friend) => void;
  removeFriend: (id: string) => void;
  isFriend: (id: string) => boolean;
};

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

export function FriendsProvider({ children }: { children: React.ReactNode }) {
  const [friends, setFriends] = useState<Friend[]>([]);

  const addFriend = useCallback((f: Friend) => {
    setFriends((prev) => (prev.some((x) => x.id === f.id) ? prev : [...prev, f]));
  }, []);

  const removeFriend = useCallback((id: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const isFriend = useCallback((id: string) => friends.some((f) => f.id === id), [friends]);

  const value = useMemo(() => ({ friends, addFriend, removeFriend, isFriend }), [friends, addFriend, removeFriend, isFriend]);
  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>;
}

export function useFriends() {
  const ctx = useContext(FriendsContext);
  if (!ctx) throw new Error("useFriends must be used within FriendsProvider");
  return ctx;
}
