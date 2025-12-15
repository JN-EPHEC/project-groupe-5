import { AdminNav } from "@/components/ui/(admin)/AdminNav";
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
  
  // 🆕 État pour le filtre sélectionné (null = TOUS)
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
  // 1. Récupérer la liste unique des titres de défis pour le sélecteur
  const uniqueTitles = useMemo(() => {
    const titles = feedbacks.map(f => f.challengeTitle).filter(Boolean);
    return Array.from(new Set(titles)); // Supprime les doublons
  }, [feedbacks]);

  // 2. Filtrer les avis affichés
  const filteredFeedbacks = useMemo(() => {
    if (!selectedChallenge) return feedbacks; // Si "TOUS", on renvoie tout
    return feedbacks.filter(f => f.challengeTitle === selectedChallenge);
  }, [selectedChallenge, feedbacks]);

  // 3. Calculer la moyenne (seulement si un défi est sélectionné)
  const averageRating = useMemo(() => {
    if (!selectedChallenge || filteredFeedbacks.length === 0) return 0;
    const sum = filteredFeedbacks.reduce((acc, curr) => acc + curr.rating, 0);
    return (sum / filteredFeedbacks.length).toFixed(1); // 1 chiffre après la virgule
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
            color="#F59E0B"
          />
        ))}
      </View>
    );
  };

  const glassStyle = {
    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.65)",
    borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.4)",
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient
        colors={isDark ? [colors.background, "#0f2027", "#203a43"] : ["#FAF7F2", "#E8F5E9", "#FFFFFF"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.headerContainer}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Avis Défis</Text>
        <TouchableOpacity onPress={loadFeedbacks} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          
          {/* 🆕 SÉLECTEUR DE DÉFIS (FILTRES) */}
          <View style={{ height: 60 }}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={{ paddingHorizontal: 20, alignItems: 'center', gap: 10 }}
            >
              {/* Bouton TOUS */}
              <TouchableOpacity
                onPress={() => setSelectedChallenge(null)}
                style={[
                  styles.filterChip,
                  selectedChallenge === null 
                    ? { backgroundColor: colors.accent, borderColor: colors.accent } 
                    : { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "white", borderColor: isDark ? "rgba(255,255,255,0.2)" : "#E5E7EB" }
                ]}
              >
                <Text style={{ fontWeight: "700", color: selectedChallenge === null ? "#FFF" : colors.text }}>
                  TOUS
                </Text>
              </TouchableOpacity>

              {/* Liste des défis */}
              {uniqueTitles.map((title) => (
                <TouchableOpacity
                  key={title}
                  onPress={() => setSelectedChallenge(title)}
                  style={[
                    styles.filterChip,
                    selectedChallenge === title 
                      ? { backgroundColor: colors.accent, borderColor: colors.accent } 
                      : { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "white", borderColor: isDark ? "rgba(255,255,255,0.2)" : "#E5E7EB" }
                  ]}
                >
                  <Text style={{ fontWeight: "600", color: selectedChallenge === title ? "#FFF" : colors.mutedText }}>
                    {title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* 🆕 PANNEAU DE STATISTIQUES (Visible seulement si un défi est sélectionné) */}
          {selectedChallenge && (
            <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
              <View style={[styles.statsCard, { backgroundColor: isDark ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.8)" }]}>
                <View>
                   <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>
                     Moyenne
                   </Text>
                   <Text style={{ color: colors.mutedText, fontSize: 12 }}>
                     Basé sur {filteredFeedbacks.length} avis
                   </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                   <Text style={{ fontSize: 32, fontWeight: '900', color: colors.accent }}>
                     {averageRating}
                   </Text>
                   {renderStars(Number(averageRating), 16)}
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
              <View style={[styles.emptyCard, glassStyle]}>
                <Ionicons name="chatbox-ellipses-outline" size={48} color={colors.mutedText} />
                <Text style={{ color: colors.mutedText, marginTop: 10 }}>Aucun avis trouvé.</Text>
              </View>
            ) : (
              filteredFeedbacks.map((item) => (
                <View key={item.id} style={[styles.card, glassStyle]}>
                  
                  {/* Header Carte : Note + Supprimer */}
                  <View style={styles.cardHeader}>
                    <View style={styles.ratingBadge}>
                      {renderStars(item.rating)}
                      <Text style={{ fontWeight: "700", marginLeft: 6, color: colors.text }}>{item.rating}/5</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(item.id)}>
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  {/* Titre du défi (Affiché uniquement si on est en mode "TOUS") */}
                  {!selectedChallenge && (
                    <Text style={[styles.challengeName, { color: colors.accent }]}>
                      {item.challengeTitle || "Défi Inconnu"}
                    </Text>
                  )}

                  {/* Commentaire */}
                  <Text style={[styles.comment, { color: colors.text }]}>
                    "{item.comment}"
                  </Text>

                  {/* Footer : Auteur + Date */}
                  <Text style={{ fontSize: 10, color: colors.mutedText, marginTop: 10, textAlign: "right" }}>
                    Par {item.userName || "Anonyme"} • {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : "Récemment"}
                  </Text>
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
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
  },
  refreshBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 4,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  emptyCard: {
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: "#3E2723", 
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.1)", // Fond jaune très clair
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  challengeName: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  comment: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: "italic",
  },
});