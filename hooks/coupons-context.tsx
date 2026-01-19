import { db } from "@/firebaseConfig";
import { useUser } from "@/hooks/user-context";
import { collection, doc, onSnapshot, runTransaction } from "firebase/firestore";
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
  addCoupon: (rewardId: string, pointsCost: number) => Promise<boolean>;
  hasCoupon: (rewardId: string) => boolean;
  loading: boolean;
};

const CouponsContext = createContext<CouponsContextType | undefined>(undefined);

export function CouponsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

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
        if (data.expiresAt && data.expiresAt < todayISO) {
          // On ne supprime pas ici pour éviter de muter la base pendant un snapshot
          // On filtre juste pour l'affichage
          return;
        }
        list.push({ ...data, id: document.id });
      });

      setCoupons(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addCoupon = async (rewardId: string, pointsCost: number): Promise<boolean> => {
    if (!user) return false;

    try {
      await runTransaction(db, async (transaction) => {
        const rewardRef = doc(db, "rewards", rewardId);
        const userRef = doc(db, "users", user.uid);
        const userCouponRef = doc(db, "users", user.uid, "coupons", rewardId);

        const rewardDoc = await transaction.get(rewardRef);
        const userDoc = await transaction.get(userRef);
        const userCouponDoc = await transaction.get(userCouponRef);

        if (!rewardDoc.exists()) throw "Récompense introuvable.";
        if (!userDoc.exists()) throw "Profil utilisateur introuvable.";

        const rewardData = rewardDoc.data();
        const userData = userDoc.data();

        // 🛡️ SÉCURITÉ : Forcer le type Number pour éviter les erreurs de calcul
        const currentPoints = Number(userData.points || 0);
        const currentStock = Number(rewardData.remainingQuantity || 0);

        if (currentStock <= 0) throw "Stock épuisé !";
        if (currentPoints < pointsCost) throw "Points insuffisants.";
        if (userCouponDoc.exists()) throw "Vous possédez déjà ce coupon.";

        // 🔄 MISE À JOUR ATOMIQUE
        transaction.update(rewardRef, {
          remainingQuantity: currentStock - 1
        });

        transaction.update(userRef, {
          points: currentPoints - pointsCost
        });

        const newCoupon: Coupon = {
          id: rewardId,
          name: rewardData.name,
          voucherAmountEuro: Number(rewardData.voucherAmountEuro),
          code: rewardData.promoCode,
          expiresAt: rewardData.expiresAt,
          obtainedAt: Date.now(),
        };

        transaction.set(userCouponRef, newCoupon);
      });

      return true;
    } catch (e: any) {
      console.error("Erreur transaction:", e);
      Alert.alert("Échec de l'échange", e.toString());
      return false;
    }
  };

  const hasCoupon = (rewardId: string) => coupons.some((c) => c.id === rewardId);

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