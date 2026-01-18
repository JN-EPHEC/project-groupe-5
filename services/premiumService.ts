// Fichier: services/premiumService.ts
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { UserProfile } from "@/hooks/user-context";

export const checkPremiumStatus = async (user: UserProfile | null): Promise<boolean> => {
  if (!user || !user.uid) return false;

  try {
    // 1. On vise la collection créée par l'extension Stripe
    const subscriptionsRef = collection(db, 'customers', user.uid, 'subscriptions');

    // 2. On cherche un abonnement 'active' ou 'trialing'
    const q = query(
      subscriptionsRef, 
      where('status', 'in', ['active', 'trialing'])
    );

    const querySnapshot = await getDocs(q);

    // 3. Si on trouve un document, c'est Gagné !
    if (!querySnapshot.empty) {
      console.log("✅ Statut Premium confirmé pour l'utilisateur:", user.uid);
      return true;
    } else {
      console.log("❌ Pas d'abonnement actif trouvé pour:", user.uid);
      return false;
    }

  } catch (error) {
    console.error("Erreur lors de la vérification du statut Premium:", error);
    return false;
  }
};
