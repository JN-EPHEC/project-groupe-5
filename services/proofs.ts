// services/proofs.ts
import { auth, db, storage } from "@/firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

export type ProofStatus = "pending" | "validated" | "rejected";

export type ProofDoc = {
  userId: string;
  defiId: string;
  // 🔥 NEW: difficulty of the défi ("facile" | "moyen" | "difficile")
  difficulty: "facile" | "moyen" | "difficile";

  photoUrl: string;
  commentaire: string;
  createdAt: any;
  status: ProofStatus;

  // legacy fields from your partner’s implementation
  assignedValidators: string[];
  votes: Record<string, boolean>;

  // 🔥 NEW: counters for the future “3 votes” system
  votesFor?: number;
  votesAgainst?: number;
};

// ----------------------------
// 1. Upload de l'image
// ----------------------------
export async function uploadProofImage(
  localUri: string,
  preuveId: string
): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();

  const storageRef = ref(storage, `preuves/${preuveId}/image.jpg`);
  await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });

  return await getDownloadURL(storageRef);
}

// ----------------------------
// 2. Sélection des validateurs (legacy, gardé pour compat)
// ----------------------------
export async function pickRandomValidators(
  exceptUid: string,
  count = 3
): Promise<string[]> {
  try {
    const snap = await getDocs(collection(db, "users"));
    const ids = snap.docs
      .map((d) => d.id)
      .filter((id) => id !== exceptUid);

    const chosen: string[] = [];
    while (ids.length > 0 && chosen.length < count) {
      const index = Math.floor(Math.random() * ids.length);
      chosen.push(ids.splice(index, 1)[0]);
    }
    return chosen;
  } catch (e) {
    console.warn(
      "[proofs] Unable to read /users to assign validators (check Firestore rules). Falling back to no validators."
    );
    return [];
  }
}

// ----------------------------
// 3. Création de la preuve
// ----------------------------
export async function submitProof(
  defiId: string,
  photoUri: string,
  commentaire: string
) {
  const user = auth.currentUser;
  if (!user) throw new Error("Utilisateur non connecté");

  const preuveRef = doc(collection(db, "preuves"));
  const preuveId = preuveRef.id;

  // 🔥 Upload Storage
  const photoUrl = await uploadProofImage(photoUri, preuveId);

  // 🔥 Récupérer la difficulté depuis le activeDefi de l'utilisateur
  let difficulty: "facile" | "moyen" | "difficile" = "facile";
  try {
    const activeSnap = await getDoc(
      doc(db, "users", user.uid, "activeDefi", "perso")
    );
    const activeData = activeSnap.data();
    if (activeData?.difficulte === "moyen") difficulty = "moyen";
    else if (activeData?.difficulte === "difficile") difficulty = "difficile";
  } catch (e) {
    console.warn("[proofs] Impossible de lire activeDefi pour la difficulté:", e);
  }

  // 🔥 Choix des validateurs (legacy)
  const validators = await pickRandomValidators(user.uid, 3);

  const payload: ProofDoc = {
    userId: user.uid,
    defiId,
    difficulty, // ← nouveau champ
    photoUrl,
    commentaire: commentaire ?? "",
    createdAt: serverTimestamp(),
    status: "pending", // ⚠️ on garde le comportement actuel

    assignedValidators: validators,
    votes: {},

    // nouveaux compteurs, initialisés à 0
    votesFor: 0,
    votesAgainst: 0,
  };

  await setDoc(preuveRef, payload);

  // on garde le même retour que l'ancienne version
  return { id: preuveId, url: photoUrl };
}

// ----------------------------
// 4. Mise à jour commentaire
// ----------------------------
export async function updateProofComment(
  proofId: string,
  commentaire: string
) {
  await updateDoc(doc(db, "preuves", proofId), {
    commentaire,
  });
}

// ----------------------------
// 5. Vote validateur (nouveau système de comptage)
// ----------------------------
export async function voteOnProof(proofId: string, approve: boolean) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");

  const ref = doc(db, "preuves", proofId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Proof not found");

  const data = snap.data();
  const voters = data.voters || {};

  // 🚫 Already voted → block
  if (voters[uid]) {
    console.warn("User already voted, skipping");
    return;
  }

  // 🔥 Build update payload
  const updatePayload: any = {
    [`voters.${uid}`]: true,                // register the vote
    votesFor: approve ? increment(1) : data.votesFor || 0,
    votesAgainst: approve ? (data.votesAgainst || 0) : increment(1),
  };

  await updateDoc(ref, updatePayload);
}



// ----------------------------
// 6. Finalize proof (full workflow)
// ----------------------------
export async function finalizeProof(proofId: string) {
  const ref = doc(db, "preuves", proofId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  const uid = data.userId;
  const validated = data.votesFor >= 3;
  const rejected = data.votesAgainst >= 3;

  if (!validated && !rejected) return;

  // Write final status
  await updateDoc(ref, {
    status: validated ? "validated" : "rejected",
    decidedAt: serverTimestamp(),
  });

  // Path to user's active défi
  const activeRef = doc(db, "users", uid, "activeDefi", "perso");

  if (validated) {
    // Mark ready to claim
    await updateDoc(activeRef, {
      readyToClaim: true,
      readyToRetry: false,
      finalProofId: proofId,
    });
  } else {
    // Mark ready to retry
    await updateDoc(activeRef, {
      readyToRetry: true,
      readyToClaim: false,
      finalProofId: proofId,
    });
  }
}
