export type CategoryKey =
  | "Tous"
  | "Recyclage"
  | "Local"
  | "Transports"
  | "Tri"
  | "Sensibilisation";

export type ChallengeCategory = Exclude<CategoryKey, "Tous">;

export type TabKey = "perso" | "club";

export type Challenge = {
  id: number;
  title: string;
  description: string;
  category: ChallengeCategory;
  difficulty: "Facile" | "Moyen" | "Difficile";
  points: number;
  audience: string;
  timeLeft: string;
};

export type ClubChallenge = {
  id: number;
  title: string;
  description: string;
  category: ChallengeCategory;
  difficulty: "Facile" | "Moyen" | "Difficile";
  points: number;
  goalParticipants: number; // e.g., 46
  participants: number; // current count
};
