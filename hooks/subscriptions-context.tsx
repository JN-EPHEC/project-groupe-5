import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type MiniUser = {
  id: string;
  name: string;
  avatar?: string | null;
};

type SubscriptionsContextType = {
  followers: MiniUser[]; // abonnés
  following: MiniUser[]; // abonnements
  follow: (u: MiniUser) => void;
  unfollow: (id: string) => void;
  addFollower: (u: MiniUser) => void;
  removeFollower: (id: string) => void;
};

const SubscriptionsContext = createContext<SubscriptionsContextType | undefined>(undefined);

export function SubscriptionsProvider({ children }: { children: React.ReactNode }) {
  const [followers, setFollowers] = useState<MiniUser[]>([]);
  const [following, setFollowing] = useState<MiniUser[]>([]);

  const follow = useCallback((u: MiniUser) => {
    setFollowing(prev => (prev.some(x => x.id === u.id) ? prev : [u, ...prev]));
  }, []);
  const unfollow = useCallback((id: string) => {
    setFollowing(prev => prev.filter(x => x.id !== id));
  }, []);

  const addFollower = useCallback((u: MiniUser) => {
    setFollowers(prev => (prev.some(x => x.id === u.id) ? prev : [u, ...prev]));
  }, []);
  const removeFollower = useCallback((id: string) => {
    setFollowers(prev => prev.filter(x => x.id !== id));
  }, []);

  const value = useMemo(() => ({ followers, following, follow, unfollow, addFollower, removeFollower }), [followers, following, follow, unfollow, addFollower, removeFollower]);
  return <SubscriptionsContext.Provider value={value}>{children}</SubscriptionsContext.Provider>;
}

export function useSubscriptions() {
  const ctx = useContext(SubscriptionsContext);
  if (!ctx) throw new Error('useSubscriptions must be used within SubscriptionsProvider');
  return ctx;
}
