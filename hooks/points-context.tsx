import React, { createContext, ReactNode, useCallback, useContext, useState } from "react";

type PointsContextType = {
  points: number;
  addPoints: (value: number) => void;
  spendPoints: (cost: number) => boolean; // returns true if spent
};

const PointsContext = createContext<PointsContextType | undefined>(undefined);

export function PointsProvider({ children }: { children: ReactNode }) {
  const [points, setPoints] = useState<number>(999999999); // valeur initiale utilisateur

  const addPoints = useCallback((value: number) => {
    setPoints((p) => p + Math.max(0, value));
  }, []);

  const spendPoints = useCallback((cost: number) => {
    if (cost <= 0) return false;
    let success = false;
    setPoints((p) => {
      if (p >= cost) {
        success = true;
        return p - cost;
      }
      return p;
    });
    return success;
  }, []);

  return (
    <PointsContext.Provider value={{ points, addPoints, spendPoints }}>
      {children}
    </PointsContext.Provider>
  );
}

export function usePoints() {
  const ctx = useContext(PointsContext);
  if (!ctx) throw new Error("usePoints must be used within a PointsProvider");
  return ctx;
}