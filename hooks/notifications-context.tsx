import {
    getNotificationPreference,
    initializeNotificationSystem,
    notificationsSupported,
    setNotificationPreferenceEnabled,
} from "@/services/notifications";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Alert, Platform } from "react-native";

interface NotificationsContextValue {
  enabled: boolean;
  loading: boolean;
  setEnabled: (next: boolean) => Promise<boolean>;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabledState] = useState(false);
  const [loading, setLoading] = useState(true);
  const [prompted, setPrompted] = useState(false);

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

  const value = useMemo(
    () => ({
      enabled,
      loading,
      setEnabled,
    }),
    [enabled, loading, setEnabled]
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
