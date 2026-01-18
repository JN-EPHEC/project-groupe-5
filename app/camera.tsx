import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera"; // ❌ Micro supprimé
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 🎨 THEME CAMERA
const cameraTheme = {
    bgGradient: ["#021114", "#0F3327"] as const, 
    accent: "#008F6B", 
    text: "#FFFFFF",
    glassCtrl: "rgba(0, 0, 0, 0.4)",
};

export default function CameraScreen() {
  // Permissions Caméra uniquement
  const [camPermission, requestCamPermission] = useCameraPermissions();
  
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<"back" | "front">("back");
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; kind?: "perso" | "club" }>();
  const incomingKind = Array.isArray(params.kind) ? params.kind[0] : params.kind;
  const [navigating, setNavigating] = useState(false);
  const insets = useSafeAreaInsets();

  // Gestion de la demande de permission Caméra
  const handleRequestCamPermission = async () => {
    const response = await requestCamPermission();
    
    // Si toujours refusé après la demande, on guide vers les réglages
    if (!response.granted && !response.canAskAgain) {
        Alert.alert(
            "Caméra bloquée",
            "L'accès à la caméra est nécessaire. Veuillez l'activer dans les réglages.",
            [
                { text: "Annuler", style: "cancel" },
                { text: "Ouvrir les réglages", onPress: () => Linking.openSettings() }
            ]
        );
    }
  };

  // ✅ FONCTION: PRENDRE UNE PHOTO
  const takePicture = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8 }); 
      if (photo?.uri) checkImageSizeAndSet(photo.uri);
    } catch (e) {
      console.warn(e);
    }
  };

  // ✅ FONCTION: CHOISIR DEPUIS LA GALERIE (Avec redirection réglages si besoin)
  const pickImage = async () => {
    try {
      // 1. Vérifier/Demander la permission Galerie
      const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
          if (!canAskAgain) {
              // Si refusé définitivement -> Réglages
              Alert.alert(
                  "Photos bloquées",
                  "L'accès à vos photos est nécessaire. Veuillez l'activer dans les réglages.",
                  [
                      { text: "Annuler", style: "cancel" },
                      { text: "Ouvrir les réglages", onPress: () => Linking.openSettings() }
                  ]
              );
          } else {
              Alert.alert("Permission requise", "Nous avons besoin d'accéder à vos photos.");
          }
          return;
      }

      // 2. Ouvrir la galerie
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, 
        allowsEditing: false, 
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        checkImageSizeAndSet(result.assets[0].uri, result.assets[0].fileSize);
      }
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'ouvrir la galerie.");
    }
  };

  // ✅ VALIDATION TAILLE (Max 10 Mo)
  const checkImageSizeAndSet = async (uri: string, fileSize?: number) => {
    if (fileSize && fileSize > 10 * 1024 * 1024) { 
        Alert.alert("Image trop lourde", "La photo doit faire moins de 10 Mo.");
        return;
    }
    setPhotoUri(uri);
  };

  // ---- CHARGEMENT INITIAL ----
  if (!camPermission) {
      return (
          <View style={{flex: 1, backgroundColor: "#000", justifyContent: 'center', alignItems: 'center'}}>
              <ActivityIndicator size="large" color="#008F6B" />
          </View>
      );
  }

  // ---- ECRAN PERMISSION CAMÉRA (SI NON ACCORDÉE) ----
  if (!camPermission.granted) {
    return (
      <View style={{ flex: 1 }}>
        <LinearGradient colors={cameraTheme.bgGradient} style={styles.center}>
            <View style={[styles.permCard, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
                <Ionicons name="camera" size={56} color="#4ADE80" />
                <Text style={styles.permTitle}>Accès Caméra requis</Text>
                <Text style={styles.permDesc}>
                Pour valider vos défis écologiques, nous avons besoin d'accéder à votre appareil photo.
                </Text>
                <TouchableOpacity onPress={handleRequestCamPermission} activeOpacity={0.8}>
                    <LinearGradient
                        colors={["#008F6B", "#10B981"]}
                        style={styles.permBtn}
                    >
                        <Text style={styles.permBtnText}>Autoriser l'accès</Text>
                    </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: "#AAA", textDecorationLine: "underline" }}>Annuler</Text>
                </TouchableOpacity>
            </View>
        </LinearGradient>
      </View>
    );
  }

  // ---- PREVIEW (PHOTO PRISE OU CHOISIE) ----
  if (photoUri) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <Image source={{ uri: photoUri }} style={{ flex: 1 }} resizeMode="contain" />

        {/* Header (Retour) */}
        <View style={[styles.topBar, { top: insets.top }]}>
            <TouchableOpacity onPress={() => setPhotoUri(null)} style={styles.iconBtn}>
                <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
        </View>

        {/* Footer (Actions) */}
        <View style={[styles.footerContainer, { paddingBottom: insets.bottom + 20 }]}>
            <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.8)"]}
                style={StyleSheet.absoluteFill}
            />
            <View style={styles.footerRow}>
                {/* Reprendre */}
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "rgba(255,255,255,0.2)" }]}
                    onPress={() => setPhotoUri(null)}
                >
                    <Ionicons name="refresh" size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.secondaryText}>Changer</Text>
                </TouchableOpacity>

                {/* Confirmer */}
                <TouchableOpacity
                    disabled={navigating}
                    onPress={() => {
                        if (!photoUri || navigating) return;
                        setNavigating(true);
                        const uriToSend = photoUri;
                        router.push({
                            pathname: "/commentaire",
                            params: { photoUri: uriToSend, kind: incomingKind },
                        });
                        setTimeout(() => {
                            setPhotoUri(null);
                            setNavigating(false);
                        }, 300);
                    }}
                    activeOpacity={0.9}
                    style={{ flex: 1, marginLeft: 12 }}
                >
                    <LinearGradient
                        colors={["#008F6B", "#10B981"]}
                        style={styles.actionBtn}
                    >
                        <Text style={styles.primaryText}>Confirmer</Text>
                        <Ionicons name="checkmark" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
      </View>
    );
  }

  // ---- CAMERA LIVE ----
  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing} />

      {/* Header Controls */}
      <View style={[styles.topBar, { top: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="close" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Bottom Controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 30 }]}>
        
        {/* BOUTON GALERIE (GAUCHE) */}
        <TouchableOpacity onPress={pickImage} style={styles.sideBtn}>
            <Ionicons name="images" size={28} color="#FFF" />
        </TouchableOpacity>

        {/* BOUTON SHUTTER (CENTRE) */}
        <TouchableOpacity onPress={takePicture} activeOpacity={0.7} style={styles.shutterContainer}>
            <View style={styles.shutterOuter}>
                <View style={styles.shutterInner} />
            </View>
        </TouchableOpacity>

        {/* BOUTON SWITCH CAMERA (DROITE) */}
        <TouchableOpacity
            onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
            style={styles.sideBtn}
        >
            <Ionicons name="camera-reverse" size={28} color="#FFF" />
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  
  // Permissions Styles
  permCard: {
      width: '100%', padding: 30, borderRadius: 24,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: "rgba(255,255,255,0.1)"
  },
  permTitle: { color: "#FFF", fontSize: 20, fontWeight: "700", marginTop: 16, marginBottom: 8, textAlign: 'center' },
  permDesc: { color: "#CCC", textAlign: "center", marginBottom: 24, lineHeight: 22 },
  permBtn: {
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center'
  },
  permBtnText: { color: "#FFF", fontWeight: "700", fontSize: 16 },

  // Camera Styles
  topBar: {
      position: "absolute", left: 0, right: 0,
      flexDirection: 'row', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingTop: 10, zIndex: 10
  },
  iconBtn: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: "rgba(0,0,0,0.3)", 
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: "rgba(255,255,255,0.2)"
  },
  
  controls: {
    position: "absolute", bottom: 0, width: "100%",
    flexDirection: 'row', 
    justifyContent: "space-around", 
    alignItems: "center",
    paddingHorizontal: 30
  },
  
  // Side Buttons
  sideBtn: {
      width: 50, height: 50, borderRadius: 25,
      backgroundColor: "rgba(0,0,0,0.3)",
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: "rgba(255,255,255,0.2)"
  },

  // Shutter Button
  shutterContainer: {
  },
  shutterOuter: {
    width: 84, height: 84, borderRadius: 42,
    borderWidth: 4, borderColor: "#FFF",
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: "rgba(255,255,255,0.2)"
  },
  shutterInner: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "#FFF",
  },

  // Preview Footer
  footerContainer: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingHorizontal: 20, paddingTop: 40
  },
  footerRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: 'center'
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 18,
  },
  secondaryText: { color: "#FFF", fontWeight: "600", fontSize: 16 },
  primaryText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
});