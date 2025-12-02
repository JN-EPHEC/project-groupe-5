import { useChallenges } from "@/hooks/challenges-context";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Image, Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [confirmVisible, setConfirmVisible] = useState(false);
  const router = useRouter();
  const { validateWithPhoto } = useChallenges();
  const params = useLocalSearchParams();

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
        <Text style={{ color: "#fff", marginVertical: 12 }}>Autorisez l'accès à la caméra pour continuer</Text>
        <TouchableOpacity style={styles.permBtn} onPress={() => requestPermission()}>
          <Text style={{ color: "#0F3327", fontWeight: "700" }}>Autoriser</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (photoUri) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
        {/* Back button overlay */}
        <TouchableOpacity onPress={() => setPhotoUri(null)} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Image source={{ uri: photoUri }} style={{ flex: 1 }} resizeMode="cover" />
        <View style={styles.footerRow}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setPhotoUri(null)}>
            <Text style={styles.secondaryText}>Reprendre</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => setConfirmVisible(true)}
          >
            <Text style={styles.primaryText}>Confirmer</Text>
          </TouchableOpacity>
        </View>

        {/* Confirmation modal */}
        <Modal transparent visible={confirmVisible} animationType="fade" onRequestClose={() => setConfirmVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Êtes-vous sûr d'envoyer cette photo ?</Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalBtn, styles.modalCancel]} onPress={() => { setConfirmVisible(false); setPhotoUri(null); }}>
                  <Text style={styles.modalCancelText}>Non</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, styles.modalConfirm]} onPress={() => { setConfirmVisible(false); validateWithPhoto(photoUri); router.push('/commentaire'); }}>
                  <Text style={styles.modalConfirmText}>Oui</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Comment input moved to Defi screen after submission */}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing} />
      {/* Back button overlay to avoid default header */}
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
  permBtn: { backgroundColor: "#19D07D", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  controls: { position: "absolute", bottom: 40, width: "100%", justifyContent: "center", alignItems: "center" },
  shutter: { width: 68, height: 68, borderRadius: 34, backgroundColor: "#fff" },
  switchBtn: { position: "absolute", top: 20, right: 20, backgroundColor: "#19D07D", padding: 10, borderRadius: 22 },
  backBtn: { position: "absolute", top: 20, left: 20, padding: 6 },
  footerRow: { flexDirection: "row", justifyContent: "space-between", padding: 16, backgroundColor: "#000" },
  secondaryBtn: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: "#fff", paddingVertical: 12, alignItems: "center", marginRight: 8 },
  secondaryText: { color: "#fff", fontWeight: "600" },
  primaryBtn: { flex: 1, borderRadius: 12, backgroundColor: "#19D07D", paddingVertical: 12, alignItems: "center", marginLeft: 8 },
  primaryText: { color: "#0F3327", fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 420, backgroundColor: '#111F1B', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#152922' },
  modalTitle: { color: '#F2F6F4', fontSize: 16, fontWeight: '700', marginBottom: 10 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
  modalCancel: { backgroundColor: '#2A3431' },
  modalConfirm: { backgroundColor: '#19D07D' },
  modalCancelText: { color: '#E6FFF5', fontWeight: '700' },
  modalConfirmText: { color: '#0F3327', fontWeight: '700' },
  commentInput: { backgroundColor: '#152922', color: '#F2F6F4', borderRadius: 12, padding: 12, minHeight: 100, textAlignVertical: 'top' },
});
