import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient"; // ✅ AJOUT
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 🎨 THEME CAMERA
const cameraTheme = {
    bgGradient: ["#021114", "#0F3327"] as const, // Fond sombre teinté vert pour les permissions
    accent: "#008F6B", // Vert Marque
    text: "#FFFFFF",
    glassCtrl: "rgba(0, 0, 0, 0.4)", // Fond semi-transparent pour les contrôles
};

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<"back" | "front">("back");
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!permission) return;
    if (!permission.granted) {
      requestPermission();
    }
  }, [permission]);

  const takePicture = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync();
      if (photo?.uri) setPhotoUri(photo.uri);
    } catch (e) {
      console.warn(e);
    }
  };

  // ---- ECRAN PERMISSION ----
  if (!permission || !permission.granted) {
    return (
      <View style={{ flex: 1 }}>
        <LinearGradient colors={cameraTheme.bgGradient} style={styles.center}>
            <View style={[styles.permCard, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
                <Ionicons name="camera" size={56} color="#4ADE80" />
                <Text style={styles.permTitle}>Accès Caméra requis</Text>
                <Text style={styles.permDesc}>
                Pour valider vos défis écologiques, nous avons besoin d'accéder à votre appareil photo.
                </Text>
                <TouchableOpacity onPress={() => requestPermission()} activeOpacity={0.8}>
                    <LinearGradient
                        colors={["#008F6B", "#10B981"]}
                        style={styles.permBtn}
                    >
                        <Text style={styles.permBtnText}>Autoriser l'accès</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </LinearGradient>
      </View>
    );
  }

  // ---- PREVIEW (PHOTO PRISE) ----
  if (photoUri) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <Image source={{ uri: photoUri }} style={{ flex: 1 }} resizeMode="cover" />

        {/* Header (Retour) */}
        <View style={[styles.topBar, { top: insets.top }]}>
            <TouchableOpacity onPress={() => setPhotoUri(null)} style={styles.iconBtn}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
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
                    <Text style={styles.secondaryText}>Reprendre</Text>
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
                            params: { photoUri: uriToSend },
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

        <TouchableOpacity
            onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
            style={styles.iconBtn}
        >
            <Ionicons name="camera-reverse" size={26} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Bottom Controls (Shutter) */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 30 }]}>
        <TouchableOpacity onPress={takePicture} activeOpacity={0.7}>
            <View style={styles.shutterOuter}>
                <View style={styles.shutterInner} />
            </View>
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
      backgroundColor: "rgba(0,0,0,0.3)", // Glass dark
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: "rgba(255,255,255,0.2)"
  },
  
  controls: {
    position: "absolute", bottom: 0, width: "100%",
    justifyContent: "center", alignItems: "center",
  },
  
  // Shutter Button Styling
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