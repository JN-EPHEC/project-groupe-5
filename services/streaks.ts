// services/streaks.ts
import { auth, db } from "@/firebaseConfig";
import { getBelgiumDateKey } from "@/utils/dateKey";
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";

export type StreakMap = Record<string, { status: "validated" }>;

/**
 * Save a day as "streak achieved"
 */
export async function addStreakDayFromStartedAt(startedAt: Date | undefined) {
  if (!startedAt) return;

  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const key = getBelgiumDateKey(startedAt);

  await setDoc(
    doc(db, "users", uid, "streak", key),
    { ok: true },
    { merge: true }
  );

  console.log("[STREAK] added", key);
}

/**
 * Listen to streak documents in Firestore
 */
export function subscribeToStreakDays(uid: string, onUpdate: (map: StreakMap) => void) {
  const ref = collection(db, "users", uid, "streak");

  return onSnapshot(ref, snap => {
    const map: StreakMap = {};
    snap.forEach(d => {
      map[d.id] = { status: "validated" };
    });
    onUpdate(map);
  });
}
