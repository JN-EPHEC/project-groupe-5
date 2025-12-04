import { auth, db } from "@/firebaseConfig";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";

async function updatePresence(state: boolean) {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return;
  }

  try {
    await updateDoc(doc(db, "users", uid), {
      online: state,
      lastActive: serverTimestamp(),
    });
  } catch (error) {
    console.warn("presence update error", error);
  }
}

export async function setUserOnline() {
  await updatePresence(true);
}

export async function setUserOffline() {
  await updatePresence(false);
}
