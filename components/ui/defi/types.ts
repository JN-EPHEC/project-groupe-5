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
  id: number;                     // UI ID
  firestoreId?: string;           // REAL Firestore ID (optional)
  title: string;
  description: string;
  category: ChallengeCategory;
  difficulty: "Facile" | "Moyen" | "Difficile";
  points: number;
  audience: string;
  timeLeft: string;
};
