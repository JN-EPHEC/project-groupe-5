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
  expiresAt: string; // Attendu: YYYY-MM-DD
  obtainedAt: number;
};

type CouponsContextType = {
  coupons: Coupon[];
  // ✅ Ajout de pointsCost pour la transaction atomique
  addCoupon: (rewardId: string, pointsCost: number) => Promise<boolean>; 
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
      const todayISO = new Date().toISOString().split('T')[0]; 

      snapshot.forEach((document) => {
        const data = document.data() as Coupon;
        
        if (!data.expiresAt) {
            list.push(data);
            return;
        }

        if (data.expiresAt < todayISO) {
          deleteDoc(doc(db, "users", user.uid, "coupons", document.id)).catch(err => console.log("Auto-delete error", err));
        } else {
          list.push(data);
        }
      });

      setCoupons(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. TRANSACTION D'ACHAT (Sécurisée pour le stock ET les points)
  const addCoupon = async (rewardId: string, pointsCost: number): Promise<boolean> => {
    if (!user) return false;

    try {
        await runTransaction(db, async (transaction) => {
            // A. Références
            const rewardRef = doc(db, "rewards", rewardId);
            const userRef = doc(db, "users", user.uid);
            const userCouponRef = doc(db, "users", user.uid, "coupons", rewardId);

            // B. Lectures (Toutes les lectures doivent être faites avant les écritures)
            const rewardDoc = await transaction.get(rewardRef);
            const userDoc = await transaction.get(userRef);
            const userCouponDoc = await transaction.get(userCouponRef);

            // C. Vérifications
            if (!rewardDoc.exists()) throw "Cette récompense n'existe plus.";
            if (!userDoc.exists()) throw "Erreur profil utilisateur.";
            
            const rewardData = rewardDoc.data();
            const userData = userDoc.data();

            if (rewardData.remainingQuantity <= 0) throw "Stock épuisé !";
            if (!rewardData.isActive) throw "Offre désactivée.";
            
            // Vérification des points EN DIRECT dans la base
            if (userData.points < pointsCost) {
                throw "Points insuffisants pour cet achat.";
            }

            const todayISO = new Date().toISOString().split('T')[0];
            if (rewardData.expiresAt && rewardData.expiresAt < todayISO) {
                 throw "Cette offre a expiré.";
            }

            if (userCouponDoc.exists()) {
                throw "Vous avez déjà ce coupon.";
            }

            // D. ÉCRITURES ATOMIQUES
            
            // 1. Décrémenter le stock GLOBAL
            transaction.update(rewardRef, { 
                remainingQuantity: rewardData.remainingQuantity - 1 
            });

            // 2. Décrémenter les points de l'utilisateur
            transaction.update(userRef, { 
                points: userData.points - pointsCost 
            });

            // 3. Créer le coupon
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

        return true; 
    } catch (e: any) {
        console.error("Erreur transaction achat:", e);
        Alert.alert("Échange impossible", typeof e === "string" ? e : "Une erreur est survenue.");
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