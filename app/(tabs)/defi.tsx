import { ReportModal } from "@/components/ui/defi/ReportModal";
import { useClub } from "@/hooks/club-context";
import { useFriends } from "@/hooks/friends-context";
import { usePoints } from "@/hooks/points-context";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";
import { useEffect, useMemo, useRef, useState } from "react";
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


import { AVPlaybackStatus, ResizeMode, Video } from "expo-av";
import { Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

// 🎨 THEME DEFI SCREEN
const THEME = {
    bgGradient: ["#DDF7E8", "#F4FDF9"] as const,
    glassCardBg: ["rgba(240, 253, 244, 0.95)", "rgba(255, 255, 255, 0.85)"] as const,
    glassBorder: "rgba(255, 255, 255, 0.6)",
    textMain: "#0A3F33", 
    textMuted: "#4A665F",
    accent: "#008F6B", // Vert Marque
};

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

type TargetReport = {
  id: string;
  title: string;
  defiId: string;
  photoUrl?: string;
  commentaire?: string;
};

export default function DefiScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ view?: string; rankingTab?: string; t?: string }>();
  const { colors, mode } = useThemeMode();
  const { friends } = useFriends();
  const { points } = usePoints();
  const { joinedClub, members } = useClub();
  
  // --- GESTION DES PUBS ---
  const [showAd, setShowAd] = useState(false);
  const [adScenario, setAdScenario] = useState<"start_challenge" | "claim_reward" | null>(null);
  const [pendingChallengeId, setPendingChallengeId] = useState<number | null>(null); // Stocke l'ID du défi en attente de pub

  const [rewardModalVisible, setRewardModalVisible] = useState(false);

  const { user, isPremium } = useUser();

  // --- ÉTATS POUR LA PUB ---
  const insets = useSafeAreaInsets();
  const videoRef = useRef<Video>(null);
  const [adFinished, setAdFinished] = useState(false);

  // Recharge la vidéo quand la pub s'ouvre
  useEffect(() => {
    if (showAd) {
      setAdFinished(false);
      videoRef.current?.replayAsync();
    } else {
      videoRef.current?.pauseAsync();
    }
  }, [showAd]);

  // Callback de fin de vidéo
  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    if (status.didJustFinish && !adFinished) {
      setAdFinished(true);
    }
  };

  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [targetReportId, setTargetReportId] = useState<TargetReport | null>(null);

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

  const { users: classementUsers, loading: classementLoading } = useClassement();

  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [feedbackComment, setFeedbackComment] = useState<string>("");

  const [rotatingChallenges, setRotatingChallenges] = useState<Challenge[]>([]);
  const [clubChallenges, setClubChallenges] = useState<Challenge[]>([]);

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

  useEffect(() => {
    const loadRotatingDefis = async () => {
      const snap = await getDocs(collection(db, "defis"));
      const docs = snap.docs.map(
        (d) => ({ id: d.id, ...(d.data() as any) } as DefiDoc)
      );

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

      const clubs = docs.filter(
        (d) => d.categorie === "club" && d.statut === "rotation"
      );

      const formattedClubs: Challenge[] = clubs.map((d, index) => ({
        id: 1000 + index,
        firestoreId: d.id,
        title: d.titre,
        description: d.description,
        category: "Local" as any,
        difficulty: d.difficulte === "facile" ? "Facile" : d.difficulte === "moyen" ? "Moyen" : "Difficile",
        points: d.points,
        audience: "Club",
        timeLeft: "Cette semaine",
      }));

      setClubChallenges(formattedClubs);
    };

    loadRotatingDefis();
  }, []);

  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const viewParam = Array.isArray(params.view) ? params.view[0] : params.view;
    const tabParam = Array.isArray(params.rankingTab) ? params.rankingTab[0] : params.rankingTab;
    const tParam = params.t ? Number(params.t) : 0;

    if (tParam > lastTimeRef.current) {
        lastTimeRef.current = tParam;

        if (viewParam === "classement") {
            setViewMode("classement");
        } else if (viewParam === "defis") {
            setViewMode("defis");
        }

        if (tabParam === 'perso') {
            setActiveTab('perso');
        } else if (tabParam === 'club') {
            setActiveTab('club');
        }
    }
  }, [params]);

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

  // 🔴 LOGIQUE DÉMARRAGE (AVEC BYPASS PREMIUM)
  const toggleOngoing = (id: number) => {
    // 1. Si c'est pour arrêter le défi en cours
    if (current && current.id === id) {
      stop();
      return;
    }

    // 2. VÉRIFICATION PREMIUM
    if (isPremium) {
      // 🚀 PREMIUM : Démarrage direct (On cherche le défi et on le lance)
      let challenge = rotatingChallenges.find((c) => c.id === id);
      if (!challenge) challenge = clubChallenges.find((c) => c.id === id);
      if (challenge) start(challenge);
    } else {
      // 🎬 NON-PREMIUM : On lance la pub
      setPendingChallengeId(id);
      setAdScenario("start_challenge");
      setShowAd(true);
    }
  };

  // 🔴 LOGIQUE RÉCOMPENSES (AVEC BYPASS PREMIUM)
  const handleOpenRewards = () => {
    if (isPremium) {
      // 🚀 PREMIUM : Ouverture directe
      setRewardModalVisible(true);
    } else {
      // 🎬 NON-PREMIUM : On lance la pub d'abord
      setAdScenario("claim_reward");
      setShowAd(true);
    }
  };

  // 🔴 CALLBACK FIN DE PUB (À placer avant le return)
  const handleAdFinished = () => {
    setShowAd(false); // Ferme la pub

    if (adScenario === "start_challenge" && pendingChallengeId) {
       // On cherche le défi à démarrer (Perso ou Club)
       let challenge = rotatingChallenges.find((c) => c.id === pendingChallengeId);
       if (!challenge) challenge = clubChallenges.find((c) => c.id === pendingChallengeId);
       
       if (challenge) start(challenge); // Démarrage effectif
       setPendingChallengeId(null);
    } else if (adScenario === "claim_reward") {
       setRewardModalVisible(true); // Ouvre les récompenses
    }
    setAdScenario(null);
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

  const BackgroundComponent = isLight ? LinearGradient : View;
  const bgProps = isLight 
    ? { colors: THEME.bgGradient, style: StyleSheet.absoluteFill } 
    : { style: [StyleSheet.absoluteFill, { backgroundColor: "#021114" }] };

  return (
    <View style={{ flex: 1 }}>
      <BackgroundComponent {...(bgProps as any)} />
      
      <SafeAreaView style={styles.container}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 }}>
        <Text style={[styles.title, { color: isLight ? THEME.textMain : colors.text, fontFamily: "StylizedTitle" }]}>
            {viewMode === 'defis' ? 'Défis' : 'Classement'}
        </Text>
        
        <TouchableOpacity onPress={() => setViewMode(viewMode === 'defis' ? 'classement' : 'defis')}>
            <LinearGradient
                colors={isLight ? ["#E0F7EF", "#D1FAE5"] : ["rgba(0, 151, 178, 0.2)", "rgba(0, 151, 178, 0.1)"]}
                style={{ padding: 10, borderRadius: 14, borderWidth: 1, borderColor: isLight ? "#A7F3D0" : "transparent" }}
            >
                <Ionicons name={viewMode === 'defis' ? 'trophy-outline' : 'flag-outline'} size={24} color={isLight ? "#008F6B" : colors.text} />
            </LinearGradient>
        </TouchableOpacity>
      </View>

      <TabSwitcher activeTab={activeTab} onChange={setActiveTab} />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {(activeTab === "perso" && viewMode === 'defis') && (
          <>
            {gatingActive && (
              <LinearGradient
                colors={isLight ? ["rgba(255,255,255,0.9)", "rgba(255,255,255,0.6)"] : ["rgba(0, 151, 178, 0.15)", "rgba(0, 151, 178, 0.05)"]}
                style={{ padding: 20, borderRadius: 24, marginBottom: 18, borderWidth: 1, borderColor: isLight ? "rgba(255,255,255,0.6)" : "transparent" }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                    <Ionicons name="shield-checkmark-outline" size={24} color={isLight ? "#008F6B" : colors.text} />
                    <Text style={{ color: isLight ? "#0A3F33" : colors.text, fontSize: 18, fontWeight: "700" }}>Validation requise</Text>
                </View>
                <Text style={{ color: isLight ? "#4A665F" : colors.mutedText, lineHeight: 22 }}>
                  Validez 3 défis de la communauté pour débloquer la validation du vôtre.
                </Text>
                
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 16, gap: 12 }}>
                  <View style={{ flex: 1, height: 8, backgroundColor: isLight ? "#E2E8F0" : colors.surfaceAlt, borderRadius: 4, overflow: "hidden" }}>
                    <LinearGradient
                        colors={["#008F6B", "#10B981"]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={{ width: `${(reviewCompleted / reviewRequiredCount) * 100}%`, height: "100%" }} 
                    />
                  </View>
                  <Text style={{ color: isLight ? "#008F6B" : colors.text, fontWeight: "800" }}>
                    {reviewCompleted}/{reviewRequiredCount}
                  </Text>
                </View>
              </LinearGradient>
            )}

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

            {!gatingActive &&
              challengesToDisplay.map((challenge: any) => {
                return (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    categorie="personnel"
                    isOngoing={current?.id === challenge.id}
                    status={current?.id === challenge.id ? current?.status : undefined}
                    // 👇 Utilisation de la nouvelle fonction qui lance la pub
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

            {current &&
              current.status === "pendingValidation" &&
              reviewCompleted >= reviewRequiredCount &&
              !current.feedbackSubmitted && (
                <LinearGradient
                  colors={isLight ? THEME.glassCardBg : ["rgba(0, 151, 178, 0.15)", "rgba(0, 151, 178, 0.05)"]}
                  style={{ padding: 20, borderRadius: 24, marginTop: 10, borderWidth: 1, borderColor: isLight ? THEME.glassBorder : "transparent" }}
                >
                  <Text style={{ color: isLight ? "#0A3F33" : colors.text, fontSize: 18, fontWeight: "700", marginBottom: 4 }}>Laisser un avis</Text>
                  <Text style={{ color: isLight ? "#4A665F" : colors.mutedText, marginBottom: 12, lineHeight: 20 }}>
                    Notez ce défi et laissez un commentaire pour aider la validation.
                  </Text>
                  
                  {/* Etoiles */}
                  <View style={{ flexDirection: "row", marginBottom: 16, justifyContent: 'center', backgroundColor: isLight ? "rgba(255,255,255,0.5)" : "transparent", padding: 8, borderRadius: 16 }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <TouchableOpacity key={n} onPress={() => setFeedbackRating(n)} style={{ marginHorizontal: 6 }}>
                        <Ionicons 
                            name={feedbackRating >= n ? "star" : "star-outline"} 
                            size={32} 
                            color={feedbackRating >= n ? "#F6D365" : (isLight ? "#A0AEC0" : colors.mutedText)} 
                        />
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Input Stylisé */}
                  <TextInput
                    value={feedbackComment}
                    onChangeText={setFeedbackComment}
                    placeholder="Votre commentaire..."
                    placeholderTextColor={isLight ? "#8AA39C" : colors.mutedText}
                    multiline
                    numberOfLines={3}
                    style={{ 
                        borderWidth: 1, 
                        borderColor: isLight ? "rgba(0,143,107,0.2)" : "#2A3431", 
                        backgroundColor: isLight ? "rgba(255,255,255,0.8)" : colors.surfaceAlt, 
                        color: isLight ? "#0A3F33" : colors.text, 
                        borderRadius: 16, 
                        padding: 14, 
                        textAlignVertical: "top",
                        fontSize: 15
                    }}
                  />

                  <TouchableOpacity
                    onPress={handleSendFeedbackToAdmin}
                    disabled={feedbackRating === 0}
                    style={{ 
                        marginTop: 16, 
                        borderRadius: 16, 
                        paddingVertical: 14, 
                        alignItems: "center", 
                        backgroundColor: feedbackRating === 0 ? (isLight ? "#E2E8F0" : "#2A3431") : (isLight ? "#008F6B" : colors.accent),
                        shadowColor: feedbackRating !== 0 ? "#008F6B" : "transparent",
                        shadowOpacity: 0.3,
                        shadowOffset: {width: 0, height: 4},
                        elevation: feedbackRating !== 0 ? 4 : 0
                    }}
                  >
                    <Text style={{ color: feedbackRating === 0 ? (isLight ? "#A0AEC0" : "#8AA39C") : "#FFFFFF", fontWeight: "700", fontSize: 16 }}>
                        Envoyer l'avis
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              )}

            {hideAfterFeedback && (
              <View style={{ backgroundColor: colors.card, padding: 20, borderRadius: 24, marginTop: 10 }}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>Défi en cours de validation</Text>
                <Text style={{ color: colors.mutedText, marginTop: 6 }}>Merci pour votre avis. Votre défi sera examiné prochainement par l&apos;équipe.</Text>
              </View>
            )}
          </>
        )}


        {viewMode === 'classement' && (
          <>
            {activeTab === 'perso' && (
              <LinearGradient
                colors={isLight ? THEME.glassCardBg : ["rgba(0, 151, 178, 0.15)", "rgba(0, 151, 178, 0.05)"]}
                style={{ padding: 20, borderRadius: 24, marginBottom: 18, borderWidth: 1, borderColor: isLight ? THEME.glassBorder : "transparent" }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <Text style={{ color: isLight ? "#0A3F33" : colors.text, fontSize: 20, fontWeight: "800" }}>Top 50 — Perso</Text>
                  
                  <TouchableOpacity
                    onPress={handleOpenRewards}
                    style={{ backgroundColor: isLight ? "#E0F7EF" : "rgba(82, 209, 146, 0.14)", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: isLight ? "#A7F3D0" : "rgba(82, 209, 146, 0.22)" }}
                  >
                    <Text style={{ color: isLight ? "#008F6B" : colors.text, fontWeight: "800", fontSize: 13 }}>🎁 Récompenses</Text>
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
              </LinearGradient>
            )}

            {activeTab === 'club' && (
              <LinearGradient
                colors={isLight ? THEME.glassCardBg : ["rgba(0, 151, 178, 0.15)", "rgba(0, 151, 178, 0.05)"]}
                style={{ padding: 20, borderRadius: 24, marginBottom: 18, borderWidth: 1, borderColor: isLight ? THEME.glassBorder : "transparent" }}
              >
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
              </LinearGradient>
            )}
          </>
        )}

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
                  categorie="club"
                  isOngoing={current?.id === challenge.id}
                  status={current?.id === challenge.id ? current?.status : undefined}
                  // 👇 Pub pour défi club aussi
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

      {/* MODAL SIGNALEMENT */}
      <ReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        onSubmit={handleSubmitReport}
      />
      {/* MODAL RÉCOMPENSES */}
      <RewardDistributionModal
        visible={rewardModalVisible}
        onClose={() => setRewardModalVisible(false)}
      />
      
      {/* MODAL PUBLICITÉ */}
      <Modal 
        animationType="fade" 
        visible={showAd} 
        transparent={false} 
        onRequestClose={() => { if(adFinished) setShowAd(false); }}
      >
        <View style={styles.adContainer}>
          <Video
            ref={videoRef}
            style={styles.adVideo}
            // 👇 C'est ici qu'on charge le fichier renommé "pub_greenup.mp4"
            source={require("../../assets/videos/pub_greenup.mp4")}
            resizeMode={ResizeMode.COVER}
            shouldPlay={showAd}
            isLooping={false}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          />
          
          <View style={[styles.adOverlay, { top: insets.top + 10 }]}>
            <Text style={styles.adTag}>Publicité</Text>
            {/* La croix apparaît à la fin */}
            {adFinished && (
              <TouchableOpacity onPress={handleAdFinished} style={styles.adCloseBtn}>
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: "800" }, // Plus gras pour le titre principal
  scroll: { marginTop: 12 },
  emptyText: { textAlign: "center", marginTop: 40, fontSize: 16 },
  // ... styles de pub inchangés
  adContainer: { flex: 1, backgroundColor: "black", justifyContent: "center", alignItems: "center" },
  adVideo: { width: "100%", height: "100%" },
  adOverlay: { position: "absolute", right: 20, alignItems: "flex-end", gap: 10 },
  adTag: { color: "white", backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontSize: 12, fontWeight: "bold", overflow: "hidden" },
  adCloseBtn: { backgroundColor: "white", width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
});