import { useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Alert, Linking } from 'react-native';

export function usePermissions() {
  // On utilise les hooks officiels d'Expo
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [galleryPermission, requestGalleryPermission] = ImagePicker.useMediaLibraryPermissions();
  
  const [notifStatus, setNotifStatus] = useState<boolean | null>(null);

  // Wrapper pour la Caméra
  const requestCamera = async () => {
    if (cameraPermission?.granted) return true;
    
    const response = await requestCameraPermission();
    if (!response.granted) {
      Alert.alert(
        "Caméra requise", 
        "L'accès à la caméra est nécessaire. Veux-tu ouvrir les paramètres ?",
        [
          { text: "Annuler", style: "cancel" },
          { text: "Paramètres", onPress: () => Linking.openSettings() }
        ]
      );
    }
    return response.granted;
  };

  // Wrapper pour la Galerie
  const requestGallery = async () => {
    if (galleryPermission?.granted) return true;

    const response = await requestGalleryPermission();
    if (!response.granted) {
      Alert.alert("Photos requises", "L'accès aux photos est nécessaire pour choisir une preuve.");
    }
    return response.granted;
  };

  // Wrapper pour les Notifications (Pas de hook officiel simple, on garde la méthode async)
  const requestNotifications = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    const granted = finalStatus === 'granted';
    setNotifStatus(granted);
    return granted;
  };

  // Vérif initiale pour les notifs
  useEffect(() => {
    Notifications.getPermissionsAsync().then(s => setNotifStatus(s.status === 'granted'));
  }, []);

  return {
    cameraStatus: cameraPermission?.granted ?? false,
    galleryStatus: galleryPermission?.granted ?? false,
    notifStatus,
    requestCamera,
    requestGallery,
    requestNotifications
  };
}