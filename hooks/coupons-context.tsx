import { db } from "@/firebaseConfig";
import { useUser } from "@/hooks/user-context";
import { collection, deleteDoc, doc, onSnapshot, runTransaction } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";

export type Coupon = {
  id: string;
  name: string;
  voucherAmountEuro: number;
  code: string;
  expiresAt: string; 
  obtainedAt: number;
};

type CouponsContextType = {
  coupons: Coupon[];
  // addCoupon renvoie maintenant true si succès, false si échec (stock épuisé)
  addCoupon: (rewardId: string) => Promise<boolean>; 
  hasCoupon: (rewardId: string) => boolean;
  loading: boolean;
};

const CouponsContext = createContext<CouponsContextType | undefined>(undefined);

export function CouponsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. ÉCOUTER MES COUPONS + NETTOYAGE AUTO
  useEffect(() => {
    if (!user) {
      setCoupons([]);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, "users", user.uid, "coupons"), (snapshot) => {
      const list: Coupon[] = [];
      const now = new Date();

      snapshot.forEach((document) => {
        const data = document.data() as Coupon;
        const expiryDate = new Date(data.expiresAt);
        
        if (expiryDate < now) {
          deleteDoc(doc(db, "users", user.uid, "coupons", document.id));
        } else {
          list.push(data);
        }
      });

      setCoupons(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. TRANSACTION D'ACHAT (Sécurisée pour le stock)
  const addCoupon = async (rewardId: string): Promise<boolean> => {
    if (!user) return false;

    try {
        await runTransaction(db, async (transaction) => {
            // A. Lire la récompense dans la collection globale "rewards"
            const rewardRef = doc(db, "rewards", rewardId);
            const rewardDoc = await transaction.get(rewardRef);

            if (!rewardDoc.exists()) {
                throw "Cette récompense n'existe plus.";
            }

            const rewardData = rewardDoc.data();

            // B. Vérifier le stock
            if (rewardData.remainingQuantity <= 0) {
                throw "Stock épuisé !";
            }

            if (!rewardData.isActive) {
                throw "Offre désactivée.";
            }

            // C. Vérifier si l'utilisateur l'a déjà (Double sécurité)
            const userCouponRef = doc(db, "users", user.uid, "coupons", rewardId);
            const userCouponDoc = await transaction.get(userCouponRef);
            if (userCouponDoc.exists()) {
                throw "Vous avez déjà ce coupon.";
            }

            // D. Décrémenter le stock GLOBAL
            const newQuantity = rewardData.remainingQuantity - 1;
            transaction.update(rewardRef, { remainingQuantity: newQuantity });

            // E. Ajouter le coupon au USER
            const newCoupon: Coupon = {
                id: rewardId,
                name: rewardData.name,
                voucherAmountEuro: rewardData.voucherAmountEuro,
                code: rewardData.promoCode,
                expiresAt: rewardData.expiresAt,
                obtainedAt: Date.now(),
            };
            transaction.set(userCouponRef, newCoupon);
        });

        return true; // Succès
    } catch (e: any) {
        console.error("Erreur transaction coupon:", e);
        // On renvoie l'erreur sous forme d'alerte UI plus tard
        Alert.alert("Échec", typeof e === "string" ? e : "Impossible d'obtenir le coupon.");
        return false;
    }
  };

  const hasCoupon = (rewardId: string) => {
    return coupons.some((c) => c.id === rewardId);
  };

  return (
    <CouponsContext.Provider value={{ coupons, addCoupon, hasCoupon, loading }}>
      {children}
    </CouponsContext.Provider>
  );
}

export const useCoupons = () => {
  const ctx = useContext(CouponsContext);
  if (!ctx) throw new Error("useCoupons must be used within CouponsProvider");
  return ctx;
};