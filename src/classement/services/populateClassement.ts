// src/classement/services/populateClassement.ts
import { db } from "@/firebaseConfig";
import {
    collection,
    doc,
    getDocs,
    setDoc,
} from "firebase/firestore";

export async function populateClassementForCycle(
  cycleId: string,
  classementId: string
) {
  // GET all real users
  const allUsers = await getDocs(collection(db, "users"));

  for (const u of allUsers.docs) {
    const data = u.data();
    const display =
      data.username ||
      `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim() ||
      data.email ||
      "Utilisateur";

    await setDoc(
      doc(
        db,
        "classementCycles",
        cycleId,
        "classements",
        classementId,
        "users",
        u.id
      ),
      {
        uid: u.id,
        displayName: display,
        rankingPoints: 0,
        qualified: false,
        avatarUrl: data.photoURL ?? null,
      }
    );
  }

  console.log("Classement populated for cycle:", cycleId);
}

// Fake users for display
export function generateFakeUsers(count: number, startRank: number) {
  const fake: any[] = [];
  for (let i = 0; i < count; i++) {
    fake.push({
    uid: `fake-${startRank + i + 1}`,
    displayName: `EcoJoueur ${startRank + i + 1}`,
    rankingPoints: 0,
    rank: startRank + i + 1,
    isFake: true,
    qualified: false,
    });
  }
  return fake;
}
