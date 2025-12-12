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
import { useEffect, useRef, useState } from "react";

// Debugging (high-signal + anti-spam)
const VQ_DEBUG = true;
const vq = (msg: string, extra?: any) => {
  if (!VQ_DEBUG) return;
  if (extra === undefined) console.log(`[VQ] ${msg}`);
  else console.log(`[VQ] ${msg}`, extra);
};

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
  const {
    current,
    setReviewRequiredCount,
    validationPhaseDone,
    setValidationPhaseDone,
  } = useChallenges();

  const [queue, setQueue] = useState<ValidationProof[]>([]);

  // prevents log spam when app re-renders a lot
  const lastSigRef = useRef<string>("");

  useEffect(() => {
    const uid = auth.currentUser?.uid ?? null;
    const status = current?.status ?? null;

    const projectId =
      (db as any)?.app?.options?.projectId ??
      (auth as any)?.app?.options?.projectId ??
      null;

    const sig = JSON.stringify({
      projectId,
      uid,
      status,
      difficulty,
      validationPhaseDone,
    });

    if (sig !== lastSigRef.current) {
      lastSigRef.current = sig;
      vq("effect:start", JSON.parse(sig));
    }

    // --- exits ---
    if (!uid) {
      setQueue([]);
      setReviewRequiredCount(0);
      return;
    }

    if (!current || status !== "pendingValidation") {
      setQueue([]);
      setReviewRequiredCount(0);
      return;
    }

    if (!difficulty) {
      setQueue([]);
      setReviewRequiredCount(0);
      return;
    }

    // ✅ critical: if phase is already locked, do NOT keep subscribing
    if (validationPhaseDone) {
      setQueue([]);
      setReviewRequiredCount(0);
      vq("exit:phase-done");
      return;
    }

    const LIMIT_N = 5;

    const q = query(
      collection(db, "preuves"),
      where("status", "==", "pending"),
      where("difficulty", "==", difficulty),
      limit(LIMIT_N)
    );

    vq("subscribe", { difficulty, LIMIT_N });

    const unsub = onSnapshot(
      q,
      (snap) => {
        const raw = snap.docs.map((d) => {
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
          } as ValidationProof; // keep your cast
        });

        vq("snapshot", { rawCount: raw.length });

        // 🔥 log exactly what query returned
        vq(
          "docs",
          raw.map((p) => ({
            id: p.id,
            userId: p.userId,
            difficulty: p.difficulty,
            status: p.status,
            votesFor: p.votesFor ?? 0,
            votesAgainst: p.votesAgainst ?? 0,
          }))
        );

        let own = 0;
        let decided = 0;
        let kept = 0;

        const filtered = raw.filter((p) => {
          if (p.userId === uid) {
            own++;
            return false;
          }

          const isDecided =
            (p.votesFor ?? 0) >= 3 || (p.votesAgainst ?? 0) >= 3;

          if (isDecided) {
            decided++;
            return false;
          }

          kept++;
          return true;
        });

        vq("filter", { raw: raw.length, kept, own, decided });

        setQueue(filtered);

        const nb = filtered.length;

        if (nb === 0) {
          setReviewRequiredCount(0);

          // ✅ lock only once
          vq("lock:no-visible-proofs", { rawCount: raw.length });
          setValidationPhaseDone(true);
        } else {
          setReviewRequiredCount(Math.min(nb, 3));
        }
      },
      (err) => {
        vq("snapshot:error", {
          message: err?.message ?? String(err),
          code: (err as any)?.code ?? null,
        });
        setQueue([]);
        setReviewRequiredCount(0);
      }
    );

    return () => {
      vq("unsubscribe");
      unsub();
    };
  }, [current?.status, difficulty, validationPhaseDone, setReviewRequiredCount, setValidationPhaseDone]);

  const removeFromQueue = (id: string) => {
    setQueue((prev) => prev.filter((p) => p.id !== id));
  };

  return { queue, removeFromQueue };
}
