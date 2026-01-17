import { AdminNav } from "@/components/ui/(admin)/AdminNav";
import { FontFamilies } from "@/constants/fonts";
import { db } from "@/firebaseConfig";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack } from "expo-router";
import { collection, deleteDoc, doc, getDocs, orderBy, query } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const feedbackTheme = {
  accent: "#008F6B",
  warning: "#F59E0B",
  danger: "#EF4444",
};

type Feedback = {
  id: string;
  challengeTitle: string; 
  rating: number;         
  comment: string;         
  userName?: string;      
  createdAt: any;
};

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function AdminFeedback() {
  const { colors, theme } = useThemeMode();
  const isDark = theme === "dark";

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // FILTRE PAR DÉFI
  const [challengeSearch, setChallengeSearch] = useState(""); 
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);

  const loadFeedbacks = async () => {
    try {
      const q = query(collection(db, "feedbacks"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Feedback));
      setFeedbacks(data);
    } catch (error) {
      console.error("Erreur avis:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadFeedbacks(); }, []);

  const handleDelete = async (id: string) => {
    Alert.alert("Supprimer ?", "Action irréversible.", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: async () => {
          await deleteDoc(doc(db, "feedbacks", id));
          setFeedbacks((prev) => prev.filter((f) => f.id !== id));
      }}
    ]);
  };

  const allChallengeTitles = useMemo(() => {
    const titles = feedbacks.map(f => f.challengeTitle).filter(Boolean);
    return Array.from(new Set(titles)).sort();
  }, [feedbacks]);

  const filteredTitles = useMemo(() => {
    if (!challengeSearch) return [];
    return allChallengeTitles.filter(t => t.toLowerCase().includes(challengeSearch.toLowerCase()));
  }, [challengeSearch, allChallengeTitles]);

  const challengeStats = useMemo(() => {
    if (!selectedChallenge) return null;
    const relevant = feedbacks.filter(f => f.challengeTitle === selectedChallenge);
    if (relevant.length === 0) return null;
    const avg = relevant.reduce((sum, f) => sum + f.rating, 0) / relevant.length;
    return { average: avg.toFixed(1), count: relevant.length, rawAvg: avg };
  }, [selectedChallenge, feedbacks]);

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter(f => selectedChallenge ? f.challengeTitle === selectedChallenge : true);
  }, [selectedChallenge, feedbacks]);

  const renderStars = (rating: number, size = 10) => (
    <View style={{ flexDirection: "row", gap: 1 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Ionicons key={s} name={s <= rating ? "star" : "star-outline"} size={size} color={feedbackTheme.warning} />
      ))}
    </View>
  );

  const titleColor = isDark ? "#FFF" : "#111827";
  const mutedColor = isDark ? "#9CA3AF" : "#6B7280";
  const cardBg = isDark ? "#1F2937" : "#FFF";
  const borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? colors.background : "#F9FAFB" }}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          
          {/* HEADER */}
          <View style={styles.header}>
            <View style={{ width: 44 }} /> 
            <Text style={[styles.headerTitle, { color: titleColor }]}>Avis & Retours</Text>
            <TouchableOpacity onPress={() => { setLoading(true); loadFeedbacks(); }} style={styles.refreshBtn}>
              <Ionicons name="refresh" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* RECHERCHE DE DÉFI */}
          <View style={[styles.filterBox, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.searchRow}>
              <Ionicons name="filter" size={18} color={feedbackTheme.accent} />
              <TextInput 
                placeholder="Rechercher un défi..." 
                placeholderTextColor={mutedColor}
                style={[styles.filterInput, { color: titleColor }]}
                value={challengeSearch}
                onChangeText={setChallengeSearch}
              />
              {selectedChallenge && (
                <TouchableOpacity onPress={() => {setSelectedChallenge(null); setChallengeSearch("")}}>
                  <Ionicons name="close-circle" size={20} color={feedbackTheme.danger} />
                </TouchableOpacity>
              )}
            </View>

            {challengeSearch !== "" && !selectedChallenge && (
              <ScrollView style={styles.suggestionList} nestedScrollEnabled>
                {filteredTitles.map(t => (
                  <TouchableOpacity key={t} style={styles.suggestionItem} onPress={() => {setSelectedChallenge(t); setChallengeSearch(t)}}>
                    <Text style={{ color: titleColor }}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* STATS DU DÉFI */}
          {selectedChallenge && challengeStats && (
            <LinearGradient colors={["#008F6B", "#005F47"]} style={styles.statsCard}>
               <View style={styles.statsContent}>
                  <Text style={styles.statsNumber}>{challengeStats.average}<Text style={{fontSize:14, opacity:0.8}}>/5</Text></Text>
                  <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={styles.statsTitle} numberOfLines={1}>{selectedChallenge}</Text>
                    <Text style={styles.statsSub}>{challengeStats.count} avis</Text>
                  </View>
                  {renderStars(challengeStats.rawAvg, 16)}
               </View>
            </LinearGradient>
          )}

          {/* GRILLE D'AVIS (2 PAR LIGNE) */}
          {loading ? (
            <ActivityIndicator style={{ marginTop: 50 }} color={feedbackTheme.accent} />
          ) : (
            <ScrollView
              contentContainerStyle={styles.gridContainer}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadFeedbacks} />}
              showsVerticalScrollIndicator={false}
            >
              {filteredFeedbacks.length === 0 ? (
                <Text style={{ textAlign: 'center', color: mutedColor, marginTop: 40, width: '100%' }}>Aucun avis trouvé.</Text>
              ) : (
                filteredFeedbacks.map((item) => (
                  <View key={item.id} style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                    <View style={styles.cardHeader}>
                      {renderStars(item.rating)}
                      <TouchableOpacity onPress={() => handleDelete(item.id)}>
                        <Ionicons name="trash-outline" size={14} color={feedbackTheme.danger} />
                      </TouchableOpacity>
                    </View>
                    
                    <Text style={[styles.cardChallenge, { color: feedbackTheme.accent }]} numberOfLines={1}>
                      {item.challengeTitle}
                    </Text>

                    {/* Affichage du commentaire sans guillemets ou barre si vide */}
                    <Text style={[styles.cardComment, { color: titleColor, opacity: item.comment ? 1 : 0.4 }]} numberOfLines={4}>
                      {item.comment && item.comment.trim() !== "" ? item.comment : "—"}
                    </Text>

                    <Text style={[styles.cardUser, { color: mutedColor }]}>
                      {item.userName || "Anonyme"}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
      <AdminNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 15 },
  headerTitle: { fontSize: 22, fontWeight: "900", fontFamily: FontFamilies.heading },
  refreshBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: feedbackTheme.accent, alignItems: 'center', justifyContent: 'center' },
  
  filterBox: { borderRadius: 16, borderWidth: 1, padding: 12, marginBottom: 15 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  filterInput: { flex: 1, fontSize: 14, fontFamily: FontFamilies.body },
  suggestionList: { maxHeight: 150, marginTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  suggestionItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.02)' },

  statsCard: { borderRadius: 16, padding: 15, marginBottom: 15, elevation: 4 },
  statsContent: { flexDirection: 'row', alignItems: 'center' },
  statsNumber: { fontSize: 28, fontWeight: "900", color: "#FFF" },
  statsTitle: { color: "#FFF", fontWeight: "700", fontSize: 14, flex: 1 },
  statsSub: { color: "rgba(255,255,255,0.7)", fontSize: 11 },

  gridContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', // Force l'espacement entre les deux colonnes
    paddingBottom: 100 
  },
  card: {
    width: (SCREEN_WIDTH / 2) - 22, // Calcul précis pour 2 par ligne avec marges
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    height: 140, // Hauteur fixe pour une grille régulière
    justifyContent: 'space-between'
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardChallenge: { fontSize: 9, fontWeight: "800", textTransform: 'uppercase' },
  cardComment: { fontSize: 12, lineHeight: 16, flex: 1, marginVertical: 8 },
  cardUser: { fontSize: 9, fontWeight: "600", textAlign: 'right', fontStyle: 'italic' }
});