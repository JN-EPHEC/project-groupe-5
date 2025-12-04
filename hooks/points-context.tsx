import { db } from "@/firebaseConfig";
import { doc, increment, updateDoc } from "firebase/firestore";
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

import { useUser } from "./user-context";

export type PointsTransaction = {
  id: string;
  type: 'earn' | 'spend';
  amount: number;
  source: string; // e.g., "Challenge validé", "Publicité", "Échange récompense"
  timestamp: number;
};

type PointsContextType = {
  /** Points disponibles (diminuent lors des dépenses) */
  points: number;
  /** Alias explicite pour les points disponibles */
  availablePoints: number;
  /** Total cumulé gagné (ne diminue jamais) */
  totalEarned: number;
  /** Total dépensé (pour stats) */
  totalSpent: number;
  transactions: PointsTransaction[];
  addPoints: (value: number, source?: string) => void;
  spendPoints: (cost: number, source?: string) => boolean; // returns true if spent
};

const PointsContext = createContext<PointsContextType | undefined>(undefined);

export function PointsProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [points, setPoints] = useState<number>(0);
  const [totalEarned, setTotalEarned] = useState<number>(0);
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);

  // Synchronise local state with Firestore profile
  useEffect(() => {
    if (!user) {
      setPoints(0);
      setTotalEarned(0);
      setTotalSpent(0);
      setTransactions([]);
      return;
    }

    const userPoints = typeof user.points === "number" ? user.points : 0;
    setPoints(userPoints);
    setTotalEarned(userPoints);
    setTransactions([]);
  }, [user?.points, user]);

  const persistPointDelta = useCallback(
    async (delta: number) => {
      if (!user?.uid || delta === 0) return;
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          points: increment(delta),
        });
      } catch (error) {
        console.warn("Impossible de synchroniser les points", error);
      }
    },
    [user?.uid]
  );

  const addPoints = useCallback((value: number, source: string = 'Gain') => {
    const amt = Math.max(0, value);
    if (amt === 0) return;
    const tx: PointsTransaction = { id: `${Date.now()}-earn`, type: 'earn', amount: amt, source, timestamp: Date.now() };
    setPoints((p) => p + amt);
    setTotalEarned((t) => t + amt);
    setTransactions((arr) => [tx, ...arr]);
    persistPointDelta(amt);
  }, [persistPointDelta]);

  const spendPoints = useCallback((cost: number, source: string = 'Échange récompense') => {
    if (cost <= 0) return false;
    let success = false;
    setPoints((p) => {
      if (p >= cost) {
        success = true;
        return p - cost;
      }
      return p;
    });
    if (success) {
      setTotalSpent((t) => t + cost);
      const tx: PointsTransaction = { id: `${Date.now()}-spend`, type: 'spend', amount: cost, source, timestamp: Date.now() };
      setTransactions((arr) => [tx, ...arr]);
      persistPointDelta(-cost);
    }
    return success;
  }, [persistPointDelta]);

  return (
    <PointsContext.Provider value={{ points, availablePoints: points, totalEarned, totalSpent, transactions, addPoints, spendPoints }}>
      {children}
    </PointsContext.Provider>
  );
}

export function usePoints() {
  const ctx = useContext(PointsContext);
  if (!ctx) throw new Error("usePoints must be used within a PointsProvider");
  return ctx;
}