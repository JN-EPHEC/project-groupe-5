import { rewardsData } from '@/components/ui/recompenses/data';
import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';

export type Coupon = {
  id: string; // unique coupon id
  rewardId: string;
  code: string;
  createdAt: number;
  expiresAt: string;
  name: string;
  voucherAmountEuro: number;
  images: string[];
};

interface CouponsContextType {
  coupons: Coupon[];
  addCoupon: (rewardId: string) => Coupon | null;
  hasCoupon: (rewardId: string) => boolean;
}

const CouponsContext = createContext<CouponsContextType | undefined>(undefined);

export function CouponsProvider({ children }: { children: ReactNode }) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  const hasCoupon = useCallback((rewardId: string) => coupons.some(c => c.rewardId === rewardId), [coupons]);

  const addCoupon = useCallback((rewardId: string) => {
    if (hasCoupon(rewardId)) return null; // already redeemed
    const reward = rewardsData.find(r => r.id === rewardId);
    if (!reward) return null;
    const coupon: Coupon = {
      id: `${rewardId}-${Date.now()}`,
      rewardId,
      code: reward.promoCode, // Could generate unique code if needed
      createdAt: Date.now(),
      expiresAt: reward.expiresAt,
      name: reward.name,
      voucherAmountEuro: reward.voucherAmountEuro,
      images: reward.images,
    };
    setCoupons(prev => [coupon, ...prev]);
    return coupon;
  }, [hasCoupon]);

  return (
    <CouponsContext.Provider value={{ coupons, addCoupon, hasCoupon }}>
      {children}
    </CouponsContext.Provider>
  );
}

export function useCoupons() {
  const ctx = useContext(CouponsContext);
  if (!ctx) throw new Error('useCoupons must be used within a CouponsProvider');
  return ctx;
}
