import { AdminNav } from "@/components/ui/(admin)/AdminNav";
import { DeleteConfirmModal } from "@/components/ui/(admin)/DeleteConfirmModal";
import { db } from "@/firebaseConfig";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

// Enable layout animation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ListDefisScreen() {
  const { colors } = useThemeMode();
  const router = useRouter();

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
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.title, { color: colors.text }]}>Liste des défis</Text>

        {/* SEARCH */}
        <TextInput
          style={[
            styles.search,
            { backgroundColor: colors.surface, color: colors.text },
          ]}
          placeholder="Rechercher un défi..."
          placeholderTextColor={colors.mutedText}
          value={search}
          onChangeText={setSearch}
        />

        {/* FILTERS */}
        <View style={styles.filterRow}>
          {[
            { key: "all", label: "Tous" },
            { key: "rotation", label: "En rotation" },
            { key: "inactive", label: "Inactif" },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterBtn,
                { backgroundColor: filter === f.key ? colors.accent : colors.surfaceAlt },
              ]}
              onPress={() => setFilter(f.key as any)}
            >
              <Text
                style={{
                  color: filter === f.key ? "#fff" : colors.text,
                  fontWeight: "600",
                  fontSize: 12,
                }}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* LIST */}
        {filtered.map((d) => {
          const isOpen = expanded === d.id;

          return (
            <TouchableOpacity
              key={d.id}
              onPress={() => {
                LayoutAnimation.easeInEaseOut();
                setExpanded(isOpen ? null : d.id);
              }}
              activeOpacity={0.8}
              style={[styles.rowItem, { backgroundColor: colors.surface }]}
            >
              {/* HEADER */}
              <View style={styles.rowHeader}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  {d.titre}
                </Text>

                {/* STATUS BADGE */}
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        d.statut === "rotation" ? "#3498DB" : "#7F8C8D",
                    },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {d.statut === "rotation" ? "En rotation" : "Inactif"}
                  </Text>
                </View>

                {/* EDIT BUTTON */}
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/(admin)/create-defi",
                      params: { id: d.id },
                    })
                  }
                  style={[styles.smallBtn, { backgroundColor: colors.accent }]}
                >
                  <Ionicons name="pencil" size={18} color="#fff" />
                </TouchableOpacity>

                {/* DELETE BUTTON */}
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    setDeleteTargetId(d.id);
                    setDeleteModalVisible(true);
                  }}
                  style={[styles.smallBtn, { backgroundColor: "#B00020" }]}
                >
                  <Ionicons name="trash-outline" size={18} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* EXPANDED */}
              {isOpen && (
                <View style={styles.expanded}>
                  <Text style={{ color: colors.mutedText }}>
                    {d.description}
                  </Text>

                  <Text style={{ color: colors.mutedText, marginTop: 6 }}>
                    Catégorie : {d.categorie}
                  </Text>

                  <Text style={{ color: colors.mutedText }}>
                    Durée : {d.duree} jour(s)
                  </Text>

                  <Text
                    style={{
                      color: difficultyColor(d.difficulte),
                      marginTop: 4,
                      fontWeight: "700",
                    }}
                  >
                    Difficulté : {d.difficulte}
                  </Text>

                  <Text style={{ color: colors.mutedText }}>
                    Points : {d.points}
                  </Text>

                  {d.preuve && (
                    <Text style={{ color: colors.mutedText }}>
                      Preuve : {d.preuve}
                    </Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* DELETE CONFIRM MODAL */}
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

      {/* BOTTOM NAV */}
      <AdminNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 14 },
  search: { padding: 12, borderRadius: 12, marginBottom: 16 },
  filterRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  filterBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },
  rowItem: { borderRadius: 14, marginBottom: 12, padding: 12 },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowTitle: { flex: 1, fontSize: 15, fontWeight: "600" },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  smallBtn: { padding: 6, borderRadius: 8 },
  expanded: {
    marginTop: 10,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#ffffff22",
  },
});
