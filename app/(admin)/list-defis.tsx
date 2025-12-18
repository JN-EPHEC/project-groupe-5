import { AdminNav } from "@/components/ui/(admin)/AdminNav";
import { DeleteConfirmModal } from "@/components/ui/(admin)/DeleteConfirmModal";
import { db } from "@/firebaseConfig";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
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

  // DELETE MODAL STATE
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const loadData = async () => {
    const snap = await getDocs(collection(db, "defis"));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Defi[];
    setDefis(list);
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
    d === "facile" ? "#52D192" : d === "moyen" ? "#F4C95D" : "#F45B69";

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />

       {/* 🟢 BACKGROUND LIQUIDE */}
       <LinearGradient
        colors={isDark ? [colors.background, "#0f2027", "#203a43"] : ["#d1fae5", "#cffafe", "#ffffff"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.headerContainer}>
        {/* Suppression du bouton back ici car il est dans le layout */}
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Catalogue Défis
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
      >
        {/* SEARCH BAR */}
        <View style={[styles.searchContainer, { 
            backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.6)",
            borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.5)"
        }]}>
          <Ionicons name="search" size={20} color={colors.mutedText} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Rechercher un défi..."
            placeholderTextColor={colors.mutedText}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* FILTERS */}
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
                    backgroundColor: filter === f.key ? colors.accent : "rgba(0,0,0,0.05)",
                    borderWidth: 1,
                    borderColor: filter === f.key ? colors.accent : "rgba(0,0,0,0.05)"
                },
              ]}
              onPress={() => setFilter(f.key as any)}
            >
              <Text
                style={{
                  color: filter === f.key ? "#fff" : colors.mutedText,
                  fontWeight: "700",
                  fontSize: 10,
                }}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* LIST */}
        <View style={{ gap: 12 }}>
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
                      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.65)",
                      borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.5)"
                  }
              ]}
            >
              {/* HEADER DE LA CARD */}
              <View style={styles.rowHeader}>
                
                {/* Icône Catégorie */}
                <View style={[styles.iconBox, { backgroundColor: d.categorie === 'club' ? "#E0F2FE" : "#F3E8FF" }]}>
                    <Ionicons 
                        name={d.categorie === 'club' ? "people" : "person"} 
                        size={18} 
                        color={d.categorie === 'club' ? "#0284C7" : "#9333EA"} 
                    />
                </View>

                <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
                        {d.titre}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View
                            style={[
                                styles.statusBadge,
                                { backgroundColor: d.statut === "rotation" ? "#3498DB" : "#94A3B8" },
                            ]}
                            >
                            <Text style={styles.statusText}>
                                {d.statut === "rotation" ? "ACTIF" : "OFF"}
                            </Text>
                        </View>
                        <Text style={{ fontSize: 11, color: colors.mutedText }}>• {d.points} pts</Text>
                    </View>
                </View>

                {/* Bouton Chevron */}
                <Ionicons 
                    name={isOpen ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={colors.mutedText} 
                />
              </View>

              {/* CONTENU ÉTENDU */}
              {isOpen && (
                <View style={styles.expandedContent}>
                  <View style={styles.divider} />
                  
                  <Text style={{ color: colors.text, lineHeight: 20 }}>
                    {d.description}
                  </Text>

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>DIFFICULTÉ</Text>
                        <Text style={{ color: difficultyColor(d.difficulte), fontWeight: "700" }}>
                            {d.difficulte.toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>DURÉE</Text>
                        <Text style={{ color: colors.text }}>{d.duree} jour(s)</Text>
                    </View>
                  </View>

                  {d.preuve && (
                     <View style={[styles.preuveBox, { backgroundColor: isDark ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.5)" }]}>
                        <Text style={{ fontSize: 12, color: colors.mutedText, fontStyle: 'italic' }}>
                            <Ionicons name="camera-outline" /> Preuve : {d.preuve}
                        </Text>
                     </View>
                  )}

                  {/* ACTIONS */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                        onPress={() => router.push({ pathname: "/(admin)/create-defi", params: { id: d.id } })}
                        style={[styles.actionBtn, { backgroundColor: colors.accent }]}
                    >
                        <Ionicons name="pencil" size={16} color="#fff" />
                        <Text style={styles.actionBtnText}>Modifier</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={(e) => {
                            e.stopPropagation();
                            setDeleteTargetId(d.id);
                            setDeleteModalVisible(true);
                        }}
                        style={[styles.actionBtn, { backgroundColor: "#EF4444" }]}
                    >
                        <Ionicons name="trash-outline" size={16} color="#fff" />
                        <Text style={styles.actionBtnText}>Supprimer</Text>
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
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginLeft: 60, // Marge pour laisser la place au bouton retour flottant
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  glassCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden'
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },
  expandedContent: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 20,
  },
  metaItem: {
    gap: 2
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF'
  },
  preuveBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 6
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700'
  }
});