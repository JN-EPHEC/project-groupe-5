// hooks/useValidationQueue.ts
import { auth, db } from "@/firebaseConfig";
import { useChallenges } from "@/hooks/challenges-context";
import {
    collection,
    DocumentData,
    limit,
    onSnapshot,
    query,
    where,
} from "firebase/firestore";
import { useEffect, useState } from "react";

// Type of what we return to the UI (DefiScreen)
export type ValidationProof = {
  id: string;
  userId: string;
  defiId: string;
  difficulty: "facile" | "moyen" | "difficile";
  photoUrl: string;
  commentaire: string;
  status: "pending" | "validated" | "rejected";
  votesFor?: number;
  votesAgainst?: number;
};

type UseValidationQueueReturn = {
  queue: ValidationProof[];
  removeFromQueue: (id: string) => void;
};

export function useValidationQueue(
  difficulty: "facile" | "moyen" | "difficile" | null
): UseValidationQueueReturn {
  const { current, setReviewRequiredCount } = useChallenges();
  const [queue, setQueue] = useState<ValidationProof[]>([]);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    console.log("[queue] effect START", {
      uid,
      currentStatus: current?.status,
      currentDifficulty: current?.difficulty,
      difficultyProp: difficulty,
    });
    // 🛑 If not logged in, no current défi, not in gating, or no difficulty → nothing to do
    if (!uid) {
    setQueue([]);
    setReviewRequiredCount(0);
    return;
    }

    if (!current || current.status !== "pendingValidation") {
    setQueue([]);
    setReviewRequiredCount(0);
    return;
    }

    if (!difficulty) {
    setQueue([]);
    setReviewRequiredCount(0);
    return;
    }

    const q = query(
      collection(db, "preuves"),
      where("status", "==", "pending"),
      where("difficulty", "==", difficulty),
      limit(5)
    );

    const unsub = onSnapshot(
        q,
        (snap) => {
            console.log("[queue] snapshot received, docs =", snap.docs.length);
            const all = snap.docs.map((d) => {
            const data = d.data() as DocumentData;

            return {
                id: d.id,
                userId: data.userId,
                defiId: data.defiId,
                difficulty: data.difficulty,
                photoUrl: data.photoUrl,
                commentaire: data.commentaire ?? "",
                status: data.status,
                votesFor: data.votesFor ?? 0,
                votesAgainst: data.votesAgainst ?? 0,
            } as ValidationProof;
            });
            console.log("[queue] raw docs:", all);
            console.log(">>> difficulty EXACT VALUE:", JSON.stringify(all[0]?.difficulty));

            // ❌ Never show user's own proofs
            // ❌ Never show proofs already decided (>=3 votes)
            const filtered = all.filter((p) => {
                console.log("FILTER CHECK →", {
                    proofId: p.id,
                    proofUserId: p.userId,
                    currentUid: uid,
                    votesFor: p.votesFor,
                    votesAgainst: p.votesAgainst
                });

                if (p.userId === uid) {
                    console.log(" → FILTERED OUT (own proof)");
                    return false;
                }

                const decided =
                    (p.votesFor ?? 0) >= 3 || (p.votesAgainst ?? 0) >= 3;

                if (decided) {
                    console.log(" → FILTERED OUT (decided)");
                    return false;
                }

                console.log(" → INCLUDED");
                return true;
                });

            console.log("[queue] filtered docs:", filtered);
            setQueue(filtered);
            console.log("[queue] filtered length =", filtered.length);

            // 🔥 Dynamic required count: min(#proofs, 3)
            const nb = filtered.length;

            if (nb === 0) {
            setReviewRequiredCount(0);
            } else {
            setReviewRequiredCount(Math.min(nb, 3));
            }
        },
        (err) => {
            console.log("[queue] snapshot ERROR:", err);
            setQueue([]);
            setReviewRequiredCount(0);
        }
    );

    return () => {
      unsub();
    };
  }, [current?.status, difficulty, setReviewRequiredCount]);

  const removeFromQueue = (id: string) => {
    setQueue((prev) => prev.filter((p) => p.id !== id));
  };

  return { queue, removeFromQueue };
}
