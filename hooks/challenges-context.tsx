import type { Challenge } from "@/components/ui/defi/types";
import { usePoints } from "@/hooks/points-context";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ActiveChallenge = Challenge & { status: 'active' | 'pendingValidation' | 'validated'; photoUri?: string };

type ChallengesContextType = {
  current: ActiveChallenge | null;
  start: (challenge: Challenge) => void;
  stop: () => void;
  validateWithPhoto: (photoUri: string) => void; // now only submits photo -> pendingValidation
  approveCurrent: () => void; // admin/validation step
  activities: Record<string, Challenge["category"]>;
};

const ChallengesContext = createContext<ChallengesContextType | undefined>(undefined);

export function ChallengesProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<ActiveChallenge | null>(null);
  const [activities, setActivities] = useState<Record<string, Challenge["category"]>>({});
  const { addPoints } = usePoints();

  const start = useCallback((challenge: Challenge) => {
    setCurrent({ ...challenge, status: 'active' });
  }, []);

  const stop = useCallback(() => {
    setCurrent(null);
  }, []);

  // user submits photo evidence -> move to pendingValidation (no points yet)
  const validateWithPhoto = useCallback((photoUri: string) => {
    if (current && current.status === 'active') {
      setCurrent({ ...current, status: 'pendingValidation', photoUri });
    }
  }, [current]);

  // approval grants points and marks validated
  const approveCurrent = useCallback(() => {
    if (current && current.status === 'pendingValidation') {
      const dateKey = new Date().toISOString().slice(0, 10);
      addPoints(current.points);
      setActivities((prev) => ({ ...prev, [dateKey]: current.category }));
      setCurrent({ ...current, status: 'validated' });
    }
  }, [current, addPoints]);

  const value = useMemo(() => ({ current, start, stop, validateWithPhoto, approveCurrent, activities }), [current, start, stop, validateWithPhoto, approveCurrent, activities]);
  return <ChallengesContext.Provider value={value}>{children}</ChallengesContext.Provider>;
}

export function useChallenges() {
  const ctx = useContext(ChallengesContext);
  if (!ctx) throw new Error("useChallenges must be used within ChallengesProvider");
  return ctx;
}
