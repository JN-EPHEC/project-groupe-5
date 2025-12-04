import { auth, db } from "@/firebaseConfig";
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    serverTimestamp,
    setDoc,
    updateDoc
} from "firebase/firestore";

// -------------------------------------------------------------
// 🔎 Recherche d’utilisateurs — VERSION ROBUSTE
// -------------------------------------------------------------
export async function searchUsers(text: string) {
  if (!text || text.length < 1) return [];

  const lower = text.toLowerCase();
  const uid = auth.currentUser?.uid;

  // On lit TOUT les users pour éviter les champs manquants
  const snap = await getDocs(collection(db, "users"));
  const users = snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));

  // Filtrer avec plusieurs fallback (usernameLowercase, username, firstName)
  return users.filter((u) => {
    if (u.id === uid) return false;

    const unameLower = u.usernameLowercase?.toLowerCase?.() || "";
    const uname = u.username?.toLowerCase?.() || "";
    const fname = u.firstName?.toLowerCase?.() || "";
    const lname = u.lastName?.toLowerCase?.() || "";

    return (
      unameLower.startsWith(lower) ||
      uname.startsWith(lower) ||
      fname.startsWith(lower) ||
      lname.startsWith(lower)
    );
  });
}

export async function getUserProfile(uid: string) {
  if (!uid) {
    return null;
  }

  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { id: uid, ...snap.data() } : null;
}

// -------------------------------------------------------------
// ➕ Envoyer une demande
// -------------------------------------------------------------
export async function sendFriendRequest(targetId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Non connecté.");
  if (!targetId) throw new Error("ID cible invalide.");
  if (targetId === uid) throw new Error("Vous ne pouvez pas vous ajouter.");

  // Déjà amis ? (vérifie uniquement mon côté pour éviter une lecture interdite chez la cible)
  const meHasFriend = await getDoc(doc(db, "users", uid, "friends", targetId));
  if (meHasFriend.exists()) {
    throw new Error("Vous êtes déjà amis.");
  }

  // Déjà une demande en attente ? on met l'ID du doc = expéditeur pour unicité
  const reqRef = doc(db, "users", targetId, "friendRequests", uid);
  // On ne peut pas lire la boîte de réception de la cible avec les règles actuelles,
  // donc on tente simplement l'écriture : si une demande existe déjà avec ce même ID, setDoc remplacera/écrasera.
  // Pour éviter un écrasement silencieux, vous pouvez ajouter un champ createdAt immuable contrôlé par rules ou utiliser merge:false.

  try {
    await setDoc(reqRef, {
      from: uid,
      status: "pending",
      createdAt: serverTimestamp(),
    });
  } catch (e: any) {
    if (e?.code === "permission-denied" || /insufficient permissions/i.test(String(e?.message || ""))) {
      throw new Error("Demande déjà envoyée.");
    }
    throw e;
  }
}

// -------------------------------------------------------------
// 🟩 Accepter une demande
// -------------------------------------------------------------
export async function acceptFriendRequest(userId: string, requestId: string, fromId: string) {
  // Marquer la demande comme acceptée
  await updateDoc(doc(db, "users", userId, "friendRequests", requestId), {
    status: "accepted",
  });

  // Ajouter dans /friends des deux côtés
  await setDoc(doc(db, "users", userId, "friends", fromId), {
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "users", fromId, "friends", userId), {
    createdAt: serverTimestamp(),
  });

  // Supprimer la demande pour nettoyer
  await deleteDoc(doc(db, "users", userId, "friendRequests", requestId));
}

// -------------------------------------------------------------
// 🟥 Refuser une demande
// -------------------------------------------------------------
export async function rejectFriendRequest(userId: string, requestId: string) {
  try {
    await deleteDoc(doc(db, "users", userId, "friendRequests", requestId));
  } catch (e) {
    console.log("delete request error", e);
  }
}
