// src/classement/services/classementLifecycle.ts
import { db } from "@/firebaseConfig";
import {
  doc,
  getDoc,
  setDoc
} from "firebase/firestore";
import { populateClassementForCycle } from "./populateClassement";

function getCurrentCycleId(): string {
  const now = new Date();

  // Monday (0:00) → weekStart
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));

  // Two-week window start
  const cycleStart = new Date(weekStart);
  if (now.getDate() - weekStart.getDate() >= 7)
    cycleStart.setDate(cycleStart.getDate() + 7);

  cycleStart.setHours(13, 0, 0, 0);

  // End Monday next week at 12:00
  const cycleEnd = new Date(cycleStart);
  cycleEnd.setDate(cycleEnd.getDate() + 14);
  cycleEnd.setHours(12, 0, 0, 0);

  return cycleStart.toISOString().split("T")[0];
}

export async function ensureCurrentClassementCycle() {
  const cycleId = getCurrentCycleId();

  const ref = doc(db, "classementCycles", cycleId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    // CREATE CYCLE
    const start = new Date(cycleId + "T13:00:00");
    const end = new Date(start);
    end.setDate(start.getDate() + 14);
    end.setHours(12, 0, 0, 0);

    await setDoc(ref, {
      startAt: start,
      endAt: end,
      status: "active",
    });

    // Populate classement #1
    await populateClassementForCycle(cycleId, "1");
  }

  return cycleId;
}
