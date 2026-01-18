// src/classement/services/awardClassementPoints.ts
import { auth, db } from "@/firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

/**
 * awardClassementPoints signature changed over time. Keep it backward-compatible:
 * - awardClassementPoints(cycleId, classementId, uid, points)
 * - awardClassementPoints(points) // convenience: will resolve active cycle, classementId='1' and current uid
 */
export async function awardClassementPoints(
  cycleIdOrPoints: string | number,
  classementId?: string,
  uid?: string,
  points?: number
) {
  let cycleId: string | undefined = undefined;

  // Backwards-compatible handling: called with a single numeric argument (points)
  if (typeof cycleIdOrPoints === "number" && classementId === undefined && uid === undefined && points === undefined) {
    const pts = cycleIdOrPoints;
    points = pts;

    // Resolve current UID
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) return;
    uid = currentUid;

    // Default classementId
    classementId = "1";

    // Find active cycle
    const q = query(
      collection(db, "classementCycles"),
      where("status", "in", ["active", "locking"]),
      limit(1)
    );

    const snaps = await getDocs(q);
    if (snaps.empty) return;
    cycleId = snaps.docs[0].id;
  } else {
    // Normal signature: cycleIdOrPoints is actually cycleId
    cycleId = String(cycleIdOrPoints || "");
  }

  if (!cycleId || !uid || !classementId || typeof points !== "number") return;

  const userRef = doc(
    db,
    "classementCycles",
    cycleId,
    "classements",
    classementId,
    "users",
    uid
  );

  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    // CREATE user in classement for the cycle
    await setDoc(userRef, {
      uid: uid,
      displayName: "Utilisateur", // overwritten later by populate
      rankingPoints: points,
      qualified: false,
    });
  } else {
    // UPDATE points
    await updateDoc(userRef, {
      rankingPoints: increment(points),
    });
  }

  console.log(`Classement points added: +${points}`);
}
