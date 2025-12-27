import { AdminNav } from "@/components/ui/(admin)/AdminNav";
import { FontFamilies } from "@/constants/fonts";
import { db } from "@/firebaseConfig";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, writeBatch } from "firebase/firestore";
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
// 🟢 IMPORT AJOUTÉ POUR GÉRER L'ENCOCHE CORRECTEMENT
import { SafeAreaView } from "react-native-safe-area-context";

// 🎨 THEME ADMIN REPORTS
const reportsTheme = {
  bgGradient: ["#F9FAFB", "#F3F4F6"] as const,
  glassCardBg: ["#FFFFFF", "rgba(255, 255, 255, 0.8)"] as const,
  borderColor: "rgba(0, 0, 0, 0.05)",
  textMain: "#111827",
  textMuted: "#6B7280",
  accent: "#008F6B",
  danger: "#EF4444",
  success: "#10B981",
  warning: "#F59E0B",
};

type Report = {
  id: string;
  challengeId: string;
  challengeTitle: string;
  proofId: string;
  proofContent: string;
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

  // 🛡️ LOGIQUE DE SANCTION
  const checkOffenderAndSanction = async (report: Report) => {
    try {
        setLoading(true);
        const proofRef = doc(db, "preuves", report.proofId);
        const proofSnap = await getDoc(proofRef);
        
        if (!proofSnap.exists()) {
            Alert.alert("Erreur", "La preuve n'existe plus.");
            setLoading(false);
            return;
        }

        const proofData = proofSnap.data();
        const offenderId = proofData.userId; 

        const userRef = doc(db, "users", offenderId);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            applySanction(report, offenderId, false, false);
            return;
        }

        const userData = userSnap.data();
        const alreadyWarned = userData.hasWarning === true;

        setLoading(false);

        if (alreadyWarned) {
            Alert.alert(
                "RÉCIDIVISTE DÉTECTÉ 🚨",
                "Cet utilisateur a déjà un avertissement. Action ?",
                [
                    { text: "Annuler", style: "cancel" },
                    { text: "Supprimer contenu", onPress: () => applySanction(report, offenderId, false, false) },
                    { text: "BANNIR", style: "destructive", onPress: () => applySanction(report, offenderId, true, true) }
                ]
            );
        } else {
            Alert.alert(
                "Sanction",
                "L'utilisateur recevra un avertissement.",
                [
                    { text: "Annuler", style: "cancel" },
                    { text: "Sanctionner & Avertir", style: "destructive", onPress: () => applySanction(report, offenderId, true, false) }
                ]
            );
        }

    } catch (error) {
        console.error(error);
        setLoading(false);
        Alert.alert("Erreur", "Vérification impossible.");
    }
  };

  const applySanction = async (report: Report, offenderId: string, applyWarning: boolean, applyBan: boolean) => {
    try {
      const batch = writeBatch(db);
      const reportRef = doc(db, "reports", report.id);
      batch.update(reportRef, { status: "accepted" });

      const proofRef = doc(db, "preuves", report.proofId); 
      batch.update(proofRef, { status: "BANNED", isVisible: false });

      if (offenderId) {
          const userRef = doc(db, "users", offenderId);
          if (applyBan) {
              batch.update(userRef, { isBanned: true, bannedAt: new Date() });
          } else if (applyWarning) {
              batch.update(userRef, { hasWarning: true, warningDate: new Date() });
          }
      }

      await batch.commit();
      setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: "accepted" } : r));
      
      if (applyBan) Alert.alert("Banni", "Utilisateur banni.");
      else if (applyWarning) Alert.alert("Averti", "Avertissement envoyé.");
      else Alert.alert("Supprimé", "Contenu masqué.");

    } catch (error) {
      Alert.alert("Erreur", "Echec sanction.");
    }
  };

  const handleRestore = async (report: Report) => {
    try {
        const batch = writeBatch(db);
        const reportRef = doc(db, "reports", report.id);
        const proofRef = doc(db, "preuves", report.proofId); 
        
        batch.update(reportRef, { status: "rejected" });
        batch.update(proofRef, { status: "VALIDATED", isVisible: true });
        
        await batch.commit();
        setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: "rejected" } : r));
        Alert.alert("Restauré", "Signalement rejeté.");
    } catch (e) {
        Alert.alert("Erreur", "Action impossible.");
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await deleteDoc(doc(db, "reports", reportId));
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (error) {
      Alert.alert("Erreur", "Impossible de supprimer.");
    }
  };

  // Couleurs dynamiques
  const titleColor = isDark ? "#FFF" : reportsTheme.textMain;
  const mutedColor = isDark ? "#9CA3AF" : reportsTheme.textMuted;
  const cardBorder = isDark ? "rgba(255,255,255,0.1)" : reportsTheme.borderColor;
  const bgColors = isDark ? [colors.background, "#1F2937"] : reportsTheme.bgGradient;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient
        colors={bgColors as any}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* 🟢 SafeAreaView remplace le View classique pour gérer l'encoche */}
      <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.container}>
            
            {/* HEADER CORRIGÉ (Style "Avis") */}
            <View style={styles.header}>
                {/* 1. Élément GAUCHE : Vue vide pour équilibrer le bouton de droite */}
                <View style={{ width: 44, height: 44 }} />

                {/* 2. CENTRE : Titre centré */}
                <Text style={[styles.headerTitle, { color: titleColor }]}>Signalements</Text>

                {/* 3. DROITE : Bouton Refresh */}
                <TouchableOpacity onPress={loadReports} style={[styles.actionBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#FFF" }]}>
                    <Ionicons name="refresh" size={22} color={titleColor} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color={reportsTheme.accent} />
                </View>
            ) : (
                <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadReports(); }} />
                }
                >
                {reports.length === 0 ? (
                    <View style={[styles.emptyCard, { borderColor: cardBorder }]}>
                    <Ionicons name="checkmark-circle-outline" size={48} color={reportsTheme.accent} style={{ opacity: 0.5 }} />
                    <Text style={{ color: mutedColor, marginTop: 12, fontFamily: FontFamilies.body }}>Aucun signalement à traiter.</Text>
                    </View>
                ) : (
                    reports.map((report) => (
                    <View
                        key={report.id}
                        style={[
                        styles.card,
                        { 
                            backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FFF",
                            borderColor: cardBorder,
                            borderLeftColor: report.status === "pending" ? reportsTheme.warning : (report.status === "accepted" ? reportsTheme.danger : reportsTheme.success) 
                        }
                        ]}
                    >
                        <View style={styles.cardHeader}>
                        <View style={styles.badgeContainer}>
                            {report.status === "pending" && (
                            <View style={[styles.statusBadge, { backgroundColor: "#FEF3C7" }]}>
                                <Text style={[styles.statusText, { color: "#D97706" }]}>À TRAITER</Text>
                            </View>
                            )}
                            {report.status === "accepted" && (
                            <View style={[styles.statusBadge, { backgroundColor: "#FEE2E2" }]}>
                                <Text style={[styles.statusText, { color: "#DC2626" }]}>SANCTIONNÉ</Text>
                            </View>
                            )}
                            {report.status === "rejected" && (
                            <View style={[styles.statusBadge, { backgroundColor: "#D1FAE5" }]}>
                                <Text style={[styles.statusText, { color: "#059669" }]}>REJETÉ</Text>
                            </View>
                            )}
                            <Text style={{ fontSize: 11, color: mutedColor, marginLeft: 8 }}>
                            {report.createdAt?.seconds ? new Date(report.createdAt.seconds * 1000).toLocaleDateString() : "Récemment"}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => handleDeleteReport(report.id)} style={{ padding: 4 }}>
                            <Ionicons name="close" size={18} color={mutedColor} />
                        </TouchableOpacity>
                        </View>

                        <Text style={[styles.challengeTitle, { color: titleColor }]}>{report.challengeTitle}</Text>
                        
                        <Text style={{fontSize: 12, color: mutedColor, marginBottom: 4, fontWeight: '600'}}>Motif :</Text>
                        <View style={[styles.reasonBox, { backgroundColor: isDark ? "rgba(239,68,68,0.15)" : "#FEF2F2" }]}>
                        <Text style={{ color: isDark ? "#FCA5A5" : "#B91C1C", fontWeight: "600", fontStyle: 'italic', fontSize: 13 }}>"{report.reason}"</Text>
                        </View>

                        <View style={styles.contentPreview}>
                        <Text style={{fontSize: 12, color: mutedColor, marginBottom: 8, fontWeight: '600'}}>Contenu signalé :</Text>
                        {report.proofType === 'image' && report.proofContent ? (
                            <Image source={{ uri: report.proofContent }} style={styles.proofImage} resizeMode="cover" />
                        ) : (
                            <View style={[styles.textBox, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F3F4F6", borderColor: cardBorder }]}>
                            <Text style={{ color: titleColor, fontStyle: 'italic' }}>"{report.proofContent || "Aucun texte"}"</Text>
                            </View>
                        )}
                        </View>

                        {report.status === "pending" ? (
                        <View style={styles.actionRow}>
                            <TouchableOpacity style={[styles.actionButton, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F3F4F6", flex: 1, marginRight: 8 }]} onPress={() => handleRestore(report)}>
                            <Ionicons name="refresh-outline" size={18} color={titleColor} />
                            <View>
                                <Text style={[styles.actionButtonText, { color: titleColor }]}>Ignorer</Text>
                                <Text style={{fontSize:9, color: mutedColor}}>Faux signalement</Text>
                            </View>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.actionButton, { backgroundColor: reportsTheme.danger, flex: 1, marginLeft: 8 }]} onPress={() => checkOffenderAndSanction(report)}>
                            <Ionicons name="warning-outline" size={18} color="white" />
                            <View>
                                <Text style={[styles.actionButtonText, { color: "white" }]}>Sanctionner</Text>
                                <Text style={{fontSize:9, color:"rgba(255,255,255,0.8)"}}>+ Avertissement</Text>
                            </View>
                            </TouchableOpacity>
                        </View>
                        ) : (
                        <View style={{ marginTop: 12, alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: cardBorder }}>
                            <Text style={{ fontSize: 12, color: mutedColor, fontStyle: 'italic' }}>Traité le {new Date().toLocaleDateString()}</Text>
                        </View>
                        )}
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
  // HEADER IDENTIQUE À "AVIS"
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 20,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    fontFamily: FontFamilies.heading,
    textAlign: 'center', // 🟢 Centrage parfait
  },
  actionBtn: {
    width: 44, height: 44,
    borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    elevation: 3,
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4
  },

  // CARDS
  emptyCard: {
    marginTop: 40,
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
    marginBottom: 20,
    borderWidth: 1,
    borderLeftWidth: 4, 
    shadowColor: "#000", 
    shadowOpacity: 0.03, 
    shadowRadius: 10, 
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
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
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    fontFamily: FontFamilies.heading
  },
  reasonBox: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  contentPreview: {
    marginBottom: 16,
  },
  proofImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)'
  },
  textBox: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
  }
});