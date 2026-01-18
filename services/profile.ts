import { auth, db, storage } from "@/firebaseConfig";
// 👇 CHANGEMENT ICI : On utilise des imports nommés pour éviter l'erreur "does not exist"
import {
  cacheDirectory,
  EncodingType,
  readAsStringAsync,
  writeAsStringAsync
} from "expo-file-system";
import { doc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Platform } from "react-native";

const PROFILE_STORAGE_SEGMENT = "photoDeProfilUser";
const PROFILE_FILENAME = "profile.jpg";

async function toBlob(uri: string): Promise<Blob> {
  if (!uri) {
    throw new Error("URI invalide.");
  }

  let normalizedUri = uri;

  if (uri.startsWith("blob:")) {
    if (Platform.OS === "web") {
      const webResponse = await fetch(uri);
      if (!webResponse.ok) {
        throw new Error("Impossible de lire l'image.");
      }
      return await webResponse.blob();
    }

    // 👇 Utilisation directe de cacheDirectory importé
    const cacheUri = `${cacheDirectory ?? ""}temp-profile.jpg`;
    
    try {
      // 👇 Utilisation directe de readAsStringAsync et EncodingType
      const base64 = await readAsStringAsync(uri, {
        encoding: EncodingType.Base64,
      });
      
      // 👇 Utilisation directe de writeAsStringAsync
      await writeAsStringAsync(cacheUri, base64, {
        encoding: EncodingType.Base64,
      });
      
      normalizedUri = cacheUri;
    } catch {
      const fallbackResponse = await fetch(uri);
      if (!fallbackResponse.ok) {
        throw new Error("Impossible de lire l'image.");
      }
      return await fallbackResponse.blob();
    }
  }

  const response = await fetch(normalizedUri);
  if (!response.ok) {
    throw new Error("Impossible de lire l'image.");
  }

  return await response.blob();
}

export async function uploadProfilePhoto(uri: string): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser?.uid) {
    throw new Error("Utilisateur non connecté.");
  }

  const blob = await toBlob(uri);
  const storagePath = `${PROFILE_STORAGE_SEGMENT}/${currentUser.uid}/${PROFILE_FILENAME}`;
  const storageRef = ref(storage, storagePath);

  try {
    // Si blob.type est indéfini, on force "image/jpeg"
    await uploadBytes(storageRef, blob, { contentType: blob.type || "image/jpeg" });
  } catch (error) {
    console.error(error);
    throw new Error("Échec de l'envoi de la photo de profil.");
  }

  let downloadURL: string;
  try {
    downloadURL = await getDownloadURL(storageRef);
  } catch (error) {
    console.error(error);
    throw new Error("Impossible de récupérer l'URL de la photo.");
  }

  try {
    await updateDoc(doc(db, "users", currentUser.uid), { photoURL: downloadURL });
  } catch (error) {
    console.error(error);
    throw new Error("Échec de la mise à jour du profil utilisateur.");
  }

  return downloadURL;
}