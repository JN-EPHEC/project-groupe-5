// firebase/clubs.ts
import { auth, db, storage } from "@/firebaseConfig";
import {
    arrayRemove,
    arrayUnion,
    collection,
    doc,
    getDoc,
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
  photoUri?: string
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

  await updateDoc(clubRef, {
    members: arrayUnion(uid),
  });

  await updateDoc(doc(db, "users", uid), {
    clubId: clubId,
  });
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
// GET CLUB DATA
// -------------------------------------------------------------
export async function getClub(clubId: string) {
  const snap = await getDoc(doc(db, "clubs", clubId));
  return snap.exists() ? snap.data() : null;
}

export async function updateClubFirebase(clubId: string, data: { name?: string; description?: string; city?: string; photoUri?: string }) {
  const updates: any = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.description !== undefined) updates.description = data.description;
  if (data.city !== undefined) updates.city = data.city;
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
