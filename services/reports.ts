import { db } from "@/firebaseConfig";
import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";

/**
 * Envoie un signalement et masque immédiatement le contenu concerné.
 * @param challengeId - ID du défi global (ex: "Recycler bouteilles")
 * @param challengeTitle - Titre du défi
 * @param proofId - ID spécifique de la preuve utilisateur (le post à masquer)
 * @param proofContent - L'URL de l'image OU le texte du commentaire (pour l'affichage admin)
 * @param proofType - 'image' ou 'text' (pour savoir comment l'afficher dans l'admin)
 * @param reason - La raison du signalement
 * @param userId - L'ID de l'utilisateur qui signale
 */
export const sendReport = async (
  challengeId: string,
  challengeTitle: string,
  proofId: string,       // ID du document preuve
  proofContent: string,  // Url image ou texte commentaire
  proofType: 'image' | 'text', // Type de contenu
  reason: string,
  userId: string
) => {
  try {
    // Sécurité : Si l'ID de la preuve est vide, on arrête tout pour éviter un crash
    if (!proofId) {
      console.error("Erreur: proofId est manquant pour le signalement.");
      return false;
    }

    const batch = writeBatch(db);

    // 1. Créer la référence pour le nouveau signalement
    const newReportRef = doc(collection(db, "reports"));

    batch.set(newReportRef, {
      id: newReportRef.id,
      challengeId,
      challengeTitle,
      proofId,           // Lien vers la preuve
      proofContent,      // Snapshot du contenu
      proofType,         // "image" ou "text"
      reason,
      reportedBy: userId,
      createdAt: serverTimestamp(),
      status: "pending", 
    });

    // 2. Masquer immédiatement la preuve (Mise à jour du document Preuve)
    // 👇 CORRECTION ICI : On utilise "preuves" au lieu de "proofs"
    const proofRef = doc(db, "preuves", proofId); 
    
    batch.update(proofRef, {
      isVisible: false,      // Masqué pour tout le monde immédiatement
      status: "REPORTED"     // Statut intermédiaire
    });

    // 3. Exécuter les deux actions en même temps
    await batch.commit();

    return true;
  } catch (error) {
    console.error("Erreur lors du signalement:", error);
    return false;
  }
};