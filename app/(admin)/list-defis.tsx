// app/(admin)/list-defis.tsx
import { AdminNav } from "@/components/ui/(admin)/AdminNav";
import { DeleteConfirmModal } from "@/components/ui/(admin)/DeleteConfirmModal";
import { FontFamilies } from "@/constants/fonts";
import { db } from "@/firebaseConfig";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
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

// 🎨 THEME ADMIN LIST
const listTheme = {
    bgGradient: ["#F9FAFB", "#F3F4F6"] as const,
    glassCardBg: ["#FFFFFF", "rgba(255, 255, 255, 0.8)"] as const,
    borderColor: "rgba(0, 0, 0, 0.05)",
    textMain: "#111827",
    textMuted: "#6B7280",
    accent: "#008F6B",
    danger: "#EF4444",
    tagBg: "#E0F2FE", // Bleu clair pour catégorie
    tagText: "#0284C7",
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

export default function ListDefisScreen() {
  const { colors, theme } = useThemeMode();
  const router = useRouter();
  const isDark = theme === "dark";

  const [defis, setDefis] = useState<Defi[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "rotation" | "inactive">("all");

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const loadData = async () => {
    const snap = await getDocs(collection(db, "defis"));
    console.log("📦 defis snap size:", snap.size);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Defi[];
    setDefis(list);
  };

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

    await loadData();
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = defis
    .filter((d) =>
      search.length > 0 ? d.titre.toLowerCase().includes(search.toLowerCase()) : true
    )
    .filter((d) => (filter === "all" ? true : d.statut === filter));

  const difficultyColor = (d: string) =>
    d === "facile" ? "#10B981" : d === "moyen" ? "#F59E0B" : "#EF4444";

  // Couleurs dynamiques
  const titleColor = isDark ? "#FFF" : listTheme.textMain;
  const mutedColor = isDark ? "#9CA3AF" : listTheme.textMuted;
  const cardBorder = isDark ? "rgba(255,255,255,0.1)" : listTheme.borderColor;
  const bgColors = isDark ? [colors.background, "#1F2937"] : listTheme.bgGradient;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />

       {/* FOND */}
       <LinearGradient
        colors={bgColors as any}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.headerContainer}>
        {/* Bouton retour personnalisé pour cohérence */}
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#FFF" }]}>
            <Ionicons name="arrow-back" size={20} color={titleColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: titleColor }]}>
          Catalogue Défis
        </Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* SEARCH BAR */}
        <View style={[styles.searchContainer, { 
            backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FFF",
            borderColor: cardBorder
        }]}>
          <Ionicons name="search" size={20} color={mutedColor} />
          <TextInput
            style={[styles.searchInput, { color: titleColor }]}
            placeholder="Rechercher un défi..."
            placeholderTextColor={mutedColor}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* FILTERS */}
        <TouchableOpacity
          onPress={rotateDefis}
          style={{
            backgroundColor: "#008F6B",
            paddingVertical: 12,
            borderRadius: 14,
            marginBottom: 16,
            alignItems: "center"
          }}
        >
          <Text style={{ color: "white", fontWeight: "800" }}>
            🔁 Faire tourner les défis du jour
          </Text>
        </TouchableOpacity>
        <View style={styles.filterRow}>
          {[
            { key: "all", label: "TOUS" },
            { key: "rotation", label: "EN LIGNE" },
            { key: "inactive", label: "INACTIF" },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterBtn,
                { 
                    backgroundColor: filter === f.key ? listTheme.accent : (isDark ? "rgba(255,255,255,0.05)" : "#FFF"),
                    borderColor: filter === f.key ? listTheme.accent : cardBorder
                },
              ]}
              onPress={() => setFilter(f.key as any)}
            >
              <Text
                style={{
                  color: filter === f.key ? "#fff" : mutedColor,
                  fontWeight: "700",
                  fontSize: 11,
                }}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* LIST */}
        <View style={{ gap: 16 }}>
        {filtered.map((d) => {
          const isOpen = expanded === d.id;

          return (
            <TouchableOpacity
              key={d.id}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setExpanded(isOpen ? null : d.id);
              }}
              activeOpacity={0.9}
              style={[
                  styles.glassCard, 
                  { 
                      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FFF",
                      borderColor: cardBorder
                  }
              ]}
            >
              {/* HEADER DE LA CARD */}
              <View style={styles.rowHeader}>
                
                {/* Icône Catégorie */}
                <View style={[styles.iconBox, { backgroundColor: d.categorie === 'club' ? "#E0F2FE" : "#F3E8FF" }]}>
                    <Ionicons 
                        name={d.categorie === 'club' ? "people" : "person"} 
                        size={20} 
                        color={d.categorie === 'club' ? "#0284C7" : "#9333EA"} 
                    />
                </View>

                <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: titleColor }]} numberOfLines={1}>
                        {d.titre}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <View
                            style={[
                                styles.statusBadge,
                                { backgroundColor: d.statut === "rotation" ? "#DCFCE7" : "#F3F4F6" },
                            ]}
                            >
                            <Text style={[styles.statusText, { color: d.statut === "rotation" ? "#15803D" : "#6B7280" }]}>
                                {d.statut === "rotation" ? "ACTIF" : "OFF"}
                            </Text>
                        </View>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: listTheme.accent }}>{d.points} pts</Text>
                    </View>
                </View>

                {/* Bouton Chevron */}
                <View style={[styles.arrowBox, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F9FAFB" }]}>
                    <Ionicons 
                        name={isOpen ? "chevron-up" : "chevron-down"} 
                        size={16} 
                        color={mutedColor} 
                    />
                </View>
              </View>

              {/* CONTENU ÉTENDU */}
              {isOpen && (
                <View style={styles.expandedContent}>
                  <View style={[styles.divider, { backgroundColor: cardBorder }]} />
                  
                  <Text style={{ color: mutedColor, lineHeight: 22, fontSize: 14 }}>
                    {d.description}
                  </Text>

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>DIFFICULTÉ</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: difficultyColor(d.difficulte) }} />
                            <Text style={{ color: titleColor, fontWeight: "600", fontSize: 13, textTransform: 'capitalize' }}>
                                {d.difficulte}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>DURÉE</Text>
                        <Text style={{ color: titleColor, fontWeight: '600', fontSize: 13 }}>{d.duree} jours</Text>
                    </View>
                  </View>

                  {d.preuve && (
                      <View style={[styles.preuveBox, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F9FAFB", borderColor: cardBorder }]}>
                        <Ionicons name="camera-outline" size={16} color={mutedColor} />
                        <Text style={{ fontSize: 12, color: mutedColor, marginLeft: 6 }}>
                            Preuve requise : {d.preuve}
                        </Text>
                      </View>
                  )}

                  {/* ACTIONS */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                        onPress={() => router.push({ pathname: "/(admin)/create-defi", params: { id: d.id } })}
                        style={[styles.actionBtn, { backgroundColor: listTheme.accent }]}
                    >
                        <Text style={styles.actionBtnText}>Modifier</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={(e) => {
                            e.stopPropagation();
                            setDeleteTargetId(d.id);
                            setDeleteModalVisible(true);
                        }}
                        style={[styles.actionBtn, { backgroundColor: "#FFF", borderWidth: 1, borderColor: listTheme.danger }]}
                    >
                        <Text style={[styles.actionBtnText, { color: listTheme.danger }]}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
        </View>
      </ScrollView>

      {/* DELETE MODAL */}
      <DeleteConfirmModal
        visible={deleteModalVisible}
        onCancel={() => {
          setDeleteModalVisible(false);
          setDeleteTargetId(null);
        }}
        onConfirm={async () => {
          if (deleteTargetId) {
            await deleteDoc(doc(db, "defis", deleteTargetId));
            await loadData();
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
  headerContainer: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backBtn: {
      padding: 8,
      borderRadius: 12,
      shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    fontFamily: FontFamilies.heading,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    fontFamily: FontFamilies.body
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  glassCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: FontFamilies.heading,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: 'uppercase'
  },
  arrowBox: {
      width: 32, height: 32, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center'
  },
  expandedContent: {
    marginTop: 16,
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 32,
  },
  metaItem: {
    gap: 4
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  preuveBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700'
  }
});