import React, { createContext, useContext, useMemo, useState } from "react";

export type User = { name: string; avatar: string };

type UserContextType = {
  user: User;
  setUser: (u: User) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>({
    name: "Marie",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
  });

  const value = useMemo(() => ({ user, setUser }), [user]);
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
}
