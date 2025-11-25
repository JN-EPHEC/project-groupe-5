import type { Challenge } from "@/components/ui/defi/types";
import { usePoints } from "@/hooks/points-context";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type ChallengesContextType = {
  current: Challenge | null;
  start: (challenge: Challenge) => void;
  stop: () => void;
  validateWithPhoto: (photoUri: string) => void;
  activities: Record<string, Challenge["category"]>;
};

const ChallengesContext = createContext<ChallengesContextType | undefined>(undefined);

export function ChallengesProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<Challenge | null>(null);
  const [activities, setActivities] = useState<Record<string, Challenge["category"]>>({});
  const { addPoints } = usePoints();

  const start = useCallback((challenge: Challenge) => {
    setCurrent(challenge);
  }, []);

  const stop = useCallback(() => {
    setCurrent(null);
  }, []);

  const validateWithPhoto = useCallback((photoUri: string) => {
    if (current) {
      const dateKey = new Date().toISOString().slice(0, 10);
      addPoints(current.points);
      setActivities((prev) => ({ ...prev, [dateKey]: current.category }));
      setCurrent(null);
    }
  }, [current, addPoints]);

  const value = useMemo(() => ({ current, start, stop, validateWithPhoto, activities }), [current, start, stop, validateWithPhoto, activities]);
  return <ChallengesContext.Provider value={value}>{children}</ChallengesContext.Provider>;
}

export function useChallenges() {
  const ctx = useContext(ChallengesContext);
  if (!ctx) throw new Error("useChallenges must be used within ChallengesProvider");
  return ctx;
}
