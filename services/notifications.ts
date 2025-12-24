import { db } from "@/firebaseConfig";
import { addDoc, collection } from "firebase/firestore";

// ============================================================================
// SERVICE D'ENVOI DE NOTIFICATIONS (Distantes / Entre utilisateurs)
// ============================================================================

/**
 * Fonction générique pour écrire une notif dans la DB de quelqu'un d'autre.
 */
export async function sendNotification(
  targetUserId: string,
  title: string,
  body: string,
  type: 'info' | 'alert' | 'success' = 'info',
  data: any = {}
) {
  if (!targetUserId) return;
  
  try {
    await addDoc(collection(db, "users", targetUserId, "notifications"), {
      title,
      body,
      type,
      read: false,
      createdAt: new Date(),
      data,
    });
  } catch (error) {
    console.error("Erreur envoi notification:", error);
  }
}

/**
 * 1. DEMANDE D'AMI
 * Appelle ceci quand tu envoies une demande.
 */
export async function notifyFriendRequest(targetUserId: string, fromUserName: string) {
  await sendNotification(
    targetUserId,
    "Nouvelle demande d'ami",
    `${fromUserName} souhaite vous ajouter en ami.`,
    'info',
    { type: 'friend_request' }
  );
}

/**
 * 2. DEMANDE CLUB (Pour les admins)
 * Appelle ceci quand quelqu'un postule.
 */
export async function notifyClubAdmins(clubId: string, clubName: string, candidateName: string) {
  try {
    // 1. On trouve le club pour récupérer les admins
    // Note: Si tu as déjà la liste des admins, utilise sendClubRequestToAdminsList direct
    // Ici on suppose qu'on doit les chercher
    // C'est souvent mieux de passer la liste des admins en argument pour éviter des lectures DB
  } catch (e) {
    console.log(e);
  }
}

export async function sendClubRequestToAdminsList(adminIds: string[], clubName: string, candidateName: string) {
  if (!adminIds || adminIds.length === 0) return;

  // On envoie la notif à CHAQUE admin
  const promises = adminIds.map(adminId => 
    sendNotification(
      adminId,
      "Demande d'adhésion Club",
      `${candidateName} souhaite rejoindre le club "${clubName}".`,
      'info',
      { type: 'club_request' }
    )
  );
  await Promise.all(promises);
}

/**
 * 3. RÉSULTAT VALIDATION DÉFI
 * Appelle ceci après le décompte des votes.
 */
export async function notifyChallengeResult(targetUserId: string, challengeTitle: string, isValidated: boolean) {
  if (isValidated) {
    await sendNotification(
      targetUserId,
      "Défi Validé ! 🎉",
      `Bravo ! La communauté a validé votre défi "${challengeTitle}". Vous avez gagné vos points.`,
      'success'
    );
  } else {
    await sendNotification(
      targetUserId,
      "Défi Refusé ❌",
      `Votre défi "${challengeTitle}" n'a pas été validé. La photo ne correspondait pas assez aux critères.`,
      'alert'
    );
  }
}

// ============================================================================
// FONCTIONS DE COMPATIBILITÉ (Pour ne pas casser ton ancien code)
// ============================================================================
// Si ton app appelle encore markDefiDone, on laisse une fonction vide pour éviter le crash.
// La logique de rappel est maintenant gérée automatiquement à 7h par le Context.

export async function markDefiDone(date: Date = new Date()) {
  // Plus nécessaire avec le rappel automatique de 7h, mais gardé pour éviter les erreurs d'import.
  console.log("Defi marked as done (Logic moved to Firestore/Context)");
}

export async function clearDefiDoneFlag() {
  // Idem
}

export async function scheduleDailyReminder() {
   // Géré par notifications-context.tsx maintenant
   console.log("Reminder scheduling is handled by NotificationsProvider now.");
   return true;
}