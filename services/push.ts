import { auth } from '@/firebaseConfig';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { arrayRemove, arrayUnion, doc, getDoc, getFirestore, setDoc, updateDoc } from 'firebase/firestore';
import { Platform } from 'react-native';

const db = getFirestore();

export async function registerPushToken() {
  try {
    if (Platform.OS === 'web') return null; // no push on web now
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
    const { status } = await Notifications.getPermissionsAsync();
    let finalStatus = status;
    if (status !== 'granted') {
      const ask = await Notifications.requestPermissionsAsync();
      finalStatus = ask.status;
    }
    if (finalStatus !== 'granted') return null;
    const projectId = (Constants?.expoConfig as any)?.extra?.eas?.projectId
      || (Constants as any)?.easConfig?.projectId
      || process.env.EXPO_PROJECT_ID;
    const tokenData = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    const expoToken = tokenData.data;

    const uid = auth.currentUser?.uid;
    if (!uid) return null;
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, { displayName: auth.currentUser?.email || 'User', createdAt: Date.now(), fcmTokens: [expoToken] });
    } else {
      await updateDoc(userRef, { fcmTokens: arrayUnion(expoToken), lastActiveAt: Date.now() });
    }
    return expoToken;
  } catch (e) {
    console.log('Push token registration failed', e);
    return null;
  }
}

export async function unregisterPushToken(token: string) {
  try {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { fcmTokens: arrayRemove(token) });
  } catch (e) {
    console.log('Remove token failed', e);
  }
}

export function configureNotificationHandling() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false })
  });
  // Ensure Android channel exists as early as possible
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }
}