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
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

// 🎨 THEME ADMIN FEEDBACK
const feedbackTheme = {
    bgGradient: ["#F9FAFB", "#F3F4F6"] as const,
    glassCardBg: ["#FFFFFF", "rgba(255, 255, 255, 0.8)"] as const,
    borderColor: "rgba(0, 0, 0, 0.05)",
    textMain: "#111827",
    textMuted: "#6B7280",
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

export default function AdminFeedback() {
  const { colors, theme } = useThemeMode();
  const isDark = theme === "dark";

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);

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
    try {
      await deleteDoc(doc(db, "feedbacks", id));
      setFeedbacks((prev) => prev.filter((f) => f.id !== id));
    } catch (error) {
      Alert.alert("Erreur", "Impossible de supprimer cet avis.");
    }
  };

  // 🧠 LOGIQUE DE FILTRAGE
  const uniqueTitles = useMemo(() => {
    const titles = feedbacks.map(f => f.challengeTitle).filter(Boolean);
    return Array.from(new Set(titles));
  }, [feedbacks]);

  const filteredFeedbacks = useMemo(() => {
    if (!selectedChallenge) return feedbacks;
    return feedbacks.filter(f => f.challengeTitle === selectedChallenge);
  }, [selectedChallenge, feedbacks]);

  const averageRating = useMemo(() => {
    if (!selectedChallenge || filteredFeedbacks.length === 0) return 0;
    const sum = filteredFeedbacks.reduce((acc, curr) => acc + curr.rating, 0);
    return (sum / filteredFeedbacks.length).toFixed(1);
  }, [selectedChallenge, filteredFeedbacks]);

  // Helper pour afficher les étoiles
  const renderStars = (rating: number, size: number = 14) => {
    return (
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
  };

  // Couleurs dynamiques
  const titleColor = isDark ? "#FFF" : feedbackTheme.textMain;
  const mutedColor = isDark ? "#9CA3AF" : feedbackTheme.textMuted;
  const cardBorder = isDark ? "rgba(255,255,255,0.1)" : feedbackTheme.borderColor;
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

      <View style={styles.headerContainer}>
        <Text style={[styles.headerTitle, { color: titleColor }]}>Avis & Retours</Text>
        <TouchableOpacity onPress={loadFeedbacks} style={[styles.refreshBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#FFF" }]}>
          <Ionicons name="refresh" size={20} color={titleColor} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={feedbackTheme.accent} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          
          {/* 🆕 SÉLECTEUR DE DÉFIS (FILTRES) */}
          <View style={{ height: 60 }}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={{ paddingHorizontal: 20, alignItems: 'center', gap: 8 }}
            >
              <TouchableOpacity
                onPress={() => setSelectedChallenge(null)}
                style={[
                  styles.filterChip,
                  selectedChallenge === null 
                    ? { backgroundColor: feedbackTheme.accent, borderColor: feedbackTheme.accent } 
                    : { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FFF", borderColor: cardBorder }
                ]}
              >
                <Text style={{ fontWeight: "700", color: selectedChallenge === null ? "#FFF" : mutedColor, fontSize: 13 }}>
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
                      : { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FFF", borderColor: cardBorder }
                  ]}
                >
                  <Text style={{ fontWeight: "600", color: selectedChallenge === title ? "#FFF" : mutedColor, fontSize: 13 }}>
                    {title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* 🆕 STATISTIQUES */}
          {selectedChallenge && (
            <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
              <View style={[styles.statsCard, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FFF", borderColor: cardBorder }]}>
                <View>
                   <Text style={{ color: titleColor, fontSize: 16, fontFamily: FontFamilies.heading, marginBottom: 4 }}>
                     Note Moyenne
                   </Text>
                   <Text style={{ color: mutedColor, fontSize: 12 }}>
                     Sur {filteredFeedbacks.length} avis
                   </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                   <Text style={{ fontSize: 28, fontWeight: '800', color: feedbackTheme.accent }}>
                     {averageRating}
                   </Text>
                   {renderStars(Number(averageRating), 14)}
                </View>
              </View>
            </View>
          )}

          {/* LISTE DES AVIS */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadFeedbacks(); }} />
            }
          >
            {filteredFeedbacks.length === 0 ? (
              <View style={[styles.emptyCard, { borderColor: cardBorder }]}>
                <Ionicons name="chatbox-ellipses-outline" size={48} color={mutedColor} style={{ opacity: 0.5 }} />
                <Text style={{ color: mutedColor, marginTop: 12, fontFamily: FontFamilies.body }}>Aucun avis pour le moment.</Text>
              </View>
            ) : (
              filteredFeedbacks.map((item) => (
                <View key={item.id} style={[styles.card, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FFF", borderColor: cardBorder }]}>
                  
                  {/* Header Carte */}
                  <View style={styles.cardHeader}>
                    <View style={[styles.ratingBadge, { backgroundColor: isDark ? "rgba(245, 158, 11, 0.1)" : "#FEF3C7" }]}>
                      {renderStars(item.rating)}
                      <Text style={{ fontWeight: "700", marginLeft: 6, color: isDark ? "#F59E0B" : "#D97706", fontSize: 12 }}>{item.rating}/5</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 4 }}>
                      <Ionicons name="trash-outline" size={18} color={feedbackTheme.danger} />
                    </TouchableOpacity>
                  </View>

                  {/* Titre Défi */}
                  {!selectedChallenge && (
                    <Text style={[styles.challengeName, { color: feedbackTheme.accent }]}>
                      {item.challengeTitle || "Défi Inconnu"}
                    </Text>
                  )}

                  {/* Commentaire */}
                  <Text style={[styles.comment, { color: titleColor }]}>
                    "{item.comment}"
                  </Text>

                  {/* Footer */}
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
                    <Text style={{ fontSize: 11, color: mutedColor, fontStyle: 'italic' }}>
                      Par {item.userName || "Anonyme"} • {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : "Récemment"}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}

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
  headerTitle: {
    fontSize: 28,
    fontFamily: FontFamilies.heading,
    fontWeight: "800",
  },
  refreshBtn: {
    padding: 10,
    borderRadius: 12,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 4,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 8, elevation: 1
  },
  emptyCard: {
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: 'dashed'
  },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: "#000", 
    shadowOpacity: 0.03, 
    shadowRadius: 10, 
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  challengeName: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: FontFamilies.heading
  },
  comment: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: FontFamilies.body,
  },
});