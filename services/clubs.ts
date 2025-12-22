import { auth, db, storage } from "@/firebaseConfig";
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

// Upload photo
export async function uploadClubPhoto(localUri: string, clubId: string) {
  try {
    const response = await fetch(localUri);
    const blob = await response.blob();
    const storageRef = ref(storage, `clubPhotos/${clubId}/profile.jpg`);
    await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
    return await getDownloadURL(storageRef);
  } catch (e) {
    console.warn("Upload photo failed", e);
    return "";
  }
}

// CREATE
export async function createClub(
  name: string,
  city: string,
  description: string,
  photoUri?: string,
  isPrivate: boolean = false
) {
  const user = auth.currentUser;
  if (!user) throw new Error("Utilisateur non connecté.");

  const clubRef = doc(collection(db, "clubs"));
  const clubId = clubRef.id;

  let photoUrl = "";
  if (photoUri) {
    photoUrl = await uploadClubPhoto(photoUri, clubId);
  }

  const payload = {
    name,
    city,
    description,
    photoUrl,
    ownerId: user.uid,
    createdAt: serverTimestamp(),
    members: [user.uid],
    officers: [],
    isPrivate: !!isPrivate,
  };

  await setDoc(clubRef, payload);
  await updateDoc(doc(db, "users", user.uid), { clubId: clubId });

  return { id: clubId, ...payload };
}

// JOIN
export async function joinClub(clubId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Non connecté.");
  const clubRef = doc(db, "clubs", clubId);
  
  const snap = await getDoc(clubRef);
  if (!snap.exists()) throw new Error("Club introuvable.");
  const data: any = snap.data();

  try {
    if (data?.isPrivate) {
      // Demande d'adhésion si privé
      await setDoc(doc(db, "clubs", clubId, "joinRequests", uid), {
        userId: uid,
        userName: auth.currentUser?.displayName || null,
        photoUrl: auth.currentUser?.photoURL || null,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      return;
    }

    // Join public direct via transaction
    await runTransaction(db, async (tx) => {
        const clubDoc = await tx.get(clubRef);
        if (!clubDoc.exists()) throw "Club introuvable";
        tx.update(clubRef, { members: arrayUnion(uid) });
        tx.update(doc(db, "users", uid), { clubId: clubId });
    });

  } catch (err: any) {
    throw new Error(`Erreur lors de l'adhésion: ${err?.message || err}`);
  }
}

export async function requestJoinClub(clubId: string) {
  // Alias pour joinClub sur un club privé, même logique
  await joinClub(clubId); 
}

export async function acceptJoinRequest(clubId: string, userId: string) {
  const clubRef = doc(db, "clubs", clubId);
  const reqRef = doc(db, "clubs", clubId, "joinRequests", userId);
  const userRef = doc(db, "users", userId);

  await runTransaction(db, async (tx) => {
    const clubSnap = await tx.get(clubRef as any);
    if (!clubSnap.exists()) throw "Club introuvable.";
    
    tx.update(clubRef, { members: arrayUnion(userId) });
    tx.update(userRef, { clubId: clubId });
    tx.delete(reqRef);
  });
}

export async function rejectJoinRequest(clubId: string, userId: string) {
  try { await deleteDoc(doc(db, "clubs", clubId, "joinRequests", userId)); } catch (e) {}
}

// LEAVE
export async function leaveClub(clubId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Non connecté.");

  const clubRef = doc(db, "clubs", clubId);
  const userRef = doc(db, "users", uid);

  await runTransaction(db, async (tx) => {
      const clubSnap = await tx.get(clubRef);
      if (!clubSnap.exists()) throw "Club introuvable";

      // On retire l'user des membres ET des officiers (au cas où)
      tx.update(clubRef, {
        members: arrayRemove(uid),
        officers: arrayRemove(uid),
      });

      // On retire le clubId du profil user
      tx.update(userRef, {
        clubId: null,
      });
  });
}

// DELETE
export async function deleteClub(clubId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Non connecté.");

  const clubRef = doc(db, "clubs", clubId);
  
  await runTransaction(db, async (tx) => {
      const snapshot = await tx.get(clubRef);
      if (!snapshot.exists()) return; 

      const data = snapshot.data() as any;
      if (data.ownerId !== uid) throw "Seul le chef peut supprimer le club.";

      tx.delete(clubRef);
      tx.update(doc(db, "users", uid), { clubId: null });
  });
}

// UPDATE
export async function updateClubFirebase(clubId: string, data: any) {
  const updates: any = {};
  if (data.name) updates.name = data.name;
  if (data.description) updates.description = data.description;
  if (data.city) updates.city = data.city;
  if (data.isPrivate !== undefined) updates.isPrivate = !!data.isPrivate;
  if (data.photoUri) {
    const url = await uploadClubPhoto(data.photoUri, clubId);
    updates.photoUrl = url;
  }
  if (Object.keys(updates).length > 0) await updateDoc(doc(db, "clubs", clubId), updates);
}

// ROLES
export async function promoteOfficer(clubId: string, uid: string) {
  await updateDoc(doc(db, "clubs", clubId), { officers: arrayUnion(uid) });
}

export async function demoteOfficer(clubId: string, uid: string) {
  await updateDoc(doc(db, "clubs", clubId), { officers: arrayRemove(uid) });
}

export async function transferOwnership(clubId: string, newOwnerId: string) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Non connecté.");
  const clubRef = doc(db, "clubs", clubId);
  
  await runTransaction(db, async (tx) => {
      const snapshot = await tx.get(clubRef);
      if (!snapshot.exists()) throw "Club introuvable.";
      const data = snapshot.data() as any;
      if (data.ownerId !== currentUser.uid) throw "Seul le chef peut transférer le club.";

      tx.update(clubRef, {
        ownerId: newOwnerId,
        members: arrayUnion(newOwnerId),
        officers: arrayRemove(newOwnerId),
      });
  });
}

export async function removeMember(clubId: string, targetUid: string) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Non connecté.");

  const clubRef = doc(db, "clubs", clubId);
  const targetUserRef = doc(db, "users", targetUid);

  await runTransaction(db, async (tx) => {
      const snapshot = await tx.get(clubRef);
      if (!snapshot.exists()) throw "Club introuvable.";

      const data = snapshot.data() as any;
      const ownerId = data.ownerId;
      const officers: string[] = Array.isArray(data.officers) ? data.officers : [];

      const isAdmin = ownerId === currentUser.uid || officers.includes(currentUser.uid);
      if (!isAdmin) throw "Permissions insuffisantes.";

      if (targetUid === ownerId) throw "Impossible de supprimer le chef.";

      const targetIsOfficer = officers.includes(targetUid);
      if (targetIsOfficer && currentUser.uid !== ownerId) throw "Un adjoint ne peut être supprimé que par le chef.";

      tx.update(clubRef, {
        members: arrayRemove(targetUid),
        officers: arrayRemove(targetUid),
      });
      tx.update(targetUserRef, { clubId: null });
  });
}