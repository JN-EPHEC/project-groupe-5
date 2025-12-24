import { db } from "@/firebaseConfig";
import { useUser } from "@/hooks/user-context";
import * as Notifications from "expo-notifications";
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, writeBatch } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert, Linking } from "react-native"; // ✅ Ajout de Linking

// Configuration simplifiée (avec 'as any' pour éviter les erreurs TS strictes)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  } as any),
});

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: any;
  type?: 'info' | 'alert' | 'success';
};

type NotificationsContextType = {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  enabled: boolean;
  setEnabled: (value: boolean) => Promise<void>;
  resetUnread: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabledState] = useState(false);

  // 1. Vérification initiale
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      setEnabledState(status === 'granted');
    })();
  }, []);

  // 2. GESTION DU SWITCH (Ouverture des réglages)
  const setEnabled = async (shouldEnable: boolean) => {
    if (shouldEnable) {
      // Cas : On veut activer
      const { status } = await Notifications.getPermissionsAsync();
      
      if (status === 'granted') {
        setEnabledState(true);
      } else if (status === 'denied') {
        // Déjà refusé -> On envoie vers les réglages
        Alert.alert(
          "Notifications désactivées",
          "Pour recevoir les notifications, vous devez les autoriser dans les réglages de votre iPhone.",
          [
            { text: "Annuler", style: "cancel" },
            { text: "Ouvrir les Réglages", onPress: () => Linking.openSettings() }
          ]
        );
        setEnabledState(false);
      } else {
        // Jamais demandé -> On demande
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        setEnabledState(newStatus === 'granted');
      }
    } else {
      // Cas : On veut désactiver -> On envoie vers les réglages
      Alert.alert(
        "Désactiver les notifications",
        "Pour désactiver les notifications, vous devez modifier ce paramètre dans les réglages de votre iPhone.",
        [
          { text: "Annuler", style: "cancel", onPress: () => setEnabledState(true) }, // On remet à ON visuellement
          { text: "Ouvrir les Réglages", onPress: () => Linking.openSettings() }
        ]
      );
    }
  };

  // 3. Écoute Firestore
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    const q = query(collection(db, "users", user.uid, "notifications"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as NotificationItem[];
      setNotifications(list);
      setLoading(false);
      Notifications.setBadgeCountAsync(list.filter(n => !n.read).length);
    });
    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = async () => {
    if (!user) return;
    const batch = writeBatch(db);
    notifications.forEach(n => {
      if (!n.read) batch.update(doc(db, "users", user.uid, "notifications", n.id), { read: true });
    });
    await batch.commit();
  };
  
  const resetUnread = markAllAsRead;

  const deleteNotification = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "notifications", id));
  };

  return (
    <NotificationsContext.Provider value={{ 
      notifications, 
      unreadCount, 
      loading, 
      markAllAsRead, 
      deleteNotification, 
      enabled, 
      setEnabled,
      resetUnread 
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

// ✅ EXPORT 1
export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}

// ✅ EXPORT 2 (Alias pour corriger l'erreur dans SettingsSection)
export const useNotificationsSettings = useNotifications;