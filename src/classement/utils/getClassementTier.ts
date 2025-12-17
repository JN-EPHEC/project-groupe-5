export type ClassementTier =
  | "gold"
  | "silver"
  | "bronze"
  | "tier4_5"
  | "tier6_10"
  | "tier11_25"
  | "tier26_50";

export function getClassementTier(rank: number): ClassementTier {
  if (rank === 1) return "gold";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
  if (rank <= 5) return "tier4_5";
  if (rank <= 10) return "tier6_10";
  if (rank <= 25) return "tier11_25";
  return "tier26_50";
}
