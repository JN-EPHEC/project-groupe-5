// Keep this context independent of routing
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
// No UI imports; provider shouldn't render screens
import { auth, db } from "../firebaseConfig";

// 🔥 Full user profile (Option B)
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
};

type UserContextType = {
  user: UserProfile;
  loading: boolean;
  userClub: { id: string; name: string; isPrivate?: boolean } | null;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userClub, setUserClub] = useState<{ id: string; name: string; isPrivate?: boolean } | null>(null);

  // 1️⃣ Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);

      if (!user) {
        // If logged out, delete profile and stop loading
        setUserProfile(null);
        setLoading(false);
      }
    });

    return unsub;
  }, []);

  // 2️⃣ Listen to Firestore user profile (only when logged in)
  useEffect(() => {
    if (!firebaseUser) return;

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
        }
        setLoading(false);
      },
      (err) => {
        console.error("Firestore user error:", err);
        setLoading(false);
      }
    );

    return unsub;
  }, [firebaseUser]);

  // 3️⃣ Listen to clubs that contain the current user in their members array.
  // This allows detecting membership even when `users/{uid}.clubId` is not set.
  useEffect(() => {
    if (!firebaseUser) {
      setUserClub(null);
      return;
    }

    const q = query(collection(db, "clubs"), where("members", "array-contains", firebaseUser.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (snap.docs.length > 0) {
          const d = snap.docs[0];
          const data: any = d.data();
          const club = { id: d.id, name: data.name ?? "Club", isPrivate: Boolean(data.isPrivate) };
          setUserClub(club);
          // update in-memory userProfile.clubId so other parts of the app react
          setUserProfile((prev) => {
            if (!prev) return prev;
            if (prev.clubId === club.id) return prev;
            return { ...prev, clubId: club.id };
          });
        } else {
          setUserClub(null);
          setUserProfile((prev) => {
            if (!prev) return prev;
            if (prev.clubId === null) return prev;
            return { ...prev, clubId: null };
          });
        }
      },
      (err) => {
        console.error("Firestore club-members listener error:", err);
      }
    );

    return unsub;
  }, [firebaseUser]);

  // Memoized context value
  const value = useMemo(
    () => ({
      user: userProfile as UserProfile,
      loading,
      userClub,
    }),
    [userProfile, loading]
  );
  // Provide state only; routing handled in app layouts
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// Hook to access the user
export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
}
