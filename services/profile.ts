import { auth, db, storage } from "@/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

export async function uploadProfilePhoto(localUri: string) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Non connecté");
  }

  const response = await fetch(localUri);
  if (!response.ok) {
    throw new Error("Impossible de lire le fichier local");
  }

  const blob = await response.blob();
  const storageRef = ref(storage, `profilePhotos/${user.uid}.jpg`);

  await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });

  const url = await getDownloadURL(storageRef);

  await updateDoc(doc(db, "users", user.uid), {
    photoURL: url,
  });

  return url;
}
