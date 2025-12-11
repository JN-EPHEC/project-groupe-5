import {
    getNotificationPreference,
    initializeNotificationSystem,
    notificationsSupported,
    setNotificationPreferenceEnabled,
} from "@/services/notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Alert, Platform } from "react-native";

interface NotificationsContextValue {
  enabled: boolean;
  loading: boolean;
  setEnabled: (next: boolean) => Promise<boolean>;
  unread: number;
  resetUnread: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

const UNREAD_KEY = "unread_notifications";

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabledState] = useState(false);
  const [loading, setLoading] = useState(true);
  const [prompted, setPrompted] = useState(false);
  const [unread, setUnread] = useState(0);

  const requestInitialConsent = useCallback(() => {
    if (!notificationsSupported()) {
      return;
    }

    setTimeout(() => {
      Alert.alert(
        "Activer les notifications",
        "Souhaites-tu recevoir un rappel quotidien à 20h ?",
        [
          {
            text: "Non merci",
            style: "cancel",
            onPress: async () => {
              await setNotificationPreferenceEnabled(false);
              setEnabledState(false);
            },
          },
          {
            text: "Oui",
            onPress: async () => {
              const result = await setNotificationPreferenceEnabled(true);
              if (!result && Platform.OS !== "web") {
                Alert.alert(
                  "Notification bloquée",
                  "Autorise les notifications dans les réglages de ton appareil pour recevoir nos rappels."
                );
              }
              setEnabledState(result);
            },
          },
        ]
      );
    }, 500);
  }, []);

  useEffect(() => {
    let mounted = true;
    let listener: any | null = null;

    if (!notificationsSupported()) {
      setEnabledState(false);
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    (async () => {
      const pref = await getNotificationPreference();
      let currentEnabled = false;
      if (pref === true) {
        currentEnabled = await initializeNotificationSystem();
      }

      try {
        const raw = await AsyncStorage.getItem(UNREAD_KEY);
        if (raw) {
          const parsed = parseInt(raw, 10);
          if (!isNaN(parsed) && mounted) setUnread(parsed);
        }
      } catch (e) {
        // ignore
      }

      // Listen to incoming notifications and increment unread counter
      if (notificationsSupported()) {
        listener = Notifications.addNotificationReceivedListener(async () => {
          try {
            const prevRaw = await AsyncStorage.getItem(UNREAD_KEY);
            const prev = prevRaw ? parseInt(prevRaw, 10) || 0 : 0;
            const next = prev + 1;
            await AsyncStorage.setItem(UNREAD_KEY, String(next));
            if (mounted) setUnread(next);
          } catch (e) {
            console.warn("[notifications] failed to update unread", e);
          }
        });
      }
      if (!mounted) {
        return;
      }

      setEnabledState(currentEnabled);
      setLoading(false);

      if (pref === null && !prompted) {
        setPrompted(true);
        requestInitialConsent();
      }
    })();

    return () => {
      mounted = false;
      if (listener) {
        try { listener.remove && listener.remove(); } catch {};
        listener = null;
      }
    };
  }, [prompted, requestInitialConsent]);

  const setEnabled = useCallback(async (next: boolean) => {
    setLoading(true);
    const result = await setNotificationPreferenceEnabled(next);
    setEnabledState(result);
    setLoading(false);

    if (next && !result && Platform.OS !== "web") {
      Alert.alert(
        "Notification bloquée",
        "Autorise les notifications dans les réglages de ton appareil pour recevoir nos rappels."
      );
    }

    return result;
  }, []);

  const resetUnread = useCallback(async () => {
    try {
      await AsyncStorage.setItem(UNREAD_KEY, "0");
      setUnread(0);
    } catch (e) {
      console.warn("[notifications] failed to reset unread", e);
    }
  }, []);

  const value = useMemo(
    () => ({
      enabled,
      loading,
      setEnabled,
      unread,
      resetUnread,
    }),
    [enabled, loading, setEnabled, unread, resetUnread]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotificationsSettings() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotificationsSettings must be used within a NotificationsProvider");
  }
  return context;
}
