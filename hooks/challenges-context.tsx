import type { Challenge, ChallengeCategory } from "@/components/ui/defi/types";
import { usePoints } from "@/hooks/points-context";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type ChallengesContextType = {
  current: Challenge | null;
  start: (challenge: Challenge) => void;
  stop: () => void;
  validateWithPhoto: (photoUri: string) => void;
  // historique simple des défis validés, pour les streaks/calendrier
  completed: Array<{ date: string; category: ChallengeCategory }>;
};

const ChallengesContext = createContext<ChallengesContextType | undefined>(undefined);

export function ChallengesProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<Challenge | null>(null);
  const [completed, setCompleted] = useState<Array<{ date: string; category: ChallengeCategory }>>([]);
  const { addPoints } = usePoints();

  const start = useCallback((challenge: Challenge) => {
    setCurrent(challenge);
  }, []);

  const stop = useCallback(() => {
    setCurrent(null);
  }, []);

  const validateWithPhoto = useCallback((photoUri: string) => {
    if (current) {
      // Reward points when validating
      addPoints(current.points);
      // enregistre la validation du jour pour le calendrier/streak
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      setCompleted((prev) => {
        // éviter les doublons pour le même jour: remplace si existe
        const next = prev.filter((e) => e.date !== dateStr);
        next.push({ date: dateStr, category: current.category });
        return next;
      });
      setCurrent(null);
    }
  }, [current, addPoints]);

  const value = useMemo(() => ({ current, start, stop, validateWithPhoto, completed }), [current, start, stop, validateWithPhoto, completed]);
  return <ChallengesContext.Provider value={value}>{children}</ChallengesContext.Provider>;
}

export function useChallenges() {
  const ctx = useContext(ChallengesContext);
  if (!ctx) throw new Error("useChallenges must be used within ChallengesProvider");
  return ctx;
}
