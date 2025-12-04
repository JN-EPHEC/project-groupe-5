// services/defis.ts
import { Challenge } from "@/components/ui/defi/types";

export function mapFirestoreDefiToUI(doc: any, id: string): Challenge {
  // Convert difficulte → capitalized version
  const diffMap: Record<string, Challenge["difficulty"]> = {
    facile: "Facile",
    moyen: "Moyen",
    difficile: "Difficile",
  };

  return {
    id: parseInt(id, 10), // Firestore ID (string)
    title: doc.titre ?? "",
    description: doc.description ?? "",
    category: doc.categorie === "personnel" ? "Recyclage" : "Local", 
    // ^ not used much in UI anyway
    difficulty: diffMap[doc.difficulte] ?? "Moyen",
    points: doc.points ?? 0,
    audience: "Membre",
    timeLeft: "—",
  };
}

// Prepare data to save inside: users/{uid}/activeDefi/perso
export function mapUIChallengeToActiveDefi(challenge: Challenge, defiId: string) {
  const now = new Date();

  // Compute next noon for expiration
  const target = new Date(now);
  target.setHours(12, 0, 0, 0);
  if (now >= target) {
    target.setDate(target.getDate() + 1);
  }

  return {
    defiId,
    titre: challenge.title,
    description: challenge.description,
    difficulte: challenge.difficulty.toLowerCase(),
    points: challenge.points,
    categorie: "personnel",
    status: "active",
    startedAt: now,
    expiresAt: target,
    photoUri: null,
    photoComment: null,
    proofId: null,
    feedbackRating: null,
    feedbackComment: null,
    feedbackSubmitted: false,
  };
}
