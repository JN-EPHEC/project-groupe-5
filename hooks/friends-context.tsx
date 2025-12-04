import { db } from "@/firebaseConfig";
import { collection, doc, onSnapshot } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

import { useUser } from "./user-context";

export type Friend = {
  id: string;
  name: string;
  points: number;
  online: boolean;
  avatar: string | null;
};

type FriendsContextType = {
  friends: Friend[];
  loading: boolean;
};

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

function buildFriend(id: string, payload: Record<string, any> | undefined): Friend {
  const firstName = typeof payload?.firstName === "string" ? payload.firstName : "";
  const lastName = typeof payload?.lastName === "string" ? payload.lastName : "";
  const username = typeof payload?.username === "string" ? payload.username : "";
  const usernameLowercase = typeof payload?.usernameLowercase === "string" ? payload.usernameLowercase : "";

  const fallbackName = [firstName, lastName].join(" ").trim() || username || usernameLowercase || id;

  const avatarUrl =
    typeof payload?.photoURL === "string" && payload.photoURL.length > 0
      ? payload.photoURL
      : typeof payload?.avatar === "string" && payload.avatar.length > 0
      ? payload.avatar
      : typeof payload?.photoUri === "string" && payload.photoUri.length > 0
      ? payload.photoUri
      : null;

  return {
    id,
    name: fallbackName,
    points: typeof payload?.points === "number" ? payload.points : 0,
    online: Boolean(payload?.online),
    avatar: avatarUrl,
  };
}

export function FriendsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [friendMap, setFriendMap] = useState<Record<string, Friend>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const detailUnsubs = useRef<Record<string, () => void>>({});

  useEffect(() => {
    const uid = user?.uid;

    // Reset existing listeners when user changes or logs out
    Object.values(detailUnsubs.current).forEach((unsubscribe) => unsubscribe());
    detailUnsubs.current = {};
    setFriendMap({});

    if (!uid) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const friendsRef = collection(db, "users", uid, "friends");
    const unsubscribeFriends = onSnapshot(
      friendsRef,
      (snapshot) => {
        const friendIds = snapshot.docs.map((docSnap) => docSnap.id);

        // Remove listeners for friends that are no longer present
        Object.keys(detailUnsubs.current).forEach((friendId) => {
          if (!friendIds.includes(friendId)) {
            detailUnsubs.current[friendId]?.();
            delete detailUnsubs.current[friendId];
            setFriendMap((prev) => {
              if (!(friendId in prev)) return prev;
              const next = { ...prev };
              delete next[friendId];
              return next;
            });
          }
        });

        if (friendIds.length === 0) {
          setFriendMap({});
          setLoading(false);
          return;
        }

        friendIds.forEach((friendId) => {
          if (detailUnsubs.current[friendId]) {
            return;
          }

          const friendDocRef = doc(db, "users", friendId);
          detailUnsubs.current[friendId] = onSnapshot(friendDocRef, (friendSnap) => {
            const data = friendSnap.data();
            if (!friendSnap.exists()) {
              setFriendMap((prev) => {
                if (!(friendId in prev)) return prev;
                const next = { ...prev };
                delete next[friendId];
                return next;
              });
              return;
            }

            setFriendMap((prev) => ({
              ...prev,
              [friendId]: buildFriend(friendId, data),
            }));
          });
        });

        setLoading(false);
      },
      (error) => {
        console.error("friends subscription error", error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeFriends();
      Object.values(detailUnsubs.current).forEach((unsubscribe) => unsubscribe());
      detailUnsubs.current = {};
      setFriendMap({});
    };
  }, [user?.uid]);

  const friends = useMemo(() => {
    return Object.values(friendMap).sort((a, b) => (b.points || 0) - (a.points || 0));
  }, [friendMap]);

  const value = useMemo(() => ({ friends, loading }), [friends, loading]);

  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>;
}

export function useFriends() {
  const ctx = useContext(FriendsContext);
  if (!ctx) throw new Error("useFriends must be used within FriendsProvider");
  return ctx;
}
