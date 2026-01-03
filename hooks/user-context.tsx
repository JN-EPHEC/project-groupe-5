// hooks/user-context.tsx
let DEV_FORCE_PREMIUM = false;
let DEV_TEST_EMAIL: string | undefined = undefined;
let DEV_TEST_UID: string | undefined = undefined;

try {
  const dev = require("../devAuth.env"); 
  DEV_FORCE_PREMIUM = dev.DEV_FORCE_PREMIUM;
  DEV_TEST_EMAIL = dev.DEV_TEST_EMAIL;
  DEV_TEST_UID = dev.DEV_TEST_UID;
} catch {
  // Ignore
}

import { checkPremiumStatus } from "@/services/premiumService";
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { auth, db } from "../firebaseConfig";

export type UserProfile = {
  uid: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  postalCode: string | null;
  birthDate: string | null;
  points: number;
  isAdmin: boolean;
  clubId: string | null;
  abonnementId: string | null;
  username?: string | null;
  bio?: string | null;
  photoURL?: string | null;
  avatarColor?: string | null; // ✅ AJOUT ICI
  isPremium?: boolean;
};

type UserContextType = {
  user: UserProfile | null;
  isPremium: boolean;
  loading: boolean;
  userClub: { id: string; name: string; isPrivate?: boolean } | null;
  refreshUser: () => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userClub, setUserClub] = useState<{ id: string; name: string; isPrivate?: boolean } | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  
  const isDevPremiumUser =
    __DEV__ &&
    DEV_FORCE_PREMIUM &&
    firebaseUser?.email === DEV_TEST_EMAIL;

  useEffect(() => {
    // Console log removed for cleaner code
  }, [firebaseUser, isDevPremiumUser, isPremium]);

  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  // 1️⃣ Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        setUserProfile(null);
        setIsPremium(false);
        setProfileLoading(false);
        setAuthLoading(false);
      } else {
        setAuthLoading(false);
        setProfileLoading(true); 
      }
    });
    return unsub;
  }, []);

  // 2️⃣ Firestore profile
  useEffect(() => {
    if (!firebaseUser) {
        setProfileLoading(false);
        return;
    }
    const ref = doc(db, "users", firebaseUser.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setUserProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email ?? "",
            firstName: data.firstName ?? null,
            lastName: data.lastName ?? null,
            postalCode: data.postalCode ?? null,
            birthDate: data.birthDate ?? null,
            points: data.points ?? 0,
            isAdmin: data.isAdmin ?? false,
            clubId: data.clubId ?? null,
            abonnementId: data.abonnementId ?? null,
            username: data.username ?? null,
            bio: data.bio ?? null,
            photoURL: data.photoURL ?? null,
            avatarColor: data.avatarColor ?? "#19D07D", // ✅ AJOUT ICI : Récupération de la couleur
          });
        } else {
          setUserProfile(null);
        }
        setProfileLoading(false);
      },
      (err) => {
        console.error("Firestore user error:", err);
        setProfileLoading(false);
      }
    );
    return unsub;
  }, [firebaseUser]);

  // 3️⃣ Clubs
  useEffect(() => {
    if (!firebaseUser) {
      setUserClub(null);
      return;
    }
    const q = query(collection(db, "clubs"), where("members", "array-contains", firebaseUser.uid));
    const unsub = onSnapshot(q, (snap) => {
        if (snap.docs.length > 0) {
            const d = snap.docs[0];
            const data: any = d.data();
            setUserClub({ id: d.id, name: data.name ?? "Club", isPrivate: Boolean(data.isPrivate) });
        } else {
            setUserClub(null);
        }
    });
    return unsub;
  }, [firebaseUser]);
  
  // 4️⃣ Premium check
  const refreshPremiumStatus = useCallback(async () => {
    if (isDevPremiumUser) return;

    if (!userProfile) {
        setIsPremium(false);
        return;
    }
    try {
        const status = await checkPremiumStatus(userProfile);
        setIsPremium(status);
    } catch (e) {
        console.error(e);
        setIsPremium(false);
    }
  }, [userProfile, isDevPremiumUser]);

  useEffect(() => {
    refreshPremiumStatus();
  }, [refreshPremiumStatus]);

  const isLoading = authLoading || (!!firebaseUser && profileLoading);
  const effectiveIsPremium = isDevPremiumUser ? true : isPremium;

  const value = useMemo(
    () => ({
      user: userProfile,
      isPremium: effectiveIsPremium,
      loading: isLoading,
      userClub,
      refreshUser: refreshPremiumStatus,
    }),
    [userProfile, effectiveIsPremium, isLoading, userClub, refreshPremiumStatus]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
}