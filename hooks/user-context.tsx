// hooks/user-context.tsx
// Keep this context independent of routing
import { DEV_FORCE_PREMIUM, DEV_TEST_EMAIL, DEV_TEST_UID } from "@/devAuth.env";
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


// The core user profile from the 'users' collection
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
  isPremium?: boolean;
};

type UserContextType = {
  user: UserProfile | null;
  isPremium: boolean;
  loading: boolean; // Flag "BLOQUANT" pour l'initialisation seulement
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

    //debugger
    useEffect(() => {
  console.log("🧪 DEV PREMIUM CHECK", {
    __DEV__,
    DEV_FORCE_PREMIUM,
    firebaseEmail: firebaseUser?.email,
    firebaseUID: firebaseUser?.uid,
    DEV_TEST_EMAIL,
    DEV_TEST_UID,
    isDevPremiumUser,
    isPremiumState: isPremium,
  });
}, [firebaseUser, isDevPremiumUser, isPremium]);

  
  // 🛡️ CORRECTION : On sépare le chargement initial du chargement d'arrière-plan
  const [authLoading, setAuthLoading] = useState(true); // Chargement de Firebase Auth
  const [profileLoading, setProfileLoading] = useState(true); // Chargement du profil Firestore

  // 1️⃣ Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        // Logged out: clean everything and stop loading
        setUserProfile(null);
        setIsPremium(false);
        setProfileLoading(false);
        setAuthLoading(false); // Auth is ready (result: no user)
      } else {
        // User found: auth is ready, but we start loading profile
        setAuthLoading(false);
        setProfileLoading(true); 
      }
    });
    return unsub;
  }, []);

  // 2️⃣ Listen to Firestore user profile
  useEffect(() => {
    if (!firebaseUser) {
        setProfileLoading(false);
        return;
    };

    // Note: On ne met PAS setProfileLoading(true) ici, car onSnapshot gère ses mises à jour
    // sans avoir besoin de bloquer l'UI à chaque petit changement.
    
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
          });
        } else {
          setUserProfile(null);
        }
        // Une fois qu'on a la première réponse de Firestore, on arrête le chargement bloquant
        setProfileLoading(false);
      },
      (err) => {
        console.error("Firestore user error:", err);
        setProfileLoading(false);
      }
    );
    return unsub;
  }, [firebaseUser]);

  // 3️⃣ Listen to clubs
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
            const club = { id: d.id, name: data.name ?? "Club", isPrivate: Boolean(data.isPrivate) };
            setUserClub(club);
        } else {
            setUserClub(null);
        }
    });
    return unsub;
  }, [firebaseUser]);
  
  // 4️⃣ Check for premium status (BACKGROUND CHECK)
  // 🛡️ CORRECTION : Cette fonction ne touche plus au state "loading" global
  const refreshPremiumStatus = useCallback(async () => {
    if (isDevPremiumUser) return; // ✅ DEV bypass, nothing else touched

    if (!userProfile) {
        setIsPremium(false);
        return;
    }
    // On ne met PAS de loading ici pour ne pas faire clignoter l'app
    try {
        const status = await checkPremiumStatus(userProfile);
        setIsPremium(status);
    } catch (e) {
        console.error(e);
        setIsPremium(false);
    }
  }, [userProfile]);

  useEffect(() => {
    refreshPremiumStatus();
  }, [refreshPremiumStatus]);

  // 🛡️ CORRECTION : Le chargement global n'est vrai QUE pendant l'initialisation.
  // Une fois l'utilisateur chargé, les mises à jour (edit profil, premium) se font en "live" sans spinner bloquant.
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