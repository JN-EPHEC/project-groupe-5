import { auth, db } from "@/firebaseConfig";
import {
  collection,
  doc,
  onSnapshot,
} from "firebase/firestore";
import type { Unsubscribe } from "firebase/firestore";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type Friend = {
  id: string;
  name: string;
  points: number;
  online: boolean;
  photoURL: string;
};

type FriendsContextType = {
  friends: Friend[];
  addFriend: (f: Friend) => void;
  removeFriend: (id: string) => void;
  isFriend: (id: string) => boolean;
};

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

export function FriendsProvider({ children }: { children: React.ReactNode }) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const friendListenersRef = useRef<Record<string, Unsubscribe>>({});

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setFriendIds([]);
      setFriends([]);
      return;
    }

    const unsub = onSnapshot(collection(db, "users", uid, "friends"), (snapshot) => {
      const ids = snapshot.docs.map((docSnap) => docSnap.id).filter(Boolean);
      setFriendIds(ids);
    });

    return () => {
      unsub();
      Object.values(friendListenersRef.current).forEach((fn) => fn());
      friendListenersRef.current = {};
      setFriends([]);
      setFriendIds([]);
    };
  }, []);

  useEffect(() => {
    const currentSet = new Set(friendIds);

    // Remove listeners for friends that disappeared
    Object.keys(friendListenersRef.current).forEach((uid) => {
      if (!currentSet.has(uid)) {
        friendListenersRef.current[uid]?.();
        delete friendListenersRef.current[uid];
        setFriends((prev) => prev.filter((f) => f.id !== uid));
      }
    });

    // Add listeners for new friends
    friendIds.forEach((uid) => {
      if (friendListenersRef.current[uid]) {
        return;
      }
      const ref = doc(db, "users", uid);
      friendListenersRef.current[uid] = onSnapshot(ref, (snapshot) => {
        if (!snapshot.exists()) {
          setFriends((prev) => prev.filter((f) => f.id !== uid));
          return;
        }

        const data = snapshot.data();
        const displayName =
          data?.username ||
          data?.usernameLowercase ||
          [data?.firstName, data?.lastName].filter(Boolean).join(" ") ||
          uid;
        const pointsValue = typeof data?.points === "number" ? data.points : 0;
        const photoURL = typeof data?.photoURL === "string" ? data.photoURL : "";

        setFriends((prev) => {
          const filtered = prev.filter((f) => f.id !== uid);
          const next = [
            ...filtered,
            {
              id: uid,
              name: String(displayName).trim() || "Utilisateur",
              points: pointsValue,
              online: Boolean(data?.online),
              photoURL,
            },
          ];
          return next.sort((a, b) => (b.points || 0) - (a.points || 0));
        });
      });
    });

    return () => {
      // cleanup handled in dependency changes/unmount
    };
  }, [friendIds]);

  const addFriend = useCallback((_: Friend) => {
    // Firestore updates handled via friend requests; method kept for compatibility.
  }, []);

  const removeFriend = useCallback((id: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const isFriend = useCallback((id: string) => friendIds.includes(id), [friendIds]);

  const value = useMemo(
    () => ({ friends, addFriend, removeFriend, isFriend }),
    [friends, addFriend, removeFriend, isFriend]
  );
  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>;
}

export function useFriends() {
  const ctx = useContext(FriendsContext);
  if (!ctx) throw new Error("useFriends must be used within FriendsProvider");
  return ctx;
}
