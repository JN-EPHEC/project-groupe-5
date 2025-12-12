// hooks/challenges-context.ts
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Challenge } from "@/components/ui/defi/types";
import { auth, db } from "@/firebaseConfig";
import { usePoints } from "@/hooks/points-context";
import { markDefiDone } from "@/services/notifications";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  updateDoc
} from "firebase/firestore";

// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------

export type ActiveChallenge = Challenge & {
  firestoreId: string;
  status: "active" | "pendingValidation" | "validated";
  startedAt?: Date;
  expiresAt?: Date;
  photoUri?: string | null;
  photoComment?: string | null;
  proofId?: string | null;
  proofSubmitted?: boolean;
  feedbackRating?: number | null;
  feedbackComment?: string | null;
  feedbackSubmitted?: boolean;
};

export type ChallengeHistoryEntry = {
  id: string;
  challengeId: string;
  title: string;
  description?: string;
  category: Challenge["category"];
  points: number;
  photoUri?: string | null;
  validatedAt: string;
};

// ------------------------------------------------------------
// CONTEXT SHAPE
// ------------------------------------------------------------

type ChallengesContextType = {
  current: ActiveChallenge | null;
  start: (challenge: Challenge) => void;
  stop: (id?: number) => void;
  validateWithPhoto: (photoUri: string, comment: string | undefined, proofId: string) => void;
  approveCurrent: () => void;
  activities: Record<string, Challenge["category"]>;
  canceledIds: number[]; // ← FIX
  reviewRequiredCount: number;
  reviewCompleted: number;
  incrementReview: () => void;
  setFeedback: (rating: number, comment: string) => void;
  history: ChallengeHistoryEntry[];
  setPhotoComment: (comment: string) => void;
  setReviewRequiredCount: (n: number) => void;
};

// ------------------------------------------------------------
// CONTEXT
// ------------------------------------------------------------

const ChallengesContext = createContext<ChallengesContextType | undefined>(
  undefined
);


export function ChallengesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [current, setCurrent] = useState<ActiveChallenge | null>(null);
  const [reviewCompleted, setReviewCompleted] = useState(0);
  const [reviewRequiredCount, setReviewRequiredCount] = useState(3);
  const { addPoints } = usePoints();
  const [history, setHistory] = useState<ChallengeHistoryEntry[]>([]);
  const [activities, setActivities] = useState<Record<string, Challenge["category"]>>({});
  const [canceledIds, setCanceledIds] = useState<number[]>([]);
  const uid = auth.currentUser?.uid;
  const activeDefiRef = uid
    ? doc(collection(doc(db, "users", uid), "activeDefi"), "perso")
    : null;

  // ------------------------------------------------------------
  // LOAD ACTIVE DEFI ON APP START
  // ------------------------------------------------------------
  useEffect(() => {
    if (!activeDefiRef) return;

    const load = async () => {
      const snap = await getDoc(activeDefiRef);
      if (!snap.exists()) return;

      const data = snap.data();
      setCurrent({
        firestoreId: data.defiId,
        id: Date.now(), // any number; just to have a key, it doesn't need to match rotatingChallenges

        title: data.titre,
        description: data.description,
        category: data.categorie ?? "Recyclage",
        difficulty:
          data.difficulte === "facile"
            ? "Facile"
            : data.difficulte === "moyen"
            ? "Moyen"
            : "Difficile",
        points: data.points,
        audience: "Membre",
        timeLeft: "Aujourd'hui",

        status: data.status,
        startedAt: data.startedAt?.toDate?.() ?? undefined,
        expiresAt: data.expiresAt?.toDate?.() ?? undefined,
        photoUri: data.photoUri ?? null,
        photoComment: data.photoComment ?? null,
        proofId: data.proofId ?? null,
        proofSubmitted: data.proofSubmitted ?? false,
        feedbackRating: data.feedbackRating ?? null,
        feedbackComment: data.feedbackComment ?? null,
        feedbackSubmitted: data.feedbackSubmitted ?? false,
      });
    };

    load();
  }, [uid]);

  // ------------------------------------------------------------
  // START A DEFI (WRITE TO FIRESTORE)
  // ------------------------------------------------------------
  const start = useCallback(async (challenge: Challenge) => {
    if (!challenge.firestoreId) {
      console.warn("Missing Firestore ID for challenge");
      return;
    }

    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + 24 * 60 * 60 * 1000);

    const activeData = {
      // link to the "defis" doc
      defiId: challenge.firestoreId,        // <-- real Firestore id of the défi

      // snapshot of the défi at the moment you start it
      titre: challenge.title,
      description: challenge.description,
      categorie: challenge.category,
      difficulte:
        challenge.difficulty === "Facile"
          ? "facile"
          : challenge.difficulty === "Moyen"
          ? "moyen"
          : "difficile",
      points: challenge.points,

      // runtime state
      startedAt,
      expiresAt,
      status: "active",

      // proof / feedback (initial empty)
      photoUri: null,
      photoComment: "",
      proofId: null,
      proofSubmitted: false,
      feedbackRating: null,
      feedbackComment: null,
      feedbackSubmitted: false,
    };


    // 🔥 Save to Firestore
    const { auth, db } = await import("@/firebaseConfig");
    const { doc, setDoc } = await import("firebase/firestore");

    const uid = auth.currentUser?.uid;
    if (!uid) return;

    await setDoc(
      doc(db, "users", uid, "activeDefi", "perso"),
      activeData
    );

    // 🔥 Update local state
    setCurrent({
      ...challenge,
      firestoreId: challenge.firestoreId,
      status: "active",
      startedAt,
      expiresAt,
      photoUri: null,
      photoComment: null,
      proofId: null,
      proofSubmitted: false,
      feedbackRating: null,
      feedbackComment: null,
      feedbackSubmitted: false,
    });

    setReviewCompleted(0);
  }, []);


  // ------------------------------------------------------------
  // STOP (CANCEL)
  // ------------------------------------------------------------
  const stop = useCallback(async () => {
    console.log("STOP() CALLED");

    if (!activeDefiRef) {
      console.log("❌ activeDefiRef is NULL");
      return;
    }

    console.log("Deleting from Firestore path:", activeDefiRef.path);

    try {
      await deleteDoc(activeDefiRef);
      console.log("✔ Successfully deleted Firestore doc");
    } catch (err) {
      console.log("❌ FAILED deleting Firestore doc:", err);
    }

    setCurrent(null);
    console.log("✔ local state current = null");
  }, [activeDefiRef]);


  // ------------------------------------------------------------
  // SUBMIT PHOTO → pendingValidation + attach draftProofId
  // ------------------------------------------------------------
  const validateWithPhoto = useCallback(
    async (photoUri: string, comment: string | undefined, proofId: string) => {
      if (!current || !activeDefiRef) return;

      await updateDoc(activeDefiRef, {
        photoUri,
        photoComment: comment ?? "",
        status: "pendingValidation",
        draftProofId: proofId,
        proofSubmitted: true,
      });

      setCurrent((p) =>
        p
          ? {
              ...p,
              status: "pendingValidation",
              photoUri,
              photoComment: comment ?? "",
              proofId,
              proofSubmitted: true,
            }
          : p
      );

      setReviewCompleted(0);
    },
    [current, activeDefiRef]
  );


  // ------------------------------------------------------------
  // APPROVE (AFTER GATING)
  // ------------------------------------------------------------
  const approveCurrent = useCallback(async () => {
    if (!current || current.status !== "pendingValidation") return;

    const dateKey = new Date().toISOString().slice(0, 10);
    addPoints(current.points);

    setActivities(prev => ({ ...prev, [dateKey]: current.category }));

    setHistory(prev => {
      const entry: ChallengeHistoryEntry = {
        id: `${current.firestoreId}-${Date.now()}`,
        challengeId: String(current.firestoreId ?? current.id),
        title: current.title,
        description: current.description,
        category: current.category,
        points: current.points,
        photoUri: current.photoUri || undefined,
        validatedAt: new Date().toISOString(),
      };
      return [entry, ...prev];
    });

    await markDefiDone();

    setCurrent({ ...current, status: "validated" });
    setReviewCompleted(0);

    // 🔥 Optionally remove activeDefi from Firestore
    const { auth, db } = await import("@/firebaseConfig");
    const { doc, deleteDoc } = await import("firebase/firestore");

    const uid = auth.currentUser?.uid;
    if (uid) {
      await deleteDoc(doc(db, "users", uid, "activeDefi", "perso"));
    }
  }, [current, addPoints]);


  // ------------------------------------------------------------
  // FEEDBACK
  // ------------------------------------------------------------
  const setFeedback = useCallback(
    async (rating: number, comment: string) => {
      if (!current || !activeDefiRef) return;

      await updateDoc(activeDefiRef, {
        feedbackRating: rating,
        feedbackComment: comment,
        feedbackSubmitted: true,
      });

      setCurrent((prev) =>
        prev
          ? {
              ...prev,
              feedbackRating: rating,
              feedbackComment: comment,
              feedbackSubmitted: true,
            }
          : prev
      );
    },
    [current, activeDefiRef]
  );

  // ------------------------------------------------------------
  // UPDATE PHOTO COMMENT
  // ------------------------------------------------------------
  const setPhotoComment = useCallback(
    async (comment: string) => {
      if (!current || !activeDefiRef) return;

      await updateDoc(activeDefiRef, {
        photoComment: comment,
      });

      setCurrent((prev) =>
        prev ? { ...prev, photoComment: comment } : prev
      );
    },
    [current, activeDefiRef]
  );

  // ------------------------------------------------------------
  // GATING
  // ------------------------------------------------------------
  const incrementReview = useCallback(() => {
    setReviewCompleted((p) => Math.min(p + 1, reviewRequiredCount));
  }, [reviewRequiredCount]);


  // ------------------------------------------------------------
  // VALUE
  // ------------------------------------------------------------
  const value = useMemo(
    () => ({
      current,
      start,
      stop,
      validateWithPhoto,
      approveCurrent,
      activities,
      canceledIds,
      reviewRequiredCount,
      reviewCompleted,
      incrementReview,
      setFeedback,
      setPhotoComment,
      history,
      setReviewRequiredCount,
    }),
    [
      current,
      start,
      stop,
      validateWithPhoto,
      approveCurrent,
      reviewRequiredCount,
      reviewCompleted,
      incrementReview,
      setFeedback,
      setPhotoComment,
      history,
    ]
  );

  return (
    <ChallengesContext.Provider value={value}>
      {children}
    </ChallengesContext.Provider>
  );
}

export function useChallenges() {
  const ctx = useContext(ChallengesContext);
  if (!ctx) throw new Error("useChallenges must be used within ChallengesProvider");
  return ctx;
}
