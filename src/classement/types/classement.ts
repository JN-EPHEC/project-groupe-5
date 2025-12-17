// src/classement/types/classement.ts

// -----------------------------
// Cycle
// -----------------------------
export type ClassementCycleStatus =
  | "active"      // normal ranking period
  | "locking"     // short window for last validations
  | "locked";     // frozen, rewards distributed

export type ClassementCycle = {
  id: string;
  startAt: Date;
  endAt: Date;
  status: ClassementCycleStatus;
};

// -----------------------------
// League
// -----------------------------
export type ClassementLeague = {
  id: string;
  cycleId: string;
  name: string;           // e.g. "Ligue Verte"
  size: number;           // usually 50
};

// -----------------------------
// User in classement
// -----------------------------
export type ClassementUser = {
  uid: string;
  displayName: string;
  avatarUrl?: string;

  // 🔢 Ranking-related (cycle scoped)
  rankingPoints: number;
  rank?: number;          // computed client-side
  qualified: boolean;     // ≥ 7 perso days

  // 🏆 Rewards
  greeniesEarned?: number; // only known when cycle is locked

  // UI helpers
  isCurrentUser?: boolean;
  isFake?: boolean;       // for filler users
};

// -----------------------------
// Reward tier (rank → greenies)
// -----------------------------
export type RewardTier = {
  fromRank: number;
  toRank: number;
  greenies: number;
};
