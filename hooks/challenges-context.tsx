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
import { useGlobalPopup } from "@/hooks/global-popup-context";
import { usePoints } from "@/hooks/points-context";
import { markDefiDone } from "@/services/notifications";
import { finalizeProof } from "@/services/proofs";
import { useRouter } from "expo-router";
// Remplace la ligne d'import existante par celle-ci :
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
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
  finalStatus?: "validated" | "rejected" | null;
  readyToClaim?: boolean;
  readyToRetry?: boolean;
  popupPending?: boolean;
  finalProofId?: string | null;
  validationPhaseDone?: boolean;
  pointsClaimed?: boolean;
  progressCount?: number;
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
  currentClub: ActiveChallenge | null;
  start: (challenge: Challenge) => void;
  startClub: (challenge: Challenge) => void;
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
  goToClassement: boolean;
  setGoToClassement: (v: boolean) => void;
  validationPhaseDone: boolean;
  setValidationPhaseDone: (v: boolean) => void;
};

// ------------------------------------------------------------
// CONTEXT
// ------------------------------------------------------------

const ChallengesContext = createContext<ChallengesContextType | undefined>(
  undefined
);

function isPastNoon(date: Date) {
  const noon = new Date(date);
  noon.setHours(12, 0, 0, 0); // 12:00:00
  return date.getTime() >= noon.getTime();
}



export function ChallengesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [current, setCurrent] = useState<ActiveChallenge | null>(null);
  const [currentClub, setCurrentClub] = useState<ActiveChallenge | null>(null);
  const [goToClassement, setGoToClassement] = useState(false);
  const [reviewCompleted, setReviewCompleted] = useState(0);
  const [validationPhaseDone, setValidationPhaseDone] = useState(false);
  const [reviewRequiredCount, setReviewRequiredCount] = useState(3);
  const { addPoints } = usePoints();
  const [history, setHistory] = useState<ChallengeHistoryEntry[]>([]);
  const [activities, setActivities] = useState<Record<string, Challenge["category"]>>({});
  const [canceledIds, setCanceledIds] = useState<number[]>([]);
  const uid = auth.currentUser?.uid;
  const activeDefiRef = uid
    ? doc(collection(doc(db, "users", uid), "activeDefi"), "perso")
    : null;
  const activeClubDefiRef = uid
    ? doc(collection(doc(db, "users", uid), "activeDefi"), "club")
    : null;
  const { showPopup } = useGlobalPopup();
  const router = useRouter();


  // ------------------------------------------------------------
  // LOAD ACTIVE DEFI ON APP START
  // ------------------------------------------------------------
  useEffect(() => {
    if (!activeDefiRef) return;

    const unsub = onSnapshot(activeDefiRef, (snap) => {
      if (!snap.exists()) {
        setCurrent(null);
        return;
      }

      const data = snap.data();

      // 🔄 entering / re-entering pendingValidation → unlock validation decision
      if (data.status === "pendingValidation") {
        setValidationPhaseDone(false);
      }


      setCurrent({
        firestoreId: data.defiId,
        id: data.defiId,
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
        startedAt: data.startedAt?.toDate?.(),
        expiresAt: data.expiresAt?.toDate?.(),
        photoUri: data.photoUri ?? null,
        photoComment: data.photoComment ?? null,
        proofId: data.proofId ?? null,
        proofSubmitted: data.proofSubmitted ?? false,
        feedbackRating: data.feedbackRating ?? null,
        feedbackComment: data.feedbackComment ?? null,
        feedbackSubmitted: data.feedbackSubmitted ?? false,
        finalStatus: data.finalStatus ?? null,
        readyToClaim: data.readyToClaim ?? false,
        readyToRetry: data.readyToRetry ?? false,
        popupPending: data.popupPending ?? false,
        finalProofId: data.finalProofId ?? null,
        pointsClaimed: data.pointsClaimed ?? false,
      });
    });

    return () => unsub();
  }, [activeDefiRef]);

  // ------------------------------------------------------------
  // LOAD ACTIVE CLUB DEFI
  // ------------------------------------------------------------
  useEffect(() => {
    if (!activeClubDefiRef) return;

    const unsub = onSnapshot(activeClubDefiRef, (snap) => {
      if (!snap.exists()) {
        setCurrentClub(null);
        return;
      }

      const data = snap.data();

      setCurrentClub({
        firestoreId: data.defiId,
        id: data.defiId,
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
        audience: "Club",
        timeLeft: "Aujourd'hui",

        status: data.status,
        startedAt: data.startedAt?.toDate?.(),
        expiresAt: data.expiresAt?.toDate?.(),

        photoUri: data.photoUri ?? null,
        photoComment: data.photoComment ?? null,
        proofId: data.proofId ?? null,
        proofSubmitted: data.proofSubmitted ?? false,

        finalStatus: data.finalStatus ?? null,
        readyToClaim: data.readyToClaim ?? false,
        readyToRetry: data.readyToRetry ?? false,
        popupPending: data.popupPending ?? false,
        finalProofId: data.finalProofId ?? null,
        pointsClaimed: data.pointsClaimed ?? false,
        progressCount: data.progressCount ?? 0,
      });
    });

    return () => unsub();
  }, [activeClubDefiRef]);


  // ------------------------------------------------------------
  // POPUP WHEN PROOF IS VALIDATED / REJECTED
  // ------------------------------------------------------------
  useEffect(() => {
    if (!current) return;
    if (!current.popupPending) return;
    if (!current.finalStatus) return;

    const isSuccess = current.finalStatus === "validated";

    showPopup({
      variant: isSuccess ? "success" : "error",
      title: isSuccess ? "Défi validé 🎉" : "Preuve refusée",
      description: isSuccess
        ? `Tu as gagné ${current.points} points dans le classement.`
        : "Ta preuve a été refusée. Tu peux réessayer avec un autre défi.",
      primaryLabel: isSuccess ? "Voir le classement" : "Choisir un défi",
      secondaryLabel: "Fermer",
      onPrimary: async () => {
        if (isSuccess) {
          const { awardClassementPoints } = await import("@/src/classement/services/awardClassementPoints");
          await awardClassementPoints(current.points);

          // 🟢 mark points claimed in Firestore
          if (activeDefiRef) {
            await updateDoc(activeDefiRef, {
              pointsClaimed: true
            });
          }

          // 🟢 update local state immediately
          setCurrent(prev =>
            prev ? { ...prev, pointsClaimed: true } : prev
          );

          setGoToClassement(true);
        } else {
          stop();
        }
      },
      onSecondary: () => {
        // Just close popup, user stays where they are
      },
    });

    // Mark popup as consumed (so it doesn't show again)
    if (activeDefiRef) {
      updateDoc(activeDefiRef, { popupPending: false }).catch((err) =>
        console.warn("[challenges] failed to clear popupPending:", err)
      );
    }

    setCurrent((prev) =>
      prev ? { ...prev, popupPending: false } : prev
    );
  }, [current?.popupPending, current?.finalStatus]);


  // ------------------------------------------------------------
  // AUTO-FINALISATION: listen to the proof’s vote counters
  // ------------------------------------------------------------
  useEffect(() => {
    // no current challenge → nothing to watch
    if (!current) return;

    // if there is no proofId yet, we don't start the listener
    if (!current.proofId) return;

    // optional: only watch while pending
    if (current.status !== "pendingValidation") return;

    const proofRef = doc(db, "preuves", current.proofId);

    const unsub = onSnapshot(proofRef, (snap) => {
      if (!snap.exists()) return;

      const data = snap.data() as any;
      const votesFor = data.votesFor ?? 0;
      const votesAgainst = data.votesAgainst ?? 0;

      if (votesFor >= 3 || votesAgainst >= 3) {
        // 🔥 increment club progress on VALIDATED club challenge
        if (votesFor >= 3 && current?.audience === "Club" && activeClubDefiRef) {
          import("firebase/firestore").then(({ updateDoc, increment }) => {
            updateDoc(activeClubDefiRef, {
              progressCount: increment(1),
            });
          });
        }

        if (current.proofId) {
          finalizeProof(current.proofId).catch((err) => {
            console.warn("[finalizeProof error]", err);
          });
        }
      }
    });

    return () => unsub();
  }, [current?.proofId, current?.status]);



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
    setValidationPhaseDone(false);
    console.log("[CH] start -> new cycle", { uid: auth.currentUser?.uid, defiId: challenge.firestoreId });
  }, []);


  // ------------------------------------------------------------
  // START A CLUB DEFI (7 days)
  // ------------------------------------------------------------
  const startClub = useCallback(async (challenge: Challenge) => {
    if (!challenge.firestoreId) {
      console.warn("Missing Firestore ID for club challenge");
      return;
    }

    const startedAt = new Date();

    // 🗓️ 7-day expiration
    const expiresAt = new Date(startedAt.getTime() + 7 * 24 * 60 * 60 * 1000);

    const activeData = {
      defiId: challenge.firestoreId,
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

      startedAt,
      expiresAt,
      status: "active",

      // proof-related
      photoUri: null,
      photoComment: "",
      proofId: null,
      proofSubmitted: false,

      // final phase
      finalStatus: null,
      popupPending: false,
      pointsClaimed: false,
      progressCount: 0,
    };

    const uid = auth.currentUser?.uid;
    if (!uid) return;

    // Firestore write
    await import("firebase/firestore").then(async ({ doc, setDoc }) => {
      await setDoc(
        doc(db, "users", uid, "activeDefi", "club"),
        activeData
      );
    });

    // local state mirror
    setCurrentClub({
      ...challenge,
      firestoreId: challenge.firestoreId,
      status: "active",
      startedAt,
      expiresAt,
      audience: "Club",
      photoUri: null,
      photoComment: null,
      proofId: null,
      proofSubmitted: false,
      pointsClaimed: false,
    });

    console.log("[CH] startClub -> new club cycle", {
      uid,
      defiId: challenge.firestoreId,
    });
  }, []);

  // ------------------------------------------------------------
  // STOP (CANCEL)
  // ------------------------------------------------------------
  const stop = useCallback(async () => {

    if (!activeDefiRef) {
      console.log("❌ activeDefiRef is NULL");
      return;
    }

    try {
      await deleteDoc(activeDefiRef);
      console.log("✔ Successfully deleted Firestore doc");
    } catch (err) {
      console.log("❌ FAILED deleting Firestore doc:", err);
    }

    setReviewCompleted(0);
setReviewRequiredCount(3);
setValidationPhaseDone(false);
console.log("[CH] stop -> reset cycle", { uid: auth.currentUser?.uid });

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

      console.log("[CH] validateWithPhoto -> pendingValidation", {
  uid: auth.currentUser?.uid,
  proofId,
});

      // 🔥 RESET validation cycle HERE
      setValidationPhaseDone(false);

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

      // 1. Mise à jour locale (comme avant) pour l'UI immédiate
      await updateDoc(activeDefiRef, {
        feedbackRating: rating,
        feedbackComment: comment,
        feedbackSubmitted: true,
      });

      // 2. 🔥 AJOUT CRUCIAL : Sauvegarde dans la collection publique "feedbacks"
      // C'est ça qui va faire apparaître l'avis dans ta page AdminFeedback
      try {
        const { db, auth } = await import("@/firebaseConfig"); // Ou utilise tes imports existants
        await addDoc(collection(db, "feedbacks"), {
            challengeTitle: current.title || "Défi sans titre",
            rating: rating,
            comment: comment,
            userId: auth.currentUser?.uid,
            userName: "Utilisateur", // Tu pourras améliorer ça plus tard avec le vrai nom
            createdAt: new Date(), // Timestamp pour le tri
        });
        console.log("✔ Avis sauvegardé publiquement");
      } catch (error) {
        console.error("❌ Erreur sauvegarde avis public:", error);
      }

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
    setReviewCompleted((p) => {
      const next = Math.min(p + 1, reviewRequiredCount);

      if (next >= reviewRequiredCount) {
        setValidationPhaseDone(true);
      }

      return next;
    });
  }, [reviewRequiredCount]);


  // ------------------------------------------------------------
  // VALUE
  // ------------------------------------------------------------
  const value = useMemo(
    () => ({
      current,
      currentClub,
      start,
      startClub,
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
      goToClassement,
      setGoToClassement,
      validationPhaseDone,
      setValidationPhaseDone,
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

    // ------------------------------------------------------------
  // DAILY RESET LOGIC (RUNS AFTER 12:00)
  // ------------------------------------------------------------
  useEffect(() => {
    if (!current || !activeDefiRef) return;

    (async () => {
      const now = new Date();

      // Unique key per user (so multiple accounts on same device don't conflict)
      const uid = auth.currentUser?.uid;
      const resetKey = uid ? `lastResetCheck_${uid}` : "lastResetCheck";

      // 🕛 Have we already handled today's reset?
      const last = await AsyncStorage.getItem(resetKey);
      if (last) {
        const lastDate = new Date(last);
        if (lastDate.toDateString() === now.toDateString()) {
          // Same calendar day → nothing to do
          return;
        }
      }

      // Only run reset logic AFTER 12:00
      if (!isPastNoon(now)) return;

      // Mark that we have handled reset for today
      await AsyncStorage.setItem(resetKey, now.toISOString());

      // ---- SCENARIO 1: user already claimed points → delete ----
      if (current.pointsClaimed === true) {
        try {
          await deleteDoc(activeDefiRef);
          setCurrent(null);
          console.log("[RESET] Deleted activeDefi (points claimed)");
        } catch (err) {
          console.warn("[RESET] Failed to delete activeDefi (claimed)", err);
        }
        return;
      }

      // ---- SCENARIO 2: validated but not claimed → KEEP ----
      if (current.finalStatus === "validated") {
        console.log("[RESET] Kept activeDefi (validated but not claimed)");
        return;
      }

      // ---- SCENARIO 3: proof submitted, still pending validation → KEEP ----
      if (current.status === "pendingValidation") {
        console.log("[RESET] Kept activeDefi (pendingValidation)");
        return;
      }

      // ---- SCENARIO 4: no proof submitted → delete ----
      if (current.status === "active" && !current.proofSubmitted) {
        try {
          await deleteDoc(activeDefiRef);
          setCurrent(null);
          console.log("[RESET] Deleted activeDefi (no proof submitted)");
        } catch (err) {
          console.warn("[RESET] Failed to delete activeDefi (no proof)", err);
        }
        return;
      }

      // Any other weird combo: we log but don't destroy anything
      console.log("[RESET] No matching scenario, activeDefi kept as safety.");
    })();
  }, [current, activeDefiRef]);


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
