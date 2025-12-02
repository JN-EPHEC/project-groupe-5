import { auth, db, storage } from "@/firebaseConfig";
import { collection, doc, getDocs, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

export type ProofStatus = "pending" | "validated" | "rejected";

export type ProofDoc = {
  userId: string;
  defiId: string;
  photoUrl: string;
  commentaire: string;
  createdAt: any;
  status: ProofStatus;
  assignedValidators: string[];
  votes: Record<string, boolean>;
};

// ----------------------------
// 1. Upload de l'image
// ----------------------------
export async function uploadProofImage(localUri: string, preuveId: string): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();

  const storageRef = ref(storage, `preuves/${preuveId}/image.jpg`);
  await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });

  return await getDownloadURL(storageRef);
}

// ----------------------------
// 2. Sélection des validateurs
// ----------------------------
export async function pickRandomValidators(exceptUid: string, count = 3): Promise<string[]> {
  try {
    const snap = await getDocs(collection(db, "users"));
    const ids = snap.docs.map((d) => d.id).filter((id) => id !== exceptUid);

    const chosen: string[] = [];
    while (ids.length > 0 && chosen.length < count) {
      const index = Math.floor(Math.random() * ids.length);
      chosen.push(ids.splice(index, 1)[0]);
    }
    return chosen;
  } catch (e) {
    console.warn("[proofs] Unable to read /users to assign validators (check Firestore rules). Falling back to no validators.");
    return [];
  }
}

// ----------------------------
// 3. Création de la preuve
// ----------------------------
export async function submitProof(defiId: string, photoUri: string, commentaire: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("Utilisateur non connecté");

  const preuveRef = doc(collection(db, "preuves"));
  const preuveId = preuveRef.id;

  // Upload Storage
  const photoUrl = await uploadProofImage(photoUri, preuveId);

  // Choix des validateurs
  const validators = await pickRandomValidators(user.uid, 3);

  const payload: ProofDoc = {
    userId: user.uid,
    defiId,
    photoUrl,
    commentaire: commentaire ?? "",
    createdAt: serverTimestamp(),
    status: "pending",
    assignedValidators: validators,
    votes: {},
  };

  await setDoc(preuveRef, payload);

  return { id: preuveId, url: photoUrl };
}

// ----------------------------
// 4. Mise à jour commentaire
// ----------------------------
export async function updateProofComment(proofId: string, commentaire: string) {
  await updateDoc(doc(db, "preuves", proofId), {
    commentaire,
  });
}

// ----------------------------
// 5. Vote validateur
// ----------------------------
export async function validatorVote(proofId: string, validatorId: string, approve: boolean) {
  await updateDoc(doc(db, "preuves", proofId), {
    status: approve ? "validated" : "rejected",
    [`votes.${validatorId}`]: approve,
  });
}
