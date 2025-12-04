import { auth, db, storage } from "@/firebaseConfig";
import * as FileSystem from "expo-file-system";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Platform } from "react-native";

const PROFILE_PATH_SEGMENT = "photoDeProfilUser";
const PROFILE_FILENAME = "profile.jpg";

async function fetchImageBlob(uri: string): Promise<Blob> {
	if (!uri) throw new Error("URI invalide.");

	let normalizedUri = uri;

	if (uri.startsWith("blob:")) {
		if (Platform.OS === "web") {
			const webResponse = await fetch(uri);
			if (!webResponse.ok) throw new Error("Impossible de lire l'image.");
			return await webResponse.blob();
		}

		const fileUri = `${FileSystem.cacheDirectory ?? ""}temp-profile.jpg`;
		try {
			const base64 = await FileSystem.readAsStringAsync(uri, {
				encoding: FileSystem.EncodingType.Base64,
			});

			await FileSystem.writeAsStringAsync(fileUri, base64, {
				encoding: FileSystem.EncodingType.Base64,
			});

			normalizedUri = fileUri;
		} catch {
			const fallbackResponse = await fetch(uri);
			if (!fallbackResponse.ok) throw new Error("Impossible de lire l'image.");
			return await fallbackResponse.blob();
		}
	}

	const response = await fetch(normalizedUri);
	if (!response.ok) throw new Error("Impossible de lire l'image.");

	return await response.blob();
}

export async function uploadUserProfilePhoto(uri: string): Promise<string> {
	const currentUser = auth.currentUser;
	if (!currentUser?.uid) {
		throw new Error("Utilisateur non connecté.");
	}

	const blob = await fetchImageBlob(uri);
	const storagePath = `${PROFILE_PATH_SEGMENT}/${currentUser.uid}/${PROFILE_FILENAME}`;
	const storageRef = ref(storage, storagePath);

	try {
		await uploadBytes(storageRef, blob, { contentType: blob.type || "image/jpeg" });
	} catch {
		throw new Error("Échec de l'envoi de la photo de profil.");
	}

	let downloadURL: string;
	try {
		downloadURL = await getDownloadURL(storageRef);
	} catch {
		throw new Error("Impossible de récupérer l'URL de téléchargement.");
	}

	try {
		await updateDoc(doc(db, "users", currentUser.uid), { photoURL: downloadURL });
	} catch {
		throw new Error("Échec de la mise à jour du profil utilisateur.");
	}

	return downloadURL;
}

export async function getUserProfilePhoto(userId: string): Promise<string | null> {
	if (!userId) {
		throw new Error("Identifiant utilisateur manquant.");
	}

	const userDocRef = doc(db, "users", userId);
	const snap = await getDoc(userDocRef);
	if (!snap.exists()) {
		return null;
	}

	const data = snap.data();
	const photoURL = typeof data?.photoURL === "string" ? data.photoURL : null;
	return photoURL ?? null;
}
