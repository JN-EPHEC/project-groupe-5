// firebase/clubs.ts
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

// Upload photo optionnel
export async function uploadClubPhoto(localUri: string, clubId: string) {
  const response = await fetch(localUri);
  const blob = await response.blob();

  const storageRef = ref(storage, `clubPhotos/${clubId}/profile.jpg`);
  await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });

  return await getDownloadURL(storageRef);
}

// -------------------------------------------------------------
//  CREATE CLUB
// -------------------------------------------------------------
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

  // user profile → assign club id
  await updateDoc(doc(db, "users", user.uid), {
    clubId: clubId,
  });

  return { id: clubId, ...payload };
}

// -------------------------------------------------------------
// JOIN CLUB
// -------------------------------------------------------------
export async function joinClub(clubId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Non connecté.");
  const clubRef = doc(db, "clubs", clubId);
  // read minimal data to determine privacy
  const snap = await getDoc(clubRef);
  if (!snap.exists()) throw new Error("Club introuvable.");
  const data: any = snap.data();
  const isPrivate = Boolean(data?.isPrivate);

  try {
    if (isPrivate) {
      // Private club: create only the join request doc
      const reqRef = doc(db, "clubs", clubId, "joinRequests", uid);
      await setDoc(reqRef, {
        userId: uid,
        userName: auth.currentUser?.displayName || null,
        photoUrl: auth.currentUser?.photoURL || null,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      return;
    }

    // Public club: update ONLY the members array
    await updateDoc(clubRef, {
      members: arrayUnion(uid),
    });
  } catch (err: any) {
    // rethrow with clearer message while keeping original error attached
    const message = err?.message || String(err);
    throw new Error(`joinClub failed: ${message}`);
  }
}

// Request to join a private club: create a joinRequests doc under club
export async function requestJoinClub(clubId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Non connecté.");
  const reqRef = doc(db, "clubs", clubId, "joinRequests", uid);
  await setDoc(reqRef, {
    userId: uid,
    userName: auth.currentUser?.displayName || null,
    photoUrl: auth.currentUser?.photoURL || null,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}

export async function cancelJoinRequest(clubId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Non connecté.");
  try {
    await deleteDoc(doc(db, "clubs", clubId, "joinRequests", uid));
  } catch (e) {
    // ignore
  }
}

export async function acceptJoinRequest(clubId: string, userId: string) {
  const clubRef = doc(db, "clubs", clubId);
  const reqRef = doc(db, "clubs", clubId, "joinRequests", userId);

  await runTransaction(db, async (tx) => {
    const clubSnap = await tx.get(clubRef as any);
    if (!clubSnap.exists()) throw new Error("Club introuvable.");
    // add user to members
    tx.update(clubRef, { members: arrayUnion(userId) });
    // remove join request
    tx.delete(reqRef);
  });
}

export async function rejectJoinRequest(clubId: string, userId: string) {
  try { await deleteDoc(doc(db, "clubs", clubId, "joinRequests", userId)); } catch (e) {}
}

// -------------------------------------------------------------
// LEAVE CLUB
// -------------------------------------------------------------
export async function leaveClub(clubId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Non connecté.");

  const clubRef = doc(db, "clubs", clubId);

  await updateDoc(clubRef, {
    members: arrayRemove(uid),
    officers: arrayRemove(uid),
  });

  await updateDoc(doc(db, "users", uid), {
    clubId: null,
  });
}

// -------------------------------------------------------------
// 🗑️ Supprimer un club (dernier membre / propriétaire uniquement)
// -------------------------------------------------------------
export async function deleteClub(clubId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Non connecté.");

  const clubRef = doc(db, "clubs", clubId);
  const snapshot = await getDoc(clubRef);
  if (!snapshot.exists()) {
    await updateDoc(doc(db, "users", uid), { clubId: null });
    return;
  }

  const data = snapshot.data() as any;
  if (data.ownerId !== uid) {
    throw new Error("Seul le chef peut supprimer le club.");
  }

  const members = Array.isArray(data.members) ? data.members : [];
  if (members.length > 1) {
    throw new Error("Impossible de supprimer un club qui compte encore des membres.");
  }

  await deleteDoc(clubRef);
  await updateDoc(doc(db, "users", uid), { clubId: null });
}

// -------------------------------------------------------------
// GET CLUB DATA
// -------------------------------------------------------------
export async function getClub(clubId: string) {
  const snap = await getDoc(doc(db, "clubs", clubId));
  return snap.exists() ? snap.data() : null;
}

export async function updateClubFirebase(clubId: string, data: { name?: string; description?: string; city?: string; photoUri?: string; isPrivate?: boolean }) {
  const updates: any = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.description !== undefined) updates.description = data.description;
  if (data.city !== undefined) updates.city = data.city;
  if (data.isPrivate !== undefined) updates.isPrivate = !!data.isPrivate;
  if (data.photoUri) {
    const url = await uploadClubPhoto(data.photoUri, clubId);
    updates.photoUrl = url;
  }
  if (Object.keys(updates).length === 0) return;
  await updateDoc(doc(db, "clubs", clubId), updates);
}

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
  const snapshot = await getDoc(clubRef);
  if (!snapshot.exists()) throw new Error("Club introuvable.");

  const data = snapshot.data() as any;
  if (data.ownerId !== currentUser.uid) {
    throw new Error("Seul le chef peut transférer le club.");
  }

  await updateDoc(clubRef, {
    ownerId: newOwnerId,
    members: arrayUnion(newOwnerId),
    officers: arrayRemove(newOwnerId),
  });
}

// -------------------------------------------------------------
// REMOVE A MEMBER
// -------------------------------------------------------------
export async function removeMember(clubId: string, targetUid: string) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Non connecté.");

  const clubRef = doc(db, "clubs", clubId);
  const snapshot = await getDoc(clubRef);
  if (!snapshot.exists()) throw new Error("Club introuvable.");

  const data = snapshot.data() as any;
  const ownerId = data.ownerId;
  const officers: string[] = Array.isArray(data.officers) ? data.officers : [];

  const isAdmin = ownerId === currentUser.uid || officers.includes(currentUser.uid);
  if (!isAdmin) throw new Error("Permissions insuffisantes.");

  if (targetUid === ownerId) {
    throw new Error("Impossible de supprimer le chef du club.");
  }

  const targetIsOfficer = officers.includes(targetUid);
  if (targetIsOfficer && currentUser.uid !== ownerId) {
    throw new Error("Un adjoint ne peut être supprimé que par le chef. Rétrogradez-le d'abord.");
  }

  // Safe update: remove from members and officers arrays (if present)
  await updateDoc(clubRef, {
    members: arrayRemove(targetUid),
    officers: arrayRemove(targetUid),
  });
}
