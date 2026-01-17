// app/(admin)/defis.tsx
import { AdminNav } from "@/components/ui/(admin)/AdminNav";
import { DeleteConfirmModal } from "@/components/ui/(admin)/DeleteConfirmModal";
import { FontFamilies } from "@/constants/fonts";
import { db } from "@/firebaseConfig";
import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// 🎨 THEME ADMIN
const adminTheme = {
    bgGradient: ["#F9FAFB", "#F3F4F6"] as const,
    accent: "#008F6B",
    danger: "#EF4444",
};

type Defi = {
  id: string;
  titre: string;
  description: string;
  categorie: "personnel" | "club";
  duree: number;
  points: number;
  statut: "inactive" | "rotation";
  difficulte: "facile" | "moyen" | "difficile";
  preuve?: string;
};

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function DefisManagerScreen() {
  const { user } = useUser();
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";
  const isDark = !isLight;
  const router = useRouter();

  // --- STATE LISTE ---
  const [defis, setDefis] = useState<Defi[]>([]);
  const [search, setSearch] = useState("");
  // Filtres étendus
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ROTATION" | "INACTIVE">("ALL");
  const [filterType, setFilterType] = useState<"ALL" | "PERSO" | "CLUB">("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);
  
  // --- STATE FORMULAIRE ---
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form Fields
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [categorie, setCategorie] = useState<"personnel" | "club">("personnel");
  const [duree, setDuree] = useState<1 | 7>(1);
  const [points, setPoints] = useState("");
  const [statut, setStatut] = useState<"inactive" | "rotation">("inactive");
  const [preuve, setPreuve] = useState("");
  const [difficulte, setDifficulte] = useState<"facile" | "moyen" | "difficile">("facile");

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // 1. CHARGER LES DONNÉES
  const loadData = async () => {
    const snap = await getDocs(collection(db, "defis"));
    console.log("📦 defis snap size:", snap.size);

    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Defi[];
    console.log("📦 list length:", list.length);

    setDefis(list);
  };

  // --- LOGIQUE DE ROTATION (AJOUTÉE) ---
  const rotateDefis = async () => {
    console.log("🔁 Admin rotation started");

    // 1) fetch ALL defis ordered FIFO
    const q = query(collection(db, "defis"), orderBy("createdAt", "asc"));
    const snap = await getDocs(q);

    const all = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

    // 2) split
    const personals = all.filter(d => d.categorie === "personnel");
    const clubs = all.filter(d => d.categorie === "club");

    // 3) deactivate currently active
    const active = all.filter(d => d.statut === "rotation");
    for (const d of active) {
      await updateDoc(doc(db, "defis", d.id), { statut: "inactive" });
    }

    // helper to pick first inactive of given difficulty
    const pickNext = (list: any[], difficulty?: string) => {
      if (difficulty) {
        return list.find(d => d.statut === "inactive" && d.difficulte === difficulty);
      }
      return list.find(d => d.statut === "inactive");
    };

    // 4) select next rotation set
    const nextFacile = pickNext(personals, "facile");
    const nextMoyen = pickNext(personals, "moyen");
    const nextDifficile = pickNext(personals, "difficile");
    const nextClub = pickNext(clubs);

    // 5) activate them
    const toActivate = [nextFacile, nextMoyen, nextDifficile, nextClub].filter(Boolean);

    for (const d of toActivate) {
      await updateDoc(doc(db, "defis", d.id), { statut: "rotation" });
    }

    console.log("✅ Rotation done", toActivate.map(d => d?.titre));
    Alert.alert("Rotation effectuée", "Les nouveaux défis du jour sont en ligne !");
    await loadData();
  };

  useEffect(() => {
    loadData();
  }, [isEditingMode]);

  // 2. FILTRAGE
  const filtered = defis.filter((d) => {
    const matchSearch = d.titre.toLowerCase().includes(search.toLowerCase());
    
    const matchStatus = 
        filterStatus === "ALL" ? true :
        filterStatus === "ROTATION" ? d.statut === "rotation" :
        d.statut === "inactive";

    const matchType = 
        filterType === "ALL" ? true :
        filterType === "PERSO" ? d.categorie === "personnel" :
        d.categorie === "club";

    return matchSearch && matchStatus && matchType;
  });

  // 3. LOGIQUE FORMULAIRE
  const resetForm = () => {
    setIsEditingMode(false);
    setEditingId(null);
    setTitre(""); setDescription(""); setCategorie("personnel");
    setDuree(1); setPoints(""); setStatut("inactive"); setPreuve("");
    setDifficulte("facile");
  };

  const openEdit = (d: Defi) => {
    setEditingId(d.id);
    setTitre(d.titre); setDescription(d.description); setCategorie(d.categorie);
    setDuree(d.duree as 1 | 7); 
    setPoints(String(d.points)); setStatut(d.statut);
    setPreuve(d.preuve || ""); setDifficulte(d.difficulte);
    setIsEditingMode(true);
  };

const handleSave = async () => {
    if (!user) return;

    // --- VALIDATION AJOUTÉE ---
    // Si on essaie de mettre en ligne (rotation), on vérifie les champs obligatoires
    if (statut === 'rotation') {
      if (!titre.trim() || !description.trim() || !points.trim() || Number(points) <= 0) {
        Alert.alert(
          "Champs manquants", 
          "Pour mettre un défi en ligne, il doit obligatoirement avoir un Titre, une Description et des Points (> 0)."
        );
        return; // On bloque l'enregistrement
      }
    }
    // ---------------------------

    try {
      const payload = {
        titre, description, categorie, duree,
        points: Number(points), statut, preuve, difficulte,
        updatedAt: serverTimestamp(),
        createdBy: user.uid,
      };

      if (editingId) {
        await updateDoc(doc(db, "defis", editingId), payload);
      } else {
        await addDoc(collection(db, "defis"), { ...payload, createdAt: serverTimestamp() });
      }
      resetForm();
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'enregistrer.");
    }
  };

  const handleDifficultyChange = (d: "facile" | "moyen" | "difficile") => {
    setDifficulte(d);
    setPoints(d === "facile" ? "25" : d === "moyen" ? "50" : "100");
  };

  const handleCategoryChange = (c: "personnel" | "club") => {
    setCategorie(c);
    setDuree(c === "personnel" ? 1 : 7);
  };

  const [mountKey, setMountKey] = useState(0);

  useEffect(() => {
    if (Platform.OS !== "web") return;

    // when data arrives the first time, force FlatList remount so it measures correctly
    if (defis.length > 0) {
      setMountKey((k) => k + 1);
    }
  }, [defis.length]);

  const listKey = `${mountKey}-${filterStatus}-${filterType}-${search}`;

  // Couleurs
  const bgColors = isDark ? [colors.background, "#1F2937"] : adminTheme.bgGradient;
  const cardBg = isDark ? "rgba(255,255,255,0.05)" : "#FFF";
  const borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";
  const textColor = isDark ? "#FFF" : "#111827";
  const mutedColor = isDark ? "#9CA3AF" : "#6B7280";

  // ====================================================================
  // MODE ÉDITION (Formulaire)
  // ====================================================================
  if (isEditingMode) {
    return (
        <View style={{ flex: 1 }}>
            <LinearGradient colors={bgColors as any} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <SafeAreaView style={{ flex: 1 }}>
                {/* HEADER FORM */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={resetForm} style={styles.iconBtn}>
                        <Ionicons name="arrow-back" size={24} color={textColor} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: textColor }]}>
                        {editingId ? "Modifier Défi" : "Nouveau Défi"}
                    </Text>
                    <View style={{ width: 40 }} />
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
                        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                            
                            {/* TITRE */}
                            <Text style={[styles.label, { color: mutedColor }]}>TITRE</Text>
                            <TextInput 
                                style={[styles.input, { color: textColor, borderColor }]} 
                                value={titre} onChangeText={setTitre} placeholder="Titre du défi" placeholderTextColor={mutedColor} 
                            />

                            {/* DESCRIPTION */}
                            <Text style={[styles.label, { color: mutedColor }]}>DESCRIPTION</Text>
                            <TextInput 
                                style={[styles.input, styles.multiline, { color: textColor, borderColor }]} 
                                value={description} onChangeText={setDescription} multiline placeholder="Description..." placeholderTextColor={mutedColor} 
                            />

                            {/* TYPE */}
                            <Text style={[styles.label, { color: mutedColor }]}>TYPE</Text>
                            <View style={styles.row}>
                                {(["personnel", "club"] as const).map((c) => (
                                    <TouchableOpacity key={c} onPress={() => handleCategoryChange(c)} style={[styles.selector, { backgroundColor: categorie === c ? adminTheme.accent : "transparent", borderColor: categorie === c ? adminTheme.accent : borderColor }]}>
                                        <Text style={{ color: categorie === c ? "#FFF" : mutedColor, fontWeight: '700', textTransform: 'uppercase', fontSize: 12 }}>{c}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* DIFFICULTÉ */}
                            <Text style={[styles.label, { color: mutedColor, marginTop: 16 }]}>DIFFICULTÉ</Text>
                            <View style={styles.row}>
                                {(["facile", "moyen", "difficile"] as const).map((d) => (
                                    <TouchableOpacity key={d} onPress={() => handleDifficultyChange(d)} style={[styles.selector, { backgroundColor: difficulte === d ? adminTheme.accent : "transparent", borderColor: difficulte === d ? adminTheme.accent : borderColor }]}>
                                        <Text style={{ color: difficulte === d ? "#FFF" : mutedColor, fontWeight: '700', textTransform: 'capitalize', fontSize: 12 }}>{d}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* POINTS & STATUT */}
                            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, { color: mutedColor, marginTop: 0 }]}>POINTS</Text>
                                    <TextInput style={[styles.input, { color: textColor, borderColor, textAlign: 'center', fontWeight: 'bold' }]} value={points} editable={false} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, { color: mutedColor, marginTop: 0 }]}>STATUT</Text>
                                    <TouchableOpacity onPress={() => setStatut(statut === 'rotation' ? 'inactive' : 'rotation')} style={[styles.input, { justifyContent: 'center', alignItems: 'center', backgroundColor: statut === 'rotation' ? "#DCFCE7" : "transparent", borderColor: statut === 'rotation' ? "#86EFAC" : borderColor }]}>
                                        <Text style={{ color: statut === 'rotation' ? '#15803D' : mutedColor, fontWeight: '700', fontSize: 12 }}>{statut === "rotation" ? "ACTIF" : "OFF"}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* PREUVE */}
                            <Text style={[styles.label, { color: mutedColor }]}>PREUVE (Optionnel)</Text>
                            <TextInput style={[styles.input, { color: textColor, borderColor }]} value={preuve} onChangeText={setPreuve} placeholder="Ex: Photo" placeholderTextColor={mutedColor} />

                        </View>

                        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                            <Text style={styles.saveText}>{editingId ? "METTRE À JOUR" : "CRÉER"}</Text>
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
      <LinearGradient colors={bgColors as any} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <SafeAreaView style={styles.container}>
        
        {/* HEADER */}
        <View style={styles.header}>
            <View style={{ width: 40 }} /> 
            <Text style={[styles.headerTitle, { color: textColor }]}>Catalogue Défis</Text>
            <TouchableOpacity onPress={() => setIsEditingMode(true)} style={styles.addBtn}>
                <Ionicons name="add" size={24} color="#FFF" />
            </TouchableOpacity>
        </View>

        {/* SEARCH */}
        <View style={[styles.searchBar, { backgroundColor: cardBg, borderColor }]}>
            <Ionicons name="search" size={20} color={mutedColor} />
            <TextInput 
                style={[styles.searchInput, { color: textColor }]} 
                placeholder="Rechercher un défi..." 
                placeholderTextColor={mutedColor}
                value={search} onChangeText={setSearch}
            />
        </View>

        {/* --- BOUTON ROTATION (AJOUTÉ) --- */}
        <TouchableOpacity
          onPress={rotateDefis}
          style={styles.rotationBtn}
        >
          <Text style={styles.rotationBtnText}>
            Faire tourner les défis du jour
          </Text>
        </TouchableOpacity>

        {/* FILTERS (2 Lignes) */}
        <View style={{ marginBottom: 20 }}>
            {/* Ligne 1 : Statut */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
                {([
                    { k: "ALL", l: "TOUS" }, 
                    { k: "ROTATION", l: "EN LIGNE" }, 
                    { k: "INACTIVE", l: "INACTIF" }
                ] as const).map((f) => (
                    <TouchableOpacity key={f.k} onPress={() => setFilterStatus(f.k)} style={[styles.filterPill, { backgroundColor: filterStatus === f.k ? adminTheme.accent : cardBg, borderColor }]}>
                        <Text style={{ color: filterStatus === f.k ? "#FFF" : mutedColor, fontWeight: '700', fontSize: 11 }}>{f.l}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
            
            {/* Ligne 2 : Type */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {([
                    { k: "ALL", l: "TOUT TYPE" }, 
                    { k: "PERSO", l: "PERSO" }, 
                    { k: "CLUB", l: "CLUB" }
                ] as const).map((f) => (
                    <TouchableOpacity key={f.k} onPress={() => setFilterType(f.k)} style={[styles.filterPill, { backgroundColor: filterType === f.k ? "#3B82F6" : cardBg, borderColor }]}>
                        <Text style={{ color: filterType === f.k ? "#FFF" : mutedColor, fontWeight: '700', fontSize: 11 }}>{f.l}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>

        {/* LISTE */}
        <FlatList
            key={listKey}
            style={{ flex: 1, height: "100%" as any }}
            data={filtered}
            keyExtractor={(d) => d.id}
            contentContainerStyle={{ paddingBottom: 160 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: d }) => {
                const isOpen = expanded === d.id;
                return (
                    <TouchableOpacity 
                        activeOpacity={0.9}
                        onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setExpanded(isOpen ? null : d.id); }}
                        style={[styles.card, { backgroundColor: cardBg, borderColor }]}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <View style={[styles.iconBox, { backgroundColor: d.categorie === 'club' ? "#E0F2FE" : "#F3E8FF" }]}>
                                <Ionicons name={d.categorie === 'club' ? "people" : "person"} size={20} color={d.categorie === 'club' ? "#0284C7" : "#9333EA"} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: textColor, fontWeight: '700', fontSize: 15 }}>{d.titre}</Text>
                                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                                    <Text style={{ fontSize: 11, fontWeight: '800', color: d.statut === "rotation" ? "#15803D" : mutedColor, backgroundColor: d.statut === "rotation" ? "#DCFCE7" : "transparent", paddingHorizontal: 6, borderRadius: 4, overflow: 'hidden' }}>
                                        {d.statut === "rotation" ? "ACTIF" : "OFF"}
                                    </Text>
                                    <Text style={{ fontSize: 11, color: adminTheme.accent, fontWeight: '700' }}>{d.points} pts</Text>
                                </View>
                            </View>
                            <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={16} color={mutedColor} />
                        </View>

                        {isOpen && (
                            <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: borderColor }}>
                                <Text style={{ color: mutedColor, fontSize: 13, marginBottom: 12 }}>{d.description}</Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                                    <TouchableOpacity onPress={() => openEdit(d)} style={styles.actionBtn}>
                                        <Text style={{ color: "#FFF", fontWeight: '700', fontSize: 12 }}>Modifier</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => { setDeleteTargetId(d.id); setDeleteModalVisible(true); }} style={[styles.actionBtn, { backgroundColor: "#FFF", borderWidth: 1, borderColor: adminTheme.danger }]}>
                                        <Text style={{ color: adminTheme.danger, fontWeight: '700', fontSize: 12 }}>Supprimer</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </TouchableOpacity>
                );
            }}
            disableVirtualization={Platform.OS === "web"}
            removeClippedSubviews={false}
        />

      </SafeAreaView>

      {/* DELETE MODAL */}
      <DeleteConfirmModal
        visible={deleteModalVisible}
        onCancel={() => { setDeleteModalVisible(false); setDeleteTargetId(null); }}
        onConfirm={async () => {
          if (deleteTargetId) {
            await deleteDoc(doc(db, "defis", deleteTargetId));
            loadData();
          }
          setDeleteModalVisible(false);
          setDeleteTargetId(null);
        }}
      />

      <AdminNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, marginTop: 10 },
  headerTitle: { fontSize: 20, fontWeight: '800', fontFamily: FontFamilies.heading },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#008F6B", alignItems: 'center', justifyContent: 'center', elevation: 4 },
  iconBtn: { padding: 8, borderRadius: 12 },
  
  searchBar: { flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: 16, paddingHorizontal: 16, marginBottom: 16, borderWidth: 1 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15 },

  // Nouveau style pour le bouton Rotation
  rotationBtn: {
    backgroundColor: "#008F6B",
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 16,
    alignItems: "center",
    elevation: 3,
  },
  rotationBtnText: {
    color: "white",
    fontWeight: "800",
    fontSize: 14
  },
  
  filterPill: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, marginRight: 6 },
  
  card: { padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  
  label: { marginTop: 16, marginBottom: 8, fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
  multiline: { minHeight: 100, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 10 },
  selector: { flex: 1, paddingVertical: 12, borderWidth: 1, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  
  saveBtn: { backgroundColor: "#008F6B", padding: 18, borderRadius: 16, alignItems: "center", marginTop: 30, elevation: 4 },
  saveText: { color: "#fff", fontWeight: "800", fontSize: 14, letterSpacing: 1 },
  
  actionBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, backgroundColor: "#008F6B", alignItems: 'center', justifyContent: 'center' },
});