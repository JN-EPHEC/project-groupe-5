import { AdminNav } from "@/components/ui/(admin)/AdminNav";
import { FontFamilies } from "@/constants/fonts";
import { db } from "@/firebaseConfig";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
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

// 🎨 THEME ADMIN
const feedbackTheme = {
  bgGradient: ["#F9FAFB", "#F3F4F6"] as const,
  accent: "#008F6B", // Vert du thème
  warning: "#F59E0B", // Jaune étoiles
  danger: "#EF4444", // Rouge suppression
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
  const router = useRouter();
  const { colors, theme } = useThemeMode();
  const isDark = theme === "dark";

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  
  // 🆕 STATE POUR LE LAYOUT ET FILTRES
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // 📥 Charger les avis
  const loadFeedbacks = async () => {
    try {
      const q = query(collection(db, "feedbacks"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Feedback));
      setFeedbacks(data);
    } catch (error) {
      console.error("Erreur chargement avis:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFeedbacks();
  }, []);

  // 🗑️ Supprimer un avis
  const handleDelete = async (id: string) => {
    Alert.alert(
      "Supprimer l'avis ?",
      "Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "feedbacks", id));
              setFeedbacks((prev) => prev.filter((f) => f.id !== id));
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer cet avis.");
            }
          }
        }
      ]
    );
  };

  // 🧠 FILTRAGE (Recherche + Catégorie)
  const uniqueTitles = useMemo(() => {
    const titles = feedbacks.map(f => f.challengeTitle).filter(Boolean);
    return Array.from(new Set(titles));
  }, [feedbacks]);

  // 📊 CALCUL DES STATS DU DÉFI SÉLECTIONNÉ
  const challengeStats = useMemo(() => {
    if (!selectedChallenge) return null;

    // On récupère tous les avis du défi (indépendamment de la recherche textuelle pour avoir une vraie moyenne)
    const relevantFeedbacks = feedbacks.filter(f => f.challengeTitle === selectedChallenge);
    
    if (relevantFeedbacks.length === 0) return null;

    const totalRating = relevantFeedbacks.reduce((sum, f) => sum + f.rating, 0);
    const avg = totalRating / relevantFeedbacks.length;

    return {
      average: avg.toFixed(1), // Ex: "4.2"
      count: relevantFeedbacks.length,
      rawAvg: avg
    };
  }, [selectedChallenge, feedbacks]);

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter(f => {
      // Filtre par titre de défi (Chips)
      const matchChallenge = selectedChallenge ? f.challengeTitle === selectedChallenge : true;
      // Filtre par recherche (Commentaire ou Nom d'utilisateur)
      const searchLower = search.toLowerCase();
      const matchSearch = search 
        ? (f.comment?.toLowerCase().includes(searchLower) || f.userName?.toLowerCase().includes(searchLower) || f.challengeTitle?.toLowerCase().includes(searchLower))
        : true;
      
      return matchChallenge && matchSearch;
    });
  }, [selectedChallenge, search, feedbacks]);

  // Helper étoiles (taille dynamique)
  const renderStars = (rating: number, size = 12) => (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? "star" : (star - 0.5 <= rating ? "star-half" : "star-outline")}
          size={size}
          color={feedbackTheme.warning}
        />
      ))}
    </View>
  );

  // Styles dynamiques
  const titleColor = isDark ? "#FFF" : "#111827";
  const mutedColor = isDark ? "#9CA3AF" : "#6B7280";
  const cardBg = isDark ? "rgba(255,255,255,0.05)" : "#FFF";
  const borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";
  const bgColors = isDark ? [colors.background, "#1F2937"] : feedbackTheme.bgGradient;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient
        colors={bgColors as any}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
            
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: cardBg }]}>
                    <Ionicons name="arrow-back" size={24} color={titleColor} />
                </TouchableOpacity>

                <Text style={[styles.headerTitle, { color: titleColor }]}>Avis & Retours</Text>

                <TouchableOpacity onPress={() => { setLoading(true); loadFeedbacks(); }} style={styles.actionBtn}>
                    <Ionicons name="refresh" size={22} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* SEARCH BAR */}
            <View style={[styles.searchBar, { backgroundColor: cardBg, borderColor }]}>
                <Ionicons name="search" size={20} color={mutedColor} />
                <TextInput 
                    style={[styles.searchInput, { color: titleColor }]} 
                    placeholder="Rechercher un avis..." 
                    placeholderTextColor={mutedColor}
                    value={search} onChangeText={setSearch}
                />
            </View>

            {/* 🆕 FILTRES & LAYOUT */}
            <View style={[styles.filterContainerCard, { backgroundColor: cardBg, borderColor }]}>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 50, gap: 8 }}
                >
                    <TouchableOpacity
                        onPress={() => setSelectedChallenge(null)}
                        style={[
                            styles.filterChip,
                            selectedChallenge === null 
                                ? { backgroundColor: feedbackTheme.accent, borderColor: feedbackTheme.accent } 
                                : { backgroundColor: "transparent", borderColor: mutedColor + "30" }
                        ]}
                    >
                        <Text style={{ fontWeight: "700", color: selectedChallenge === null ? "#FFF" : mutedColor, fontSize: 12 }}>
                            TOUS
                        </Text>
                    </TouchableOpacity>

                    {uniqueTitles.map((title) => (
                        <TouchableOpacity
                            key={title}
                            onPress={() => setSelectedChallenge(title)}
                            style={[
                                styles.filterChip,
                                selectedChallenge === title 
                                    ? { backgroundColor: feedbackTheme.accent, borderColor: feedbackTheme.accent } 
                                    : { backgroundColor: "transparent", borderColor: mutedColor + "30" }
                            ]}
                        >
                            <Text style={{ fontWeight: "600", color: selectedChallenge === title ? "#FFF" : mutedColor, fontSize: 12 }}>
                                {title}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.layoutBtnContainer}>
                    <TouchableOpacity 
                        onPress={() => setViewMode(prev => prev === 'list' ? 'grid' : 'list')}
                        style={styles.layoutBtn}
                    >
                         <Ionicons 
                            name={viewMode === 'list' ? "grid-outline" : "list-outline"} 
                            size={18} 
                            color={mutedColor} 
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* 🆕 CARTE DE STATISTIQUES (Affiche seulement si un défi est sélectionné) */}
            {selectedChallenge && challengeStats && (
              <LinearGradient
                colors={isDark ? ["#008F6B", "#006C51"] : ["#E6FFFA", "#E6FFFA"]}
                style={[styles.statsCard, { borderColor: isDark ? 'transparent' : feedbackTheme.accent + '30' }]}
              >
                  <View style={styles.statsLeft}>
                      <Text style={[styles.statsBigNumber, { color: isDark ? "#FFF" : feedbackTheme.accent }]}>
                        {challengeStats.average}
                        <Text style={{ fontSize: 16, color: isDark ? "rgba(255,255,255,0.7)" : mutedColor }}>/5</Text>
                      </Text>
                  </View>

                  <View style={styles.statsRight}>
                      <Text style={[styles.statsLabel, { color: isDark ? "#E5E7EB" : "#374151" }]}>
                        Moyenne globale
                      </Text>
                      <View style={{ marginVertical: 4 }}>
                        {renderStars(challengeStats.rawAvg, 18)}
                      </View>
                      <Text style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.7)" : mutedColor }}>
                        Basé sur {challengeStats.count} avis
                      </Text>
                  </View>

                  {/* Icone décorative en fond */}
                  <Ionicons 
                    name="ribbon" 
                    size={60} 
                    color={isDark ? "rgba(255,255,255,0.1)" : feedbackTheme.accent + '10'} 
                    style={{ position: 'absolute', right: -10, bottom: -10 }}
                  />
              </LinearGradient>
            )}

            {/* LISTE */}
            {loading ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator size="large" color={feedbackTheme.accent} />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={{ paddingBottom: 100, flexDirection: viewMode === 'grid' ? 'row' : 'column', flexWrap: 'wrap', justifyContent: 'space-between' }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadFeedbacks} />}
                    showsVerticalScrollIndicator={false}
                >
                    {filteredFeedbacks.length === 0 ? (
                        <View style={[styles.emptyState, { borderColor, width: '100%' }]}>
                            <Text style={{ color: mutedColor }}>Aucun avis trouvé.</Text>
                        </View>
                    ) : (
                        filteredFeedbacks.map((item) => (
                            <View 
                                key={item.id} 
                                style={[
                                    styles.card, 
                                    { 
                                        backgroundColor: cardBg, 
                                        borderColor,
                                        width: viewMode === 'grid' ? (SCREEN_WIDTH / 2) - 26 : '100%' 
                                    }
                                ]}
                            >
                                <View style={styles.cardHeader}>
                                    <View style={{ flex: 1 }}>
                                        <View style={styles.ratingRow}>
                                            {renderStars(item.rating)}
                                            {viewMode === 'list' && <Text style={{ fontSize: 12, fontWeight: "700", color: "#F59E0B", marginLeft: 6 }}>{item.rating}/5</Text>}
                                        </View>
                                        <Text 
                                            numberOfLines={1}
                                            style={[styles.challengeName, { color: feedbackTheme.accent }]}
                                        >
                                            {item.challengeTitle || "DÉFI INCONNU"}
                                        </Text>
                                    </View>
                                    
                                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                                        <Ionicons name="trash-outline" size={16} color={feedbackTheme.danger} />
                                    </TouchableOpacity>
                                </View>

                                <Text numberOfLines={viewMode === 'grid' ? 4 : undefined} style={[styles.comment, { color: titleColor }]}>
                                    "{item.comment}"
                                </Text>

                                <View style={styles.cardFooter}>
                                    <Text style={{ fontSize: 10, color: mutedColor, fontStyle: 'italic' }}>
                                        {item.userName || "Anonyme"} • {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : "?"}
                                    </Text>
                                </View>
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
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 20,
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    fontFamily: FontFamilies.heading,
    textAlign: 'center',
  },
  actionBtn: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: "#008F6B",
    alignItems: 'center', justifyContent: 'center',
    elevation: 3,
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4
  },
  
  // SEARCH
  searchBar: { 
    flexDirection: 'row', alignItems: 'center', 
    height: 50, borderRadius: 16, 
    paddingHorizontal: 16, marginBottom: 12, borderWidth: 1 
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, fontFamily: FontFamilies.body },

  // FILTER CARD CONTAINER
  filterContainerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 56,
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 16,
      position: 'relative',
      paddingVertical: 8
  },
  filterChip: {
    paddingVertical: 6, paddingHorizontal: 14,
    borderRadius: 20, borderWidth: 1,
  },
  layoutBtnContainer: {
      position: 'absolute',
      right: 8,
      height: '100%',
      justifyContent: 'center'
  },
  layoutBtn: {
      padding: 8,
      backgroundColor: 'rgba(0,0,0,0.03)',
      borderRadius: 10
  },

  // 🆕 STATS CARD
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden', // pour couper l'icone de fond
  },
  statsLeft: {
    marginRight: 16,
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.1)'
  },
  statsBigNumber: {
    fontSize: 32,
    fontWeight: "800",
    fontFamily: FontFamilies.heading,
  },
  statsRight: {
    flex: 1,
    justifyContent: 'center'
  },
  statsLabel: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },

  // CARDS
  emptyState: { padding: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 20, borderStyle: 'dashed' },
  
  card: {
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 8, elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  challengeName: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  deleteBtn: { padding: 4 },
  
  comment: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FontFamilies.body,
    marginBottom: 10,
    fontStyle: "italic"
  },
  
  cardFooter: {
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 8,
    marginTop: 4
  }
});