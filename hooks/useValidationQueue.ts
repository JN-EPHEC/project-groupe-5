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

// =========================
// Debug (LOW NOISE)
// =========================
const VQ_DEBUG = true;
const log = (msg: string, data?: any) => {
  if (!VQ_DEBUG) return;
  console.log(`[VQ] ${msg}`, data ?? "");
};

// =========================
// Types
// =========================
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

// =========================
// Hook
// =========================
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
  const hasDecidedRef = useRef(false); // 🔒 FINAL decision flag

  useEffect(() => {
    const uid = auth.currentUser?.uid;

    // ---------- HARD EXITS ----------
    if (!uid) {
      setQueue([]);
      setReviewRequiredCount(0);
      return;
    }

    if (!current || current.status !== "pendingValidation") {
      setQueue([]);
      setReviewRequiredCount(0);
      hasDecidedRef.current = false; // reset for next challenge
      return;
    }

    if (!difficulty) {
      setQueue([]);
      setReviewRequiredCount(0);
      return;
    }

    // 🔒 If validation already decided → NEVER subscribe again
    if (validationPhaseDone || hasDecidedRef.current) {
      log("blocked: validation already decided");
      setQueue([]);
      setReviewRequiredCount(0);
      return;
    }

    // ---------- SUBSCRIBE ----------
    log("subscribe", { difficulty });

    const q = query(
      collection(db, "preuves"),
      where("status", "==", "pending"),
      where("difficulty", "==", difficulty),
      limit(5)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (hasDecidedRef.current) return; // extra safety

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
        } as ValidationProof;
      });

      // filter own + decided
      const filtered = raw.filter((p) => {
        if (p.userId === uid) return false;
        if ((p.votesFor ?? 0) >= 3) return false;
        if ((p.votesAgainst ?? 0) >= 3) return false;
        return true;
      });

      log("snapshot", {
        raw: raw.length,
        visible: filtered.length,
      });

      // ---------- DECISION POINT ----------
      if (filtered.length === 0) {
        log("decision: skip validation");

        hasDecidedRef.current = true;
        setValidationPhaseDone(true);
        setQueue([]);
        setReviewRequiredCount(0);
        return;
      }

      // ---------- NORMAL VALIDATION ----------
      setQueue(filtered);
      setReviewRequiredCount(Math.min(filtered.length, 3));
    });

    return () => {
      log("unsubscribe");
      unsub();
    };
  }, [
    current?.status,
    difficulty,
    validationPhaseDone,
    setReviewRequiredCount,
    setValidationPhaseDone,
  ]);

  const removeFromQueue = (id: string) => {
    setQueue((prev) => prev.filter((p) => p.id !== id));
  };

  return { queue, removeFromQueue };
}
