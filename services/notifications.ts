import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const DEFI_DONE_DATE_KEY = "defi_done_date";
const NOTIFICATION_PREF_KEY = "notifications_enabled";
let handlerConfigured = false;

export function notificationsSupported() {
  return Platform.OS === "android" || Platform.OS === "ios";
}

function ensureNotificationHandler() {
  if (!notificationsSupported() || handlerConfigured) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => {
      const today = new Date().toISOString().split("T")[0];
      try {
        const savedDate = await AsyncStorage.getItem(DEFI_DONE_DATE_KEY);
        if (savedDate === today) {
          return {
            shouldShowAlert: false,
            shouldPlaySound: false,
            shouldSetBadge: false,
            shouldShowBanner: false,
            shouldShowList: false,
          };
        }
      } catch (error) {
        console.warn("[notifications] Unable to read AsyncStorage", error);
      }

      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      };
    },
  });

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    }).catch((error) => {
      console.warn("[notifications] Failed to set Android channel", error);
    });
  }

  handlerConfigured = true;
}

async function ensurePermissionsGranted() {
  if (!notificationsSupported()) {
    return false;
  }

  const existingStatus = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus.status;

  if (finalStatus !== "granted") {
    const requestStatus = await Notifications.requestPermissionsAsync();
    finalStatus = requestStatus.status;
  }

  return finalStatus === "granted";
}

async function scheduleInternalReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Défi non fait 😯",
      body: "N'oublie pas de faire ton défi aujourd'hui !",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: 20,
      minute: 0,
      repeats: true,
    },
  });
}

export async function scheduleDailyReminder() {
  if (!notificationsSupported()) {
    return false;
  }

  ensureNotificationHandler();

  const granted = await ensurePermissionsGranted();
  if (!granted) {
    await AsyncStorage.setItem(NOTIFICATION_PREF_KEY, "false");
    return false;
  }

  try {
    await scheduleInternalReminder();
    await AsyncStorage.setItem(NOTIFICATION_PREF_KEY, "true");
    return true;
  } catch (error) {
    console.warn("[notifications] Failed to schedule reminder", error);
    return false;
  }
}

export async function initializeNotificationSystem() {
  if (!notificationsSupported()) {
    return false;
  }

  ensureNotificationHandler();
  const prefRaw = await AsyncStorage.getItem(NOTIFICATION_PREF_KEY);
  if (prefRaw === "true") {
    return scheduleDailyReminder();
  }

  if (prefRaw === null) {
    return false;
  }

  return false;
}

export async function markDefiDone(date: Date = new Date()) {
  if (!notificationsSupported()) {
    return;
  }

  const isoDate = date.toISOString().split("T")[0];
  try {
    await AsyncStorage.setItem(DEFI_DONE_DATE_KEY, isoDate);
  } catch (error) {
    console.warn("[notifications] Unable to flag défi as done", error);
  }
}

export async function clearDefiDoneFlag() {
  if (!notificationsSupported()) {
    return;
  }

  try {
    await AsyncStorage.removeItem(DEFI_DONE_DATE_KEY);
  } catch (error) {
    console.warn("[notifications] Unable to clear défi flag", error);
  }
}

export async function getNotificationPreference(): Promise<boolean | null> {
  const value = await AsyncStorage.getItem(NOTIFICATION_PREF_KEY);
  if (value === null) {
    return null;
  }
  return value === "true";
}

export async function setNotificationPreferenceEnabled(enabled: boolean): Promise<boolean> {
  if (!notificationsSupported()) {
    await AsyncStorage.setItem(NOTIFICATION_PREF_KEY, "false");
    return false;
  }

  ensureNotificationHandler();

  if (!enabled) {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.warn("[notifications] Failed to cancel notifications", error);
    }
    await AsyncStorage.setItem(NOTIFICATION_PREF_KEY, "false");
    return false;
  }

  const granted = await ensurePermissionsGranted();
  if (!granted) {
    await AsyncStorage.setItem(NOTIFICATION_PREF_KEY, "false");
    return false;
  }

  try {
    await scheduleInternalReminder();
    await AsyncStorage.setItem(NOTIFICATION_PREF_KEY, "true");
    return true;
  } catch (error) {
    console.warn("[notifications] Failed to enable notifications", error);
    await AsyncStorage.setItem(NOTIFICATION_PREF_KEY, "false");
    return false;
  }
}
