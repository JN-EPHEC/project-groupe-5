import { AdminNav } from "@/components/ui/(admin)/AdminNav";
import { db } from "@/firebaseConfig";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import { collection, deleteDoc, doc, getDocs, orderBy, query, writeBatch } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

// Type mis à jour avec les infos de preuve
type Report = {
  id: string;
  challengeId: string;
  challengeTitle: string;
  proofId: string;         // ID de la preuve
  proofContent: string;    // URL image ou Texte
  proofType: 'image' | 'text';
  reason: string;
  reportedBy: string;
  createdAt: any;
  status: "pending" | "accepted" | "rejected";
};

export default function AdminReports() {
  const { colors, theme } = useThemeMode();
  const router = useRouter();
  const isDark = theme === "dark";

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 📥 Charger les signalements
  const loadReports = async () => {
    try {
      const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Report));
      setReports(data);
    } catch (error) {
      console.error("Erreur chargement signalements:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // ⚖️ Gérer la modération (Accepter ou Refuser le signalement)
  const handleModeration = async (report: Report, action: 'SANCTION' | 'RESTORE') => {
    try {
      const batch = writeBatch(db);
      
      // Références
      const reportRef = doc(db, "reports", report.id);
      // ⚠️ VERIFIE LE NOM DE TA COLLECTION DE PREUVES ICI (ex: "proofs", "posts", "validatedChallenges")
      const proofRef = doc(db, "preuves", report.proofId); 

      if (action === 'SANCTION') {
        // 🔴 CAS 1 : Le signalement est vrai. On valide la sanction.
        batch.update(reportRef, { status: "accepted" });
        batch.update(proofRef, { 
          status: "BANNED", 
          isVisible: false // Reste masqué
        });
        
        // Mise à jour locale
        setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: "accepted" } : r));
        Alert.alert("Sanctionné", "Le contenu a été définitivement supprimé/masqué.");

      } else {
        // 🟢 CAS 2 : Faux signalement. On restaure le contenu.
        batch.update(reportRef, { status: "rejected" });
        batch.update(proofRef, { 
          status: "VALIDATED", // Retour au statut normal
          isVisible: true // Réapparaît dans le fil
        });

        // Mise à jour locale
        setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: "rejected" } : r));
        Alert.alert("Restauré", "Le signalement a été rejeté et le contenu est de nouveau visible.");
      }

      await batch.commit();

    } catch (error) {
      console.error(error);
      Alert.alert("Erreur", "Impossible de traiter le signalement.");
    }
  };

  // 🗑️ Supprimer le signalement de la liste (nettoyage admin uniquement)
  const handleDeleteReport = async (reportId: string) => {
    try {
      await deleteDoc(doc(db, "reports", reportId));
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (error) {
      Alert.alert("Erreur", "Impossible de supprimer le signalement.");
    }
  };

  const glassStyle = {
    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.75)",
    borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.4)",
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient
        colors={isDark ? [colors.background, "#0f2027", "#203a43"] : ["#d1fae5", "#cffafe", "#ffffff"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Signalements
        </Text>
        <TouchableOpacity onPress={loadReports} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          refreshControl={
             <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadReports(); }} />
          }
        >
          {reports.length === 0 ? (
            <View style={[styles.emptyCard, glassStyle]}>
              <Ionicons name="checkmark-circle-outline" size={48} color={colors.accent} />
              <Text style={{ color: colors.mutedText, marginTop: 10 }}>Aucun signalement à traiter.</Text>
            </View>
          ) : (
            reports.map((report) => (
              <View
                key={report.id}
                style={[
                  styles.card,
                  glassStyle,
                  { borderLeftColor: report.status === "pending" ? "#EF4444" : (report.status === "accepted" ? "#EF4444" : "#10B981") }
                ]}
              >
                {/* En-tête Badge statut */}
                <View style={styles.cardHeader}>
                  <View style={styles.badgeContainer}>
                    {report.status === "pending" && (
                      <View style={[styles.statusBadge, { backgroundColor: "#FEE2E2" }]}>
                        <Text style={[styles.statusText, { color: "#EF4444" }]}>À TRAITER</Text>
                      </View>
                    )}
                    {report.status === "accepted" && (
                      <View style={[styles.statusBadge, { backgroundColor: "#fee2e2" }]}>
                        <Text style={[styles.statusText, { color: "#b91c1c" }]}>SANCTIONNÉ</Text>
                      </View>
                    )}
                    {report.status === "rejected" && (
                      <View style={[styles.statusBadge, { backgroundColor: "#D1FAE5" }]}>
                        <Text style={[styles.statusText, { color: "#10B981" }]}>REJETÉ (Rétabli)</Text>
                      </View>
                    )}
                    
                    <Text style={{ fontSize: 10, color: colors.mutedText, marginLeft: 8 }}>
                       {report.createdAt?.seconds ? new Date(report.createdAt.seconds * 1000).toLocaleDateString() : "Récemment"}
                    </Text>
                  </View>
                  
                  <TouchableOpacity onPress={() => handleDeleteReport(report.id)}>
                    <Ionicons name="close" size={18} color={colors.mutedText} />
                  </TouchableOpacity>
                </View>

                {/* Titre Défi + Raison */}
                <Text style={[styles.challengeTitle, { color: colors.text }]}>
                  {report.challengeTitle}
                </Text>
                
                <Text style={{fontSize: 12, color: colors.mutedText, marginBottom: 4}}>Motif du signalement :</Text>
                <View style={[styles.reasonBox, { backgroundColor: isDark ? "rgba(255,0,0,0.15)" : "#fee2e2" }]}>
                   <Text style={{ color: isDark ? "#ffbaba" : "#b91c1c", fontWeight: "600", fontStyle: 'italic' }}>
                     "{report.reason}"
                   </Text>
                </View>

                {/* --- ZONE VISUALISATION DU CONTENU --- */}
                <View style={styles.contentPreview}>
                  <Text style={{fontSize: 12, color: colors.mutedText, marginBottom: 6}}>Contenu incriminé :</Text>
                  
                  {report.proofType === 'image' && report.proofContent ? (
                    <Image 
                      source={{ uri: report.proofContent }} 
                      style={styles.proofImage} 
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.textBox, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#f3f4f6" }]}>
                       <Text style={{ color: colors.text }}>{report.proofContent || "Aucun contenu textuel"}</Text>
                    </View>
                  )}
                </View>

                {/* Actions - N'apparaissent que si Pending */}
                {report.status === "pending" ? (
                  <View style={styles.actionRow}>
                    {/* BOUTON 1 : REFUSER / RESTAURER */}
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.surfaceAlt, flex: 1, marginRight: 8 }]}
                      onPress={() => handleModeration(report, 'RESTORE')}
                    >
                      <Ionicons name="refresh-outline" size={18} color={colors.text} />
                      <Text style={[styles.actionButtonText, { color: colors.text }]}>Faux Signalement</Text>
                      <Text style={{fontSize:9, color:colors.mutedText}}>(Réafficher)</Text>
                    </TouchableOpacity>

                    {/* BOUTON 2 : ACCEPTER / SANCTIONNER */}
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: "#EF4444", flex: 1, marginLeft: 8 }]}
                      onPress={() => handleModeration(report, 'SANCTION')}
                    >
                      <Ionicons name="trash-outline" size={18} color="white" />
                      <Text style={[styles.actionButtonText, { color: "white" }]}>Sanctionner</Text>
                      <Text style={{fontSize:9, color:"white", opacity: 0.8}}>(Supprimer)</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ marginTop: 12, alignItems: 'center' }}>
                     <Text style={{ fontSize: 12, color: colors.mutedText, fontStyle: 'italic' }}>
                       Ce signalement a déjà été traité.
                     </Text>
                  </View>
                )}

              </View>
            ))
          )}
        </ScrollView>
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
  emptyCard: {
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderLeftWidth: 4, 
    overflow: 'hidden'
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  reasonBox: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  contentPreview: {
    marginBottom: 15,
  },
  proofImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.1)'
  },
  textBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)'
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 2
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '700',
  }
});