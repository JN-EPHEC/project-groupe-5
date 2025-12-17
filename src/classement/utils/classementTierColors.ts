// src/classement/utils/classementTierColors.ts

export type ClassementTierKey =
  | "gold"
  | "silver"
  | "bronze"
  | "tier4_5"
  | "tier6_10"
  | "tier11_25"
  | "tier26_50";

export type ClassementTierStyle = {
  borderColor: string;
  backgroundColor: string;
};

export const CLASSEMENT_TIER_STYLES: Record<
  ClassementTierKey,
  ClassementTierStyle
> = {
  gold: {
    borderColor: "#facc15",
    backgroundColor: "rgba(250, 204, 21, 0.12)",
  },
  silver: {
    borderColor: "#cbd5e1",
    backgroundColor: "rgba(203, 213, 225, 0.10)",
  },
  bronze: {
    borderColor: "#d97706",
    backgroundColor: "rgba(217, 119, 6, 0.10)",
  },
  tier4_5: {
    borderColor: "#22c55e",
    backgroundColor: "rgba(34, 197, 94, 0.08)",
  },
  tier6_10: {
    borderColor: "#38bdf8",
    backgroundColor: "rgba(56, 189, 248, 0.08)",
  },
  tier11_25: {
    borderColor: "#94a3b8",
    backgroundColor: "rgba(148, 163, 184, 0.06)",
  },
  tier26_50: {
    borderColor: "#64748b",
    backgroundColor: "rgba(100, 116, 139, 0.05)",
  },
};
