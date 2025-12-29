import { db } from "@/firebaseConfig";
import { useUser } from "@/hooks/user-context";
import * as Notifications from "expo-notifications";
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, writeBatch } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Alert, Linking, Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
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
  
  const lastCountRef = useRef(0);

  useEffect(() => {
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      const isGranted = status === 'granted';
      setEnabledState(isGranted);

      if (isGranted) {
        await scheduleAllReminders(); // On lance la programmation globale
      }
    })();
  }, []);

  // ✅ PLANIFICATION DE TOUTES LES NOTIFICATIONS LOCALES
  const scheduleAllReminders = async () => {
    if (typeof Notifications?.scheduleNotificationAsync !== "function") return;

    // 1. On nettoie TOUT avant de reprogrammer pour éviter les doublons
    await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});

    try {
      // 🌅 7h00 : Rappel Matinal (Existant)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🌱 Défi du jour",
          body: "N'oubliez pas de valider votre défi écologique aujourd'hui !",
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: 7,
          minute: 0,
          repeats: true,
        },
      });

      // ☀️ 12h00 : Nouveaux Défis (NOUVEAU)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🚀 Nouveaux défis dispo !",
          body: "3 nouveaux défis sont disponibles, viens les découvrir !",
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: 12,
          minute: 0,
          repeats: true,
        },
      });

      console.log("✅ Notifications programmées : 7h00 et 12h00");

    } catch (e) {
      console.warn("Erreur lors de la planification des notifications :", e);
    }
  };

  const setEnabled = async (shouldEnable: boolean) => {
    if (shouldEnable) {
      const { status } = await Notifications.getPermissionsAsync();
      
      if (status === 'granted') {
        setEnabledState(true);
        scheduleAllReminders();
      } else if (status === 'denied') {
        Alert.alert(
          "Notifications désactivées",
          "Pour recevoir les notifications, vous devez les autoriser dans les réglages.",
          [
            { text: "Annuler", style: "cancel" },
            { text: "Réglages", onPress: () => Linking.openSettings() }
          ]
        );
        setEnabledState(false);
      } else {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus === 'granted') {
          setEnabledState(true);
          scheduleAllReminders();
        }
      }
    } else {
      Alert.alert(
        "Désactiver",
        "Pour désactiver les notifications, veuillez aller dans les réglages de votre appareil.",
        [
            { text: "Annuler", style: "cancel", onPress: () => setEnabledState(true) },
            { text: "Réglages", onPress: () => Linking.openSettings() }
        ]
      );
    }
  };

  // ... (Le reste du fichier reste inchangé : useEffect pour Firebase, markAllAsRead, etc.)
  
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as NotificationItem[];
      
      const newUnreadCount = list.filter(n => !n.read).length;

      if (!loading && newUnreadCount > lastCountRef.current) {
        const latest = list[0];
        if (latest && !latest.read) {
            if (typeof Notifications?.scheduleNotificationAsync === "function") {
              try {
                await Notifications.scheduleNotificationAsync({
                  content: {
                    title: latest.title,
                    body: latest.body,
                    sound: true,
                    data: { url: '/(tabs)/notifications' }
                  },
                  trigger: null,
                });
              } catch (e) {
                // ignore on web
              }
            }
        }
      }

      lastCountRef.current = newUnreadCount;
      setNotifications(list);
      setLoading(false);
      if (Platform.OS !== "web") {
        Notifications.setBadgeCountAsync(newUnreadCount);
      }
    });
    
    return () => unsubscribe();
  }, [user, loading]);

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
      unreadCount: notifications.filter(n => !n.read).length, 
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

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}

export const useNotificationsSettings = useNotifications;