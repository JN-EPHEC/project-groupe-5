import { ReportModal } from "@/components/ui/defi/ReportModal";
import { useClub } from "@/hooks/club-context";
import { useFriends } from "@/hooks/friends-context";
import { usePoints } from "@/hooks/points-context";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChallengeCard } from "@/components/ui/defi/ChallengeCard";
import { TabSwitcher } from "@/components/ui/defi/TabSwitcher";
import { ValidationCard } from "@/components/ui/defi/ValidationCard";
import { useChallenges } from "@/hooks/challenges-context";
import { useValidationQueue } from "@/hooks/useValidationQueue";
import { voteOnProof } from "@/services/proofs";

import { Challenge, TabKey } from "@/components/ui/defi/types";
import { db } from "@/firebaseConfig";
import { useUser } from "@/hooks/user-context";
import { sendReport } from "@/services/reports";
import { ClassementList } from "@/src/classement/components/ClassementList";
import { RewardDistributionModal } from "@/src/classement/components/RewardDistributionModal";
import { useClassement } from "@/src/classement/hooks/useClassement";


type DefiDoc = {
  id: string;
  titre: string;
  description: string;
  categorie: "personnel" | "club";
  duree: number;
  points: number;
  statut: "inactive" | "rotation";
  difficulte: "facile" | "moyen" | "difficile";
  preuve?: string;
  createdAt?: { seconds: number; nanoseconds: number } | any;
};

// Type pour le signalement
type TargetReport = {
  id: string;
  title: string;
  defiId: string;
  photoUrl?: string;
  commentaire?: string;
};

export default function DefiScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ view?: string; rankingTab?: string }>();
  const { colors, mode } = useThemeMode();
  const { friends } = useFriends();
  const { points } = usePoints();
  const { joinedClub, members } = useClub();
  const [rewardModalVisible, setRewardModalVisible] = useState(false);

  const { user } = useUser();
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [targetReportId, setTargetReportId] = useState<TargetReport | null>(null);

  // Ouvre la popup avec toutes les données requises
  const handleOpenReport = (
    id: string,
    title: string,
    defiId: string,
    photoUrl?: string,
    commentaire?: string
  ) => {
    setTargetReportId({ id, title, defiId, photoUrl, commentaire });
    setReportModalVisible(true);
  };

  // Envoie les données à Firebase
  const handleSubmitReport = async (reason: string) => {
    if (!targetReportId || !user) return;

    const hasImage = targetReportId.photoUrl && targetReportId.photoUrl !== "";
    const proofType = hasImage ? 'image' : 'text';

    const proofContent = hasImage
      ? (targetReportId.photoUrl || "")
      : (targetReportId.commentaire || "Pas de contenu");

    const success = await sendReport(
      targetReportId.defiId || "inconnu",
      targetReportId.title || "Défi signalé",
      targetReportId.id,
      proofContent,
      proofType,
      reason,
      user.uid
    );

    if (success) {
      Alert.alert("Merci", "Le signalement a été envoyé.");
      setReportModalVisible(false);
      setTargetReportId(null);
    } else {
      Alert.alert("Erreur", "Impossible d'envoyer le signalement. Vérifiez votre connexion.");
    }
  };

  const isLight = mode === "light";
  const darkBg = "#021114";

  const [activeTab, setActiveTab] = useState<TabKey>("perso");
  const [viewMode, setViewMode] = useState<"defis" | "classement">("defis");
  const {
    current,
    goToClassement,
    setGoToClassement,
    start,
    stop,
    reviewCompleted,
    reviewRequiredCount,
    incrementReview,
    setFeedback,
  } = useChallenges();

  // Classement data
  const { users: classementUsers, loading: classementLoading } = useClassement();

  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [feedbackComment, setFeedbackComment] = useState<string>("");

  // LISTES DES DÉFIS
  const [rotatingChallenges, setRotatingChallenges] = useState<Challenge[]>([]);
  const [clubChallenges, setClubChallenges] = useState<Challenge[]>([]); // <--- NOUVEAU STATE

  const difficultyKey = current
    ? (
      current.difficulty.toLowerCase() === "facile" ? "facile" :
        current.difficulty.toLowerCase() === "moyen" ? "moyen" :
          "difficile"
    )
    : null;
  const { queue: validationQueue, removeFromQueue } = useValidationQueue(
    difficultyKey as any
  );

  // 🔥 Load challenges from Firestore
  useEffect(() => {
    const loadRotatingDefis = async () => {
      const snap = await getDocs(collection(db, "defis"));
      const docs = snap.docs.map(
        (d) => ({ id: d.id, ...(d.data() as any) } as DefiDoc)
      );

      // 1. DÉFIS PERSO (inchangé)
      const personals = docs.filter(
        (d) => d.categorie === "personnel" && d.statut === "rotation"
      );

      personals.sort((a, b) => {
        const aSec = (a.createdAt?.seconds ?? 0) as number;
        const bSec = (b.createdAt?.seconds ?? 0) as number;
        return aSec - bSec;
      });

      const byDiff = {
        facile: personals.filter((d) => d.difficulte === "facile"),
        moyen: personals.filter((d) => d.difficulte === "moyen"),
        difficile: personals.filter((d) => d.difficulte === "difficile"),
      };

      const selected: Challenge[] = [];
      let idCounter = 1;

      const pick = (diffKey: keyof typeof byDiff, label: Challenge["difficulty"]) => {
        const d = byDiff[diffKey][0];
        if (!d) return;
        selected.push({
          id: idCounter++,
          firestoreId: d.id,
          title: d.titre,
          description: d.description,
          category: "Recyclage" as any,
          difficulty: label,
          points: d.points,
          audience: "Membre",
          timeLeft: "Aujourd'hui",
        });
      };

      pick("facile", "Facile");
      pick("moyen", "Moyen");
      pick("difficile", "Difficile");
      setRotatingChallenges(selected);

      // 2. DÉFIS CLUB (NOUVEAU)
      // On récupère tout ce qui est categorie="club" et statut="rotation"
      const clubs = docs.filter(
        (d) => d.categorie === "club" && d.statut === "rotation"
      );

      // On map vers le format Challenge de l'UI
      const formattedClubs: Challenge[] = clubs.map((d, index) => ({
        id: 1000 + index, // ID numérique fictif pour l'UI (évite conflit avec perso)
        firestoreId: d.id,
        title: d.titre,
        description: d.description,
        category: "Local" as any, // Ou "Club"
        difficulty: d.difficulte === "facile" ? "Facile" : d.difficulte === "moyen" ? "Moyen" : "Difficile",
        points: d.points,
        audience: "Club",
        timeLeft: "Cette semaine", // Les défis clubs durent souvent plus longtemps
      }));

      setClubChallenges(formattedClubs);
    };

    loadRotatingDefis();
  }, []);

  // NEW: react to /defi?view=classement&rankingTab=perso|club
  useEffect(() => {
    const viewParam = Array.isArray(params.view) ? params.view[0] : params.view;
    const tabParam = Array.isArray(params.rankingTab) ? params.rankingTab[0] : params.rankingTab;

    if (viewParam === "classement") {
      setViewMode("classement");
    } else if (viewParam === "defis") {
      setViewMode("defis");
    }

    if (tabParam === 'perso' || tabParam === 'club') {
      setActiveTab(tabParam);
    }
  }, [params.view, params.rankingTab]);

  useEffect(() => {
    if (goToClassement) {
      setViewMode("classement");
      setGoToClassement(false);
    }
  }, [goToClassement]);


  const gatingActive =
    current?.status === "pendingValidation" &&
    reviewCompleted < reviewRequiredCount;

  const hideAfterFeedback =
    current?.status === "pendingValidation" &&
    reviewCompleted >= reviewRequiredCount &&
    current?.feedbackSubmitted;

  const challengesToDisplay = useMemo(() => {
    if (current && !gatingActive) return [current];
    return rotatingChallenges;
  }, [current, rotatingChallenges, gatingActive]);

  // 🔁 Activate or cancel a challenge
  const toggleOngoing = (id: number) => {
    if (current && current.id === id) {
      stop();
      return;
    }

    // Recherche d'abord dans les défis Perso
    let challenge = rotatingChallenges.find((c) => c.id === id);
    
    // Si pas trouvé, recherche dans les défis Club
    if (!challenge) {
        challenge = clubChallenges.find((c) => c.id === id);
    }

    if (!challenge) {
      return;
    }
    start(challenge);
  };


  // 📷 Camera
  const openCamera = (challengeId: number) => {
    router.push({ pathname: "/camera", params: { id: String(challengeId) } });
  };

  const handleSendFeedbackToAdmin = async () => {
    if (feedbackRating === 0) return;
    try {
      const safeUserName = (user as any)?.name || (user as any)?.displayName || "Membre";
      const feedbackData = {
        challengeTitle: current?.title || "Défi sans titre",
        rating: feedbackRating,
        comment: feedbackComment.trim(),
        userName: safeUserName,
        userId: user?.uid,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, "feedbacks"), feedbackData);
      console.log("Avis envoyé à l'admin avec succès !");
    } catch (error) {
      console.error("Erreur envoi avis admin:", error);
    } finally {
      setFeedback(feedbackRating, feedbackComment.trim());
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isLight ? colors.background : darkBg }]}>
      {/* HEADER with toggle icon */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[styles.title, { color: colors.text }]}>{viewMode === 'defis' ? 'Défis' : 'Classement'}</Text>
        <TouchableOpacity
          onPress={() => setViewMode(viewMode === 'defis' ? 'classement' : 'defis')}
          style={{ padding: 8, borderRadius: 12, backgroundColor: isLight ? colors.surface : "rgba(0, 151, 178, 0.1)" }}
        >
          <Ionicons name={viewMode === 'defis' ? 'trophy-outline' : 'flag-outline'} size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <TabSwitcher activeTab={activeTab} onChange={setActiveTab} />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {/* =======================================================
            ONGLET PERSO - VUE DÉFIS
           ======================================================= */}
        {(activeTab === "perso" && viewMode === 'defis') && (
          <>
            {/* Gating message */}
            {gatingActive && (
              <View style={{ backgroundColor: colors.card, padding: 20, borderRadius: 24, marginBottom: 18 }}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>
                  Validation requise
                </Text>
                <Text style={{ color: colors.mutedText, marginTop: 8 }}>
                  Il vous faut maintenant valider 3 défis d&apos;autres membres avant que
                  votre propre défi soit examiné.
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 14, gap: 12 }}>
                  <View style={{ flex: 1, height: 10, backgroundColor: colors.surfaceAlt, borderRadius: 6, overflow: "hidden" }}>
                    <View style={{ width: `${(reviewCompleted / reviewRequiredCount) * 100}%`, backgroundColor: colors.accent, height: "100%" }} />
                  </View>
                  <Text style={{ color: colors.text, fontWeight: "700" }}>
                    {reviewCompleted}/{reviewRequiredCount}
                  </Text>
                </View>
              </View>
            )}

            {/* Validation cards phase */}
            {gatingActive &&
              (validationQueue.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.mutedText }]}>
                  Aucun défi à valider.
                </Text>
              ) : (
                validationQueue.map((p, index) => (
                  <ValidationCard
                    key={p.id}
                    item={{
                      id: index + 1,
                      title: "Preuve à valider",
                      description: "",
                      category: "Recyclage",
                      difficulty: current?.difficulty ?? "Facile",
                      points: typeof current?.points === "number" ? current.points : 10,
                      audience: "Membre",
                      timeLeft: "",
                      userName: "Utilisateur",
                      photoUrl: p.photoUrl,
                      comment: p.commentaire,
                    }}
                    onValidate={async () => {
                      await voteOnProof(p.id, true);
                      removeFromQueue(p.id);
                      incrementReview();
                    }}
                    onReject={async () => {
                      await voteOnProof(p.id, false);
                      removeFromQueue(p.id);
                      incrementReview();
                    }}
                    onReport={() => handleOpenReport(
                      p.id,
                      "Preuve à vérifier",
                      p.defiId,
                      p.photoUrl,
                      p.commentaire
                    )}
                  />
                ))
              ))}

            {/* Normal challenge cards (3 rotation + maybe current) */}
            {!gatingActive &&
              challengesToDisplay.map((challenge: any) => {
                return (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    categorie="personnel"
                    isOngoing={current?.id === challenge.id}
                    status={current?.id === challenge.id ? current?.status : undefined}
                    onToggle={toggleOngoing}
                    onReport={() => handleOpenReport(
                      challenge.firestoreId || String(challenge.id),
                      challenge.title,
                      challenge.firestoreId || String(challenge.id)
                    )}
                    onValidatePhoto={
                      current &&
                        current.id === challenge.id &&
                        current.status === "active"
                        ? () => openCamera(challenge.id)
                        : undefined
                    }
                  />
                );
              })}

            {/* Feedback form */}
            {current &&
              current.status === "pendingValidation" &&
              reviewCompleted >= reviewRequiredCount &&
              !current.feedbackSubmitted && (
                <View style={{ backgroundColor: colors.card, padding: 20, borderRadius: 24, marginTop: 10 }}>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>Laisser un avis</Text>
                  <Text style={{ color: colors.mutedText, marginTop: 6 }}>
                    Notez ce défi et laissez un commentaire pour aider la validation.
                  </Text>
                  <View style={{ flexDirection: "row", marginTop: 12 }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <TouchableOpacity key={n} onPress={() => setFeedbackRating(n)} style={{ marginRight: 8 }}>
                        <Text style={{ fontSize: 24 }}>{feedbackRating >= n ? "⭐" : "☆"}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    value={feedbackComment}
                    onChangeText={setFeedbackComment}
                    placeholder="Votre commentaire"
                    multiline
                    numberOfLines={4}
                    style={{ marginTop: 12, borderWidth: 1, borderColor: "#2A3431", backgroundColor: colors.surfaceAlt, color: colors.text, borderRadius: 12, padding: 12, textAlignVertical: "top" }}
                  />
                  <TouchableOpacity
                    onPress={handleSendFeedbackToAdmin}
                    disabled={feedbackRating === 0}
                    style={{ marginTop: 14, borderRadius: 14, paddingVertical: 12, alignItems: "center", backgroundColor: feedbackRating === 0 ? "#2A3431" : colors.accent }}
                  >
                    <Text style={{ color: feedbackRating === 0 ? "#8AA39C" : "#0F3327", fontWeight: "700" }}>Envoyer l&apos;avis</Text>
                  </TouchableOpacity>
                </View>
              )}

            {/* Message après envoi de l'avis */}
            {hideAfterFeedback && (
              <View style={{ backgroundColor: colors.card, padding: 20, borderRadius: 24, marginTop: 10 }}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>Défi en cours de validation</Text>
                <Text style={{ color: colors.mutedText, marginTop: 6 }}>Merci pour votre avis. Votre défi sera examiné prochainement par l&apos;équipe.</Text>
              </View>
            )}
          </>
        )}


        {/* =======================================================
            ONGLET CLASSEMENT (VUE CLASSEMENT)
           ======================================================= */}
        {viewMode === 'classement' && (
          <>
            {activeTab === 'perso' && (
              <View style={{ backgroundColor: colors.surface, padding: 20, borderRadius: 24, marginBottom: 18 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>Top 50 — Perso</Text>
                  <TouchableOpacity
                    onPress={() => setRewardModalVisible(true)}
                    style={{ backgroundColor: "rgba(82, 209, 146, 0.14)", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "rgba(82, 209, 146, 0.22)" }}
                  >
                    <Text style={{ color: colors.text, fontWeight: "800" }}>Récompenses</Text>
                  </TouchableOpacity>
                </View>
                {classementLoading ? (
                  <Text style={{ color: colors.mutedText, marginTop: 12 }}>Chargement du classement...</Text>
                ) : (
                  <View style={{ marginTop: 12 }}>
                    {classementUsers.length === 0 && (
                      <Text style={{ color: colors.mutedText }}>Aucun participant pour l&apos;instant.</Text>
                    )}
                    <ClassementList users={classementUsers} totalSlots={50} />
                  </View>
                )}
              </View>
            )}

            {activeTab === 'club' && (
              <View style={{ backgroundColor: colors.surface, padding: 20, borderRadius: 24, marginBottom: 18 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>Top 50 — Clubs</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ backgroundColor: '#F6D36533', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 }}>
                      <Text style={{ color: '#F6D365', fontWeight: '700' }}>Clubs</Text>
                    </View>
                    <View style={{ backgroundColor: '#6BCB3D33', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 }}>
                      <Text style={{ color: colors.accent, fontWeight: '700' }}>Points</Text>
                    </View>
                  </View>
                </View>
                {(() => {
                  const clubs: Array<{ name: string; pts: number; isMine?: boolean; avatar: string }> = [];
                  if (joinedClub) {
                    const totalClubPts = members.reduce((sum, m: any) => sum + (m.points || 0), 0);
                    clubs.push({ name: joinedClub.name ?? 'Mon club', pts: totalClubPts, isMine: true, avatar: joinedClub.logo || 'https://api.dicebear.com/8.x/shapes/svg?seed=myclub' });
                  }
                  const mockClubNames = ['Les Écogardiens', 'Verte Équipe', 'Planète Propre', 'Zéro Déchet Squad', 'Les Tri-Héros', 'Green Sparks', 'Eco Runner', 'TerraFriends', 'BlueLeaf', 'GreenMinds'];
                  while (clubs.length < 50) {
                    const name = mockClubNames[(clubs.length) % mockClubNames.length] + ' ' + (Math.floor(Math.random() * 90) + 10);
                    const pts = Math.floor(Math.random() * 5000) + 200;
                    const avatar = `https://api.dicebear.com/8.x/shapes/svg?seed=${encodeURIComponent(name)}`;
                    clubs.push({ name, pts, avatar });
                  }
                  const sorted = clubs.sort((a, b) => b.pts - a.pts).slice(0, 50);
                  const myIndex = sorted.findIndex(c => c.isMine);
                  return (
                    <View style={{ marginTop: 12 }}>
                      {sorted.map((c, idx) => {
                        const isMine = c.isMine;
                        const rankColor = idx === 0 ? '#52D192' : idx === 1 ? '#F6D365' : idx === 2 ? '#F45B69' : colors.surfaceAlt;
                        return (
                          <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, marginBottom: 8, backgroundColor: isMine ? '#1A2F28' : colors.surfaceAlt }}>
                            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: rankColor, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                              <Text style={{ color: '#0F3327', fontWeight: '800' }}>{idx + 1}</Text>
                            </View>
                            <Image source={{ uri: c.avatar }} style={{ width: 28, height: 28, borderRadius: 14, marginRight: 10 }} />
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: colors.text, fontWeight: isMine ? '800' : '600' }}>{c.name}</Text>
                              {isMine && <Text style={{ color: colors.mutedText, fontSize: 12 }}>Ton club</Text>}
                            </View>
                            <View style={{ backgroundColor: '#D4F7E7', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 }}>
                              <Text style={{ color: '#0F3327', fontWeight: '800' }}>{c.pts} pts</Text>
                            </View>
                          </View>
                        );
                      })}
                      <View style={{ marginTop: 8, borderTopWidth: 1, borderColor: colors.surfaceAlt, paddingTop: 8 }}>
                        <Text style={{ color: colors.text, fontWeight: '700' }}>Position club: {myIndex >= 0 ? myIndex + 1 : '—'}</Text>
                      </View>
                    </View>
                  );
                })()}
              </View>
            )}
          </>
        )}

        {/* =======================================================
            ONGLET CLUB - VUE DÉFIS (C'est ici qu'on affiche enfin les défis club !)
           ======================================================= */}
        {(activeTab === "club" && viewMode === 'defis') && (
          <View style={{ paddingTop: 20 }}>
            {clubChallenges.length === 0 ? (
              <Text style={{ color: colors.mutedText, textAlign: "center", marginTop: 20 }}>
                Aucun défi de club actif pour le moment.
              </Text>
            ) : (
              clubChallenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  categorie="club" // Style visuel différent si ton composant le gère
                  isOngoing={current?.id === challenge.id}
                  status={current?.id === challenge.id ? current?.status : undefined}
                  onToggle={toggleOngoing}
                  onReport={() => handleOpenReport(
                    challenge.firestoreId || String(challenge.id),
                    challenge.title,
                    challenge.firestoreId || String(challenge.id)
                  )}
                  onValidatePhoto={
                    current &&
                      current.id === challenge.id &&
                      current.status === "active"
                      ? () => openCamera(challenge.id)
                      : undefined
                  }
                />
              ))
            )}
          </View>
        )}

      </ScrollView>

      <ReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        onSubmit={handleSubmitReport}
      />
      <RewardDistributionModal
        visible={rewardModalVisible}
        onClose={() => setRewardModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: "700" },
  scroll: { marginTop: 12 },
  emptyText: { textAlign: "center", marginTop: 40, fontSize: 16 },
});