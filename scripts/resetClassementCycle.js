// scripts/resetClassementCycle.js
// Script Node.js pour reset le classement Firestore toutes les 2 semaines (lundi midi)

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

async function resetClassementCycle(cycleId, classementId) {
  const usersRef = db.collection('classementCycles').doc(cycleId).collection('classements').doc(classementId).collection('users');
  const snapshot = await usersRef.get();
  const batch = db.batch();

  snapshot.forEach(doc => {
    batch.update(doc.ref, {
      rankingPoints: 0,
      qualified: false
    });
  });

  await batch.commit();
  console.log('Classement reset: points à zéro et tous non qualifiés.');
}

// Calcul du prochain reset (demain lundi midi)
function getNextResetDate() {
  const now = new Date();
  let nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + ((8 - now.getDay()) % 7));
  nextMonday.setHours(12, 0, 0, 0);
  return nextMonday;
}

// Exemple d'utilisation
const cycleId = 'CURRENT_CYCLE_ID'; // à remplacer dynamiquement
const classementId = '1'; // ou autre selon la ligue

resetClassementCycle(cycleId, classementId);

// Pour automatiser toutes les 2 semaines, utiliser un cron sur le serveur
// Ex: "0 12 * * 1" (lundi midi)
