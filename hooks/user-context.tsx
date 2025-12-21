// Keep this context independent of routing
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
import { checkPremiumStatus } from "@/services/premiumService";

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

// The context now includes the separate premium status
type UserContextType = {
  user: UserProfile | null; // Can be null when logged out
  isPremium: boolean;
  loading: boolean; // A single flag for overall loading state
  userClub: { id: string; name: string; isPrivate?: boolean } | null;
  refreshUser: () => Promise<void>; // To re-trigger premium check
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userClub, setUserClub] = useState<{ id: string; name: string; isPrivate?: boolean } | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  
  // Separate loading states for clarity
  const [profileLoading, setProfileLoading] = useState(true);
  const [premiumLoading, setPremiumLoading] = useState(true);

  // 1️⃣ Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        // If logged out, reset everything
        setUserProfile(null);
        setIsPremium(false);
        setProfileLoading(false);
        setPremiumLoading(false);
      }
    });
    return unsub;
  }, []);

  // 2️⃣ Listen to Firestore user profile (only when logged in)
  useEffect(() => {
    if (!firebaseUser) {
        setProfileLoading(false);
        return;
    };

    setProfileLoading(true);
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
        setProfileLoading(false);
      },
      (err) => {
        console.error("Firestore user error:", err);
        setProfileLoading(false);
      }
    );
    return unsub;
  }, [firebaseUser]);

  // 3️⃣ Listen to clubs. This effect is now only responsible for setting the userClub.
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
  
  // 4️⃣ Check for premium status once user profile is loaded
  const refreshPremiumStatus = useCallback(async () => {
    if (!userProfile) {
        setIsPremium(false);
        setPremiumLoading(false);
        return;
    }
    setPremiumLoading(true);
    try {
        const status = await checkPremiumStatus(userProfile);
        setIsPremium(status);
    } catch (e) {
        console.error(e);
        setIsPremium(false);
    } finally {
        setPremiumLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    refreshPremiumStatus();
  }, [refreshPremiumStatus]);

  // The single loading flag exposed to the app
  const isLoading = profileLoading || premiumLoading;

  // Memoized context value
  const value = useMemo(
    () => ({
      user: userProfile,
      isPremium,
      loading: isLoading,
      userClub,
      refreshUser: refreshPremiumStatus, // refreshUser now re-checks premium status
    }),
    [userProfile, isPremium, isLoading, userClub, refreshPremiumStatus]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// Hook to access the user data
export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
}

