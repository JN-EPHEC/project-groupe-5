import { AdminNav } from "@/components/ui/(admin)/AdminNav";
import { FontFamilies } from "@/constants/fonts";
import { db } from "@/firebaseConfig";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Type Admin
type AdminReward = {
  id: string;
  name: string;
  city: string;
  description: string;
  voucherAmountEuro: string;
  pointsCost: string;
  promoCode: string;
  expiresAt: string;
  images: string[]; // ✅ Tableau d'images
  isActive: boolean;
  totalQuantity: string;
  remainingQuantity: number;
};

export default function AdminCouponsScreen() {
  const { mode, colors } = useThemeMode();
  const isLight = mode === "light";
  const isDark = !isLight;
  const router = useRouter();

  // Data State
  const [rewards, setRewards] = useState<AdminReward[]>([]);
  
  // UI State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Form State
  const [form, setForm] = useState<AdminReward>({
    id: "", name: "", city: "", description: "", voucherAmountEuro: "",
    pointsCost: "", promoCode: "", expiresAt: "2025-12-31", images: [],
    isActive: true, totalQuantity: "", remainingQuantity: 0
  });

  // 1. Lire Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "rewards"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as AdminReward[];
      setRewards(list);
    });
    return () => unsub();
  }, []);

  // 2. Gestion Images (Max 5)
  const pickImage = async () => {
    if (form.images.length >= 5) {
        Alert.alert("Limite atteinte", "Vous ne pouvez ajouter que 5 photos maximum.");
        return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setForm({ ...form, images: [...form.images, base64Img] });
    }
  };

  const removeImage = (indexToRemove: number) => {
      setForm({ ...form, images: form.images.filter((_, idx) => idx !== indexToRemove) });
  };

  // 3. Sauvegarde
  const handleSave = async () => {
    if (!form.name || !form.pointsCost || !form.totalQuantity) {
      Alert.alert("Erreur", "Remplissez au moins le nom, le coût et la quantité.");
      return;
    }

    const payload = {
      name: form.name,
      city: form.city,
      description: form.description,
      voucherAmountEuro: Number(form.voucherAmountEuro),
      pointsCost: Number(form.pointsCost),
      promoCode: form.promoCode,
      expiresAt: form.expiresAt,
      images: form.images, // Array
      isActive: form.isActive,
      totalQuantity: Number(form.totalQuantity),
      ...(editingId ? {} : { remainingQuantity: Number(form.totalQuantity) }),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "rewards", editingId), payload);
      } else {
        await addDoc(collection(db, "rewards"), payload);
      }
      resetForm();
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Supprimer", "Irréversible.", [
      { text: "Annuler" },
      { text: "Supprimer", style: "destructive", onPress: () => deleteDoc(doc(db, "rewards", id)) }
    ]);
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setForm({
      id: "", name: "", city: "", description: "", voucherAmountEuro: "",
      pointsCost: "", promoCode: "", expiresAt: "2025-12-31", images: [],
      isActive: true, totalQuantity: "", remainingQuantity: 0
    });
  };

  const handleEdit = (item: AdminReward) => {
    setIsEditing(true);
    setEditingId(item.id);
    setForm({
      ...item,
      voucherAmountEuro: String(item.voucherAmountEuro),
      pointsCost: String(item.pointsCost),
      totalQuantity: String(item.totalQuantity),
      images: item.images || [],
    });
  };

  // Filtrage
  const filteredRewards = rewards.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = 
        filterStatus === "ALL" ? true :
        filterStatus === "ACTIVE" ? r.isActive :
        !r.isActive;
      return matchesSearch && matchesFilter;
  });

  // Background Theme
  const bgColors = isDark ? [colors.background, "#1F2937"] : ["#F9FAFB", "#F3F4F6"];

  // ====================================================================
  // MODE ÉDITION (Formulaire)
  // ====================================================================
  if (isEditing) {
    return (
        <View style={{ flex: 1, backgroundColor: isLight ? "#F9FAFB" : "#021114" }}>
            <SafeAreaView style={{ flex: 1 }}>
                <View style={[styles.header, { paddingHorizontal: 20 }]}>
                    <TouchableOpacity onPress={resetForm} style={styles.iconBtn}>
                        <Ionicons name="arrow-back" size={24} color={isLight ? "#000" : "#FFF"} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: isLight ? "#000" : "#FFF" }]}>
                        {editingId ? "Modifier Coupon" : "Nouveau Coupon"}
                    </Text>
                    <View style={{ width: 40 }} />
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={{ padding: 20 }}>
                        
                        {/* PHOTOS CAROUSEL */}
                        <Text style={{ color: "#4A665F", marginBottom: 10, fontWeight: '600' }}>Photos ({form.images.length}/5)</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                            {/* Bouton Ajouter */}
                            <TouchableOpacity onPress={pickImage} style={[styles.addPhotoBtn, { borderColor: isLight ? "#DDD" : "#2F3A36" }]}>
                                <Ionicons name="camera-outline" size={30} color="#008F6B" />
                                <Text style={{ fontSize: 10, color: "#008F6B", marginTop: 4 }}>Ajouter</Text>
                            </TouchableOpacity>

                            {/* Liste Images */}
                            {form.images.map((img, idx) => (
                                <View key={idx} style={{ marginRight: 10 }}>
                                    <Image source={{ uri: img }} style={styles.previewImage} />
                                    <TouchableOpacity onPress={() => removeImage(idx)} style={styles.deleteBadge}>
                                        <Ionicons name="close" size={12} color="#FFF" />
                                    </TouchableOpacity>
                                    {idx === 0 && <View style={styles.coverBadge}><Text style={styles.coverText}>Principale</Text></View>}
                                </View>
                            ))}
                        </ScrollView>

                        {/* CHAMPS */}
                        <Input label="Enseigne" value={form.name} onChange={(t: string) => setForm({...form, name: t})} />
                        <Input label="Ville" value={form.city} onChange={(t: string) => setForm({...form, city: t})} />
                        <Input label="Description" value={form.description} onChange={(t: string) => setForm({...form, description: t})} multiline />
                        
                        <View style={styles.row}>
                            <Input label="Valeur (€)" value={form.voucherAmountEuro} onChange={(t: string) => setForm({...form, voucherAmountEuro: t})} flex />
                            <Input label="Coût (Pts)" value={form.pointsCost} onChange={(t: string) => setForm({...form, pointsCost: t})} flex />
                        </View>

                        <View style={styles.row}>
                            <Input label="Code Promo" value={form.promoCode} onChange={(t: string) => setForm({...form, promoCode: t})} flex />
                            <Input label="Expiration (YYYY-MM-DD)" value={form.expiresAt} onChange={(t: string) => setForm({...form, expiresAt: t})} flex />
                        </View>

                        <View style={styles.row}>
                            <Input label="Stock Total" value={form.totalQuantity} onChange={(t: string) => setForm({...form, totalQuantity: t})} flex />
                            <View style={[styles.inputContainer, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}>
                                <Text style={{ color: isLight ? "#000" : "#FFF", marginBottom: 5 }}>En ligne ?</Text>
                                <Switch 
                                    value={form.isActive} 
                                    onValueChange={(v) => setForm({...form, isActive: v})} 
                                    trackColor={{ false: "#767577", true: "#008F6B" }}
                                />
                            </View>
                        </View>

                        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                            <Text style={styles.saveText}>{editingId ? "Mettre à jour" : "Créer le coupon"}</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
  }

  // ====================================================================
  // MODE LISTE (Catalogue)
  // ====================================================================
  return (
    <View style={{ flex: 1 }}>
      {/* Fond Dégradé */}
      <LinearGradient colors={bgColors as any} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

      <SafeAreaView style={styles.container}>
        
        {/* HEADER : Titre + Bouton Créer */}
        <View style={styles.header}>
            <View style={{ width: 40 }} /> 
            <Text style={[styles.headerTitle, { color: isDark ? "#FFF" : "#111827" }]}>Gestion Coupons</Text>
            <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.addBtn}>
                <Ionicons name="add" size={24} color="#FFF" />
            </TouchableOpacity>
        </View>

        {/* SEARCH BAR */}
        <View style={[styles.searchBar, { backgroundColor: isDark ? "#1F2937" : "#FFF", borderColor: isDark ? "#374151" : "transparent" }]}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput 
                placeholder="Rechercher un coupon..." 
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.searchInput, { color: isDark ? "#FFF" : "#000" }]}
            />
        </View>

        {/* FILTRES */}
        <View style={styles.filtersRow}>
            {["ALL", "ACTIVE", "INACTIVE"].map((status) => {
                const isActive = filterStatus === status;
                const label = status === "ALL" ? "TOUS" : status === "ACTIVE" ? "EN LIGNE" : "INACTIF";
                return (
                    <TouchableOpacity 
                        key={status} 
                        onPress={() => setFilterStatus(status as any)}
                        style={[
                            styles.filterPill, 
                            isActive ? { backgroundColor: "#008F6B" } : { backgroundColor: isDark ? "#374151" : "#E5E7EB" }
                        ]}
                    >
                        <Text style={[styles.filterText, { color: isActive ? "#FFF" : (isDark ? "#D1D5DB" : "#4B5563") }]}>
                            {label}
                        </Text>
                    </TouchableOpacity>
                )
            })}
        </View>

        {/* LISTE */}
        <FlatList
            data={filteredRewards}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
                <View style={[styles.card, { backgroundColor: isDark ? "#1F2937" : "#FFF", borderColor: isDark ? "#374151" : "transparent" }]}>
                    
                    {/* Image (1ere du tableau) */}
                    <Image 
                        source={{ uri: item.images?.[0] }} 
                        style={styles.cardThumb} 
                    />

                    {/* Infos */}
                    <View style={{ flex: 1, paddingHorizontal: 12 }}>
                        <Text style={[styles.cardName, { color: isDark ? "#FFF" : "#111827" }]} numberOfLines={1}>{item.name}</Text>
                        
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>
                            <View style={[styles.statusBadge, { backgroundColor: item.isActive ? "rgba(0,143,107,0.2)" : "rgba(239,68,68,0.2)" }]}>
                                <Text style={[styles.statusText, { color: item.isActive ? "#008F6B" : "#EF4444" }]}>
                                    {item.isActive ? "ACTIF" : "OFF"}
                                </Text>
                            </View>
                            <Text style={{ color: "#008F6B", fontWeight: '700', fontSize: 13 }}>{item.pointsCost} pts</Text>
                        </View>

                        <Text style={{ color: "#6B7280", fontSize: 11, marginTop: 4 }}>
                            Stock: {item.remainingQuantity} / {item.totalQuantity}
                        </Text>
                    </View>

                    {/* Actions */}
                    <View style={{ gap: 8 }}>
                        <TouchableOpacity onPress={() => handleEdit(item)} style={[styles.actionIcon, { backgroundColor: isDark ? "#374151" : "#F3F4F6" }]}>
                            <Ionicons name="chevron-down" size={18} color="#6B7280" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.actionIcon, { backgroundColor: "rgba(239,68,68,0.1)" }]}>
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        />
      </SafeAreaView>
      <AdminNav />
    </View>
  );
}

// Helpers
const Input = ({ label, value, onChange, flex, multiline }: any) => {
    const { mode } = useThemeMode();
    const isDark = mode === "dark";
    return (
        <View style={[styles.inputContainer, flex && { flex: 1, marginHorizontal: 4 }]}>
            <Text style={{ color: isDark ? "#9CA3AF" : "#4B5563", marginBottom: 6, fontSize: 12, fontWeight: '600' }}>{label}</Text>
            <TextInput 
                value={value} 
                onChangeText={onChange} 
                multiline={multiline}
                placeholderTextColor="#9CA3AF"
                style={[
                    styles.input, 
                    { 
                        color: isDark ? "#FFF" : "#000",
                        backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FFF",
                        borderColor: isDark ? "#374151" : "#E5E7EB",
                        height: multiline ? 80 : 48
                    }
                ]} 
            />
        </View>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  
  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, marginTop: 10 },
  headerTitle: { fontSize: 22, fontFamily: FontFamilies.heading, fontWeight: '800' },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#008F6B", alignItems: 'center', justifyContent: 'center', elevation: 4 },
  iconBtn: { padding: 8, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.1)" },

  // Search
  searchBar: { flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: 16, paddingHorizontal: 16, marginBottom: 16, borderWidth: 1, elevation: 2 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15 },

  // Filters
  filtersRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  filterPill: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  filterText: { fontSize: 12, fontWeight: '700' },

  // Card
  card: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 20, marginBottom: 12, borderWidth: 1, elevation: 2 },
  cardThumb: { width: 60, height: 60, borderRadius: 16, backgroundColor: '#E5E7EB' },
  cardName: { fontSize: 16, fontFamily: FontFamilies.heading, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800' },
  actionIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  // Form Styles
  addPhotoBtn: { width: 80, height: 80, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  previewImage: { width: 80, height: 80, borderRadius: 12 },
  deleteBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: 'red', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  coverBadge: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', paddingVertical: 2, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  coverText: { color: '#FFF', fontSize: 8, fontWeight: 'bold' },
  
  inputContainer: { marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  saveBtn: { backgroundColor: "#008F6B", padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 20, elevation: 3 },
  saveText: { color: "#FFF", fontWeight: 'bold', fontSize: 16 },
});