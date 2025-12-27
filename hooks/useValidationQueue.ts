// hooks/useValidationQueue.ts
import { auth, db } from "@/firebaseConfig";
import { useChallenges } from "@/hooks/challenges-context";
import { useClub } from "@/hooks/club-context";
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
let GLOBAL_VQ_LISTENER_COUNT = 0;
let GLOBAL_VQ_ID_SEQ = 0;

const vqLog = (id: number, msg: string, data?: any) => {
  console.log(
    `%c[VQ#${id}] ${msg}`,
    "color:#22c55e;font-weight:bold",
    data ?? ""
  );
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
  kind?: "perso" | "club";
  clubId?: string | null;
};

type UseValidationQueueReturn = {
  queue: ValidationProof[];
  removeFromQueue: (id: string) => void;
};

type QueueMode = "perso" | "club";

// =========================
// Hook
// =========================
export function useValidationQueue(
  difficulty: "facile" | "moyen" | "difficile" | null,
  mode: QueueMode = "perso" // 🔥 NEW, default = old behavior
): UseValidationQueueReturn {


  const instanceIdRef = useRef<number | null>(null);

if (instanceIdRef.current === null) {
  instanceIdRef.current = ++GLOBAL_VQ_ID_SEQ;
  vqLog(instanceIdRef.current, "HOOK CREATED");
}
const ID = instanceIdRef.current;


  const {
    current,
    setReviewRequiredCount,
    //validationPhaseDone, => if code works will need to be removed
    //setValidationPhaseDone,=> if code works will need to be removed
  } = useChallenges();
  const { joinedClub } = useClub();              // 🔥 NEW
  const myClubId = joinedClub?.id ?? null;       // 🔥 NEW

  const [queue, setQueue] = useState<ValidationProof[]>([]);
  const hasDecidedRef = useRef(false); // 🔒 FINAL decision flag
  const prevReqRef = useRef<number | null>(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;

  vqLog(ID!, "useEffect RUN", {
    uid,
    status: current?.status,
    difficulty,
  });


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

    // ---------- SUBSCRIBE ----------
    const q = query(
      collection(db, "preuves"),
      where("status", "==", "pending"),
      where("difficulty", "==", difficulty),
      limit(5)
    );


GLOBAL_VQ_LISTENER_COUNT++;
vqLog(ID!, "SUBSCRIBE Firestore", {
  activeListeners: GLOBAL_VQ_LISTENER_COUNT,
});



    const unsub = onSnapshot(q, (snap) => {

      vqLog(ID!, "SNAPSHOT FIRED", {
  docs: snap.docs.length,
});



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
          kind: (data.kind as "perso" | "club") ?? "perso",
          clubId: typeof data.clubId === "string" ? data.clubId : null,
        } as ValidationProof;
      });

      // filter own + decided
      const filtered = raw.filter((p) => {
        // 1) never validate your own proofs
        if (p.userId === uid) return false;

        // 2) ignore already-finalised proofs
        if ((p.votesFor ?? 0) >= 3) return false;
        if ((p.votesAgainst ?? 0) >= 3) return false;

        // 3) separate perso vs club queues
        //    - For old proofs without 'kind', we treat as "perso"
        const kind: "perso" | "club" = p.kind ?? "perso";

        if (mode === "perso" && kind !== "perso") return false;
        if (mode === "club" && kind !== "club") return false;

        // 4) NEW RULE: in club mode, do not validate proofs from your own club
        if (mode === "club" && myClubId && p.clubId && p.clubId === myClubId) {
          return false;
        }

        return true;
      });

      // ---------- DECISION POINT ----------
      if (filtered.length === 0) {

        
        vqLog(ID!, "DECISION: no validations available");


        hasDecidedRef.current = true;
        //setValidationPhaseDone(true); => if code works will need to be removed
        setQueue([]);
        setReviewRequiredCount(0);
        return;
      }

      // ---------- NORMAL VALIDATION ----------
      setQueue(filtered);
      // Only update shared reviewRequiredCount when it actually changes to avoid
      // causing a re-subscription/render loop between hook and context
      const req = Math.min(filtered.length, 3);
      if (prevReqRef.current !== req) {
        setReviewRequiredCount(req);
        prevReqRef.current = req;
      }
    });

    return () => {


      GLOBAL_VQ_LISTENER_COUNT--;
vqLog(ID!, "UNSUBSCRIBE Firestore", {
  activeListeners: GLOBAL_VQ_LISTENER_COUNT,
});


      unsub();
    };
  }, [
    current?.status,
    difficulty,
    //validationPhaseDone, => if code works will need to be removed
    setReviewRequiredCount,
    //setValidationPhaseDone, => if code works will need to be removed
  ]);

  const removeFromQueue = (id: string) => {
    setQueue((prev) => prev.filter((p) => p.id !== id));
  };

  return { queue, removeFromQueue };
}
