// src/classement/utils/rewardTable.ts

import { RewardTier } from "../types/classement";

// 🔒 Fixed reward structure (per league)
export const REWARD_TABLE: RewardTier[] = [
  { fromRank: 1,  toRank: 1,  greenies: 300 },
  { fromRank: 2,  toRank: 2,  greenies: 150 },
  { fromRank: 3,  toRank: 3,  greenies: 75  },
  { fromRank: 4,  toRank: 5,  greenies: 25  },
  { fromRank: 6,  toRank: 10, greenies: 10  },
  { fromRank: 11, toRank: 25, greenies: 5   },
  { fromRank: 26, toRank: 50, greenies: 1   },
];

// -----------------------------
// Helper: rank → greenies
// -----------------------------
export function getGreeniesForRank(rank: number): number {
  const tier = REWARD_TABLE.find(
    (t) => rank >= t.fromRank && rank <= t.toRank
  );
  return tier ? tier.greenies : 0;
}
