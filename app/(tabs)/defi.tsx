// app/(tabs)/defi.tsx
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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChallengeCard } from "@/components/ui/defi/ChallengeCard";
import { ClubChallengeCard } from "@/components/ui/defi/ClubChallengeCard";
import { TabSwitcher } from "@/components/ui/defi/TabSwitcher";
import { ValidationCard } from "@/components/ui/defi/ValidationCard";
import { useChallenges } from "@/hooks/challenges-context";
import { useValidationQueue } from "@/hooks/useValidationQueue";
import { voteOnProof } from "@/services/proofs";

import { Challenge, TabKey } from "@/components/ui/defi/types";
import { db } from "@/firebaseConfig";
import { useUser } from "@/hooks/user-context";
import { subscribeToAdRequests } from "@/services/adBridge";
import { sendReport } from "@/services/reports";
import { ClassementList } from "@/src/classement/components/ClassementList";
import { RewardDistributionModal } from "@/src/classement/components/RewardDistributionModal";
import { useClassement } from "@/src/classement/hooks/useClassement";

import { ClubClassementList } from "@/src/clubClassement/components/ClubClassementList";
import { AVPlaybackStatus, ResizeMode, Video } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const [adScenario, setAdScenario] = useState<"start_challenge" | "claim_reward" | "claim_points" | null>(null);
  const [pendingChallengeId, setPendingChallengeId] = useState<number | null>(null); // Stocke l'ID du défi en attente de pub

  const [rewardModalVisible, setRewardModalVisible] = useState(false);

  const { user, isPremium } = useUser();

  // --- ÉTATS POUR LA PUB ---
  const insets = useSafeAreaInsets();
  const videoRef = useRef<Video>(null);
  const afterAdActionRef = useRef<null | (() => void)>(null);
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

  useEffect(() => {
    const unsub = subscribeToAdRequests((req) => {
      // If an ad is already showing, ignore new requests (safest)
      if (showAd) return;

      // store the callback to run after the ad closes
      afterAdActionRef.current = req.onDone ?? null;

      setAdScenario(req.scenario as any);
      setShowAd(true);
    });

    return unsub;
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
    currentClub,
    goToClassement,
    setGoToClassement,
    start,
    startClub,
    stop,
    stopClub,
    reviewCompleted,
    reviewRequiredCount,
    incrementReview,
    reviewCompletedClub,
    reviewRequiredCountClub,
    incrementReviewClub,
    validateWithPhotoClub,
    setFeedback,
    setPhotoComment,
    setPhotoCommentClub,
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

  const difficultyKeyClub = currentClub
    ? (
      currentClub.difficulty.toLowerCase() === "facile" ? "facile" :
        currentClub.difficulty.toLowerCase() === "moyen" ? "moyen" :
          "difficile"
    )
    : null;

  const { queue: validationQueueClub, removeFromQueue: removeFromQueueClub } = useValidationQueue(
    difficultyKeyClub as any,
    "club"
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
        category: "Club" as any,
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

  // Progress percentage for validation progress bar — guard against division by 0
  const validationProgressPct = reviewRequiredCount > 0 ? Math.round((reviewCompleted / reviewRequiredCount) * 100) : 0;

  const challengesToDisplay = useMemo(() => {
    if (current && !gatingActive) return [current];
    return rotatingChallenges;
  }, [current, rotatingChallenges, gatingActive]);

  // 🔴 LOGIQUE DÉMARRAGE (AVEC BYPASS PREMIUM)
  const toggleOngoing = (id: number) => {
    if (current && current.id === id) {
      stop();
      return;
    }

    let challenge =
      rotatingChallenges.find((c) => c.id === id) ||
      clubChallenges.find((c) => c.id === id);

    if (!challenge) return;

    const isClub = challenge.audience === "Club";

    if (isPremium) {
      if (isClub) {
        startClub(challenge);
      } else {
        start(challenge);
      }
    } else {
      setPendingChallengeId(id);
      setAdScenario("start_challenge");
      setShowAd(true);
    }
  };

  // 🔴 LOGIQUE RÉCOMPENSES (AVEC BYPASS PREMIUM)
  const handleOpenRewards = () => {
    setRewardModalVisible(true);
  };


  // 🔴 CALLBACK FIN DE PUB (À placer avant le return)
  const handleAdFinished = () => {
    setShowAd(false); // Ferme la pub

    if (adScenario === "start_challenge" && pendingChallengeId) {
       // On cherche le défi à démarrer (Perso ou Club)
       let challenge = rotatingChallenges.find((c) => c.id === pendingChallengeId);
       if (!challenge) challenge = clubChallenges.find((c) => c.id === pendingChallengeId);
       
       if (challenge) {
         // Start club challenges with the club starter, not the perso starter
         if (challenge.audience === "Club") {
           console.log("[AD] Starting club challenge after ad", { pendingChallengeId });
           startClub(challenge);
         } else {
           console.log("[AD] Starting personal challenge after ad", { pendingChallengeId });
           start(challenge);
         }
       }

       setPendingChallengeId(null);
    } else if (adScenario === "claim_reward") {
       setRewardModalVisible(true); // Ouvre les récompenses
    } else if (adScenario === "claim_points") {
      // Run whatever the popup wanted to do after the ad
      afterAdActionRef.current?.();
      afterAdActionRef.current = null;
    }

    setAdScenario(null);
  };


  // 📷 Camera
  const openCamera = (challengeId: number, kind: "perso" | "club" = "perso") => {
    router.push({ pathname: "/camera", params: { id: String(challengeId), kind } });
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
        contentContainerStyle={{ paddingBottom: 220 }}
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
                        style={{ width: `${validationProgressPct}%`, height: "100%" }}
                    />
                  </View>
                  <Text style={{ color: isLight ? "#008F6B" : colors.text, fontWeight: "800" }}>
                    {reviewCompleted}/{reviewRequiredCount}
                  </Text>
                </View>
              </LinearGradient>
            )}

            {gatingActive && (
              validationQueue.length === 0 ? (
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
                    onReport={() =>
                      handleOpenReport(
                        p.id,
                        "Preuve à vérifier",
                        p.defiId,
                        p.photoUrl,
                        p.commentaire
                      )
                    }
                  />
                ))
              )
            )}

            {!gatingActive && (
              <>
                {current ? (
                  // ---------- ACTIVE PERSO CHALLENGE ----------
                  <ChallengeCard
                    key={current.id}
                    challenge={current}
                    categorie="personnel"
                    isOngoing={true}
                    status={current.status}
                    onToggle={toggleOngoing}
                    onValidatePhoto={
                      current.status === "active"
                        ? () => openCamera(current.id as number)
                        : undefined
                    }
                  />
                ) : (
                  // ---------- LIST OF AVAILABLE PERSO CHALLENGES ----------
                  rotatingChallenges.map((challenge: any) => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      categorie="personnel"
                      isOngoing={false}
                      onToggle={toggleOngoing}
                      onReport={() =>
                        handleOpenReport(
                          challenge.firestoreId || String(challenge.id),
                          challenge.title,
                          challenge.firestoreId || String(challenge.id)
                        )
                      }
                    />
                  ))
                )}
              </>
            )}

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
                  <Text style={{ color: isLight ? "#0A3F33" : colors.text, fontSize: 20, fontWeight: "800" }}>Top 50 Perso</Text>
                  
                  <TouchableOpacity
                    onPress={handleOpenRewards}
                    style={{ backgroundColor: isLight ? "#E0F7EF" : "rgba(82, 209, 146, 0.14)", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: isLight ? "#A7F3D0" : "rgba(82, 209, 146, 0.22)" }}
                  >
                    <Text style={{ color: isLight ? "#008F6B" : colors.text, fontWeight: "800", fontSize: 13 }}>Récompenses</Text>
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
                  <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>Top 50 Clubs</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ backgroundColor: '#F6D36533', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 }}>
                      <Text style={{ color: '#F6D365', fontWeight: '700' }}>Clubs</Text>
                    </View>
                    <View style={{ backgroundColor: '#6BCB3D33', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 }}>
                      <Text style={{ color: colors.accent, fontWeight: '700' }}>Points</Text>
                    </View>
                  </View>
                </View>
                {activeTab === "club" && <ClubClassementList />}
              </LinearGradient>
            )}
          </>
        )}

        {(activeTab === "club" && viewMode === "defis") && (
          <View style={{ paddingTop: 20 }}>
            {currentClub ? (
              <>
                {/* CLUB VALIDATION GATING */}
                {currentClub && currentClub.status === "pendingValidation" && reviewRequiredCountClub > 0 && (
                  validationQueueClub.length === 0 ? (
                    <Text style={[styles.emptyText, { color: colors.mutedText }]}>Aucun défi à valider.</Text>
                  ) : (
                    validationQueueClub.map((p, index) => (
                      <ValidationCard
                        key={p.id}
                        item={{
                          id: index + 1,
                          title: "Preuve à valider",
                          description: "",
                          category: "Club",
                          difficulty: currentClub?.difficulty ?? "Facile",
                          points: typeof currentClub?.points === "number" ? currentClub.points : 10,
                          audience: "Club",
                          timeLeft: "",
                          userName: "Utilisateur",
                          photoUrl: p.photoUrl,
                          comment: p.commentaire,
                        }}
                        onValidate={async () => {
                          await voteOnProof(p.id, true);
                          removeFromQueueClub(p.id);
                          incrementReviewClub();
                        }}
                        onReject={async () => {
                          await voteOnProof(p.id, false);
                          removeFromQueueClub(p.id);
                          incrementReviewClub();
                        }}
                        onReport={() =>
                          handleOpenReport(
                            p.id,
                            "Preuve à vérifier",
                            p.defiId,
                            p.photoUrl,
                            p.commentaire
                          )
                        }
                      />
                    ))
                  )
                )}

                {/* ACTIVE CLUB CHALLENGE CARD */}
                <ClubChallengeCard
                  challenge={{
                    ...currentClub,
                    participants: 12,          // temporary static values
                    goalParticipants: 50,      // will soon be dynamic
                  }}
                  participating={true}
                  status={currentClub.status}
                  onValidatePhoto={() => openCamera(currentClub.id as number, "club")}
                  onParticipate={() => {}}
                  onCancel={() => stopClub()}
                />
              </>
            ) : (
              // LIST OF CLUB CHALLENGES WHEN NONE ACTIVE
              <>
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
                      isOngoing={false}
                      onToggle={toggleOngoing}
                    />
                  ))
                )}
              </>
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