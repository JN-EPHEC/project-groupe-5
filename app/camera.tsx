// camera.tsx
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<"back" | "front">("back");
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);

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

  if (!permission || !permission.granted) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: "#000" }]}>
        <Ionicons name="camera" size={48} color="#fff" />
        <Text style={{ color: "#fff", marginVertical: 12 }}>
          Autorisez l'accès à la caméra pour continuer
        </Text>
        <TouchableOpacity
          style={styles.permBtn}
          onPress={() => requestPermission()}
        >
          <Text style={{ color: "#0F3327", fontWeight: "700" }}>Autoriser</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ---- AFTER PICTURE IS TAKEN ----
  if (photoUri) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
        <TouchableOpacity onPress={() => setPhotoUri(null)} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Image source={{ uri: photoUri }} style={{ flex: 1 }} resizeMode="cover" />

        <View style={styles.footerRow}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => setPhotoUri(null)}
          >
            <Text style={styles.secondaryText}>Reprendre</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryBtn}
            disabled={navigating}
            onPress={() => {
              if (!photoUri || navigating) {
                return;
              }
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
          >
            <Text style={styles.primaryText}>Confirmer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing} />

      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
        style={styles.switchBtn}
      >
        <Ionicons name="camera-reverse" size={22} color="#0F3327" />
      </TouchableOpacity>

      <View style={styles.controls}>
        <TouchableOpacity onPress={takePicture} style={styles.shutter} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  permBtn: {
    backgroundColor: "#19D07D",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  controls: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  shutter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#fff",
  },
  switchBtn: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "#19D07D",
    padding: 10,
    borderRadius: 22,
  },
  backBtn: { position: "absolute", top: 20, left: 20, padding: 6 },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#000",
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fff",
    paddingVertical: 12,
    alignItems: "center",
    marginRight: 8,
  },
  secondaryText: { color: "#fff", fontWeight: "600" },
  primaryBtn: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#19D07D",
    paddingVertical: 12,
    alignItems: "center",
    marginLeft: 8,
  },
  primaryText: { color: "#0F3327", fontWeight: "700" },

});
