import React, { createContext, ReactNode, useCallback, useContext, useState } from "react";

export type PointsTransaction = {
  id: string;
  type: 'earn' | 'spend';
  amount: number;
  source: string; // e.g., "Challenge validé", "Publicité", "Échange récompense"
  timestamp: number;
};

type PointsContextType = {
  points: number;
  totalEarned: number;
  totalSpent: number;
  transactions: PointsTransaction[];
  addPoints: (value: number, source?: string) => void;
  spendPoints: (cost: number, source?: string) => boolean; // returns true if spent
};

const PointsContext = createContext<PointsContextType | undefined>(undefined);

export function PointsProvider({ children }: { children: ReactNode }) {
  const [points, setPoints] = useState<number>(0);
  const [totalEarned, setTotalEarned] = useState<number>(0);
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);

  const addPoints = useCallback((value: number, source: string = 'Gain') => {
    const amt = Math.max(0, value);
    if (amt === 0) return;
    const tx: PointsTransaction = { id: `${Date.now()}-earn`, type: 'earn', amount: amt, source, timestamp: Date.now() };
    setPoints((p) => p + amt);
    setTotalEarned((t) => t + amt);
    setTransactions((arr) => [tx, ...arr]);
  }, []);

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
    }
    return success;
  }, []);

  return (
    <PointsContext.Provider value={{ points, totalEarned, totalSpent, transactions, addPoints, spendPoints }}>
      {children}
    </PointsContext.Provider>
  );
}

export function usePoints() {
  const ctx = useContext(PointsContext);
  if (!ctx) throw new Error("usePoints must be used within a PointsProvider");
  return ctx;
}