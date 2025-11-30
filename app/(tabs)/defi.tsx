import { useThemeMode } from "@/hooks/theme-context";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import { ChallengeCard } from "@/components/ui/defi/ChallengeCard";
import { TabSwitcher } from "@/components/ui/defi/TabSwitcher";
import { ValidationCard } from "@/components/ui/defi/ValidationCard";
import { useChallenges } from "@/hooks/challenges-context";
import * as ImagePicker from "expo-image-picker";

import { Challenge, TabKey } from "@/components/ui/defi/types";
import { db } from "@/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

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

export default function DefiScreen() {
  const router = useRouter();
  const { colors } = useThemeMode();

  const [activeTab, setActiveTab] = useState<TabKey>("perso");

  const {
    current,
    start,
    stop,
    canceledIds,
    reviewCompleted,
    reviewRequiredCount,
    incrementReview,
    setFeedback,
  } = useChallenges();

  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [feedbackComment, setFeedbackComment] = useState<string>("");

  const [rotatingChallenges, setRotatingChallenges] = useState<Challenge[]>([]);
  const [validationQueue, setValidationQueue] = useState([
    {
      id: 101,
      title: "Recycler des bouteilles",
      description: "Preuve de recyclage",
      category: "Recyclage" as any,
      difficulty: "Facile" as const,
      points: 10,
      audience: "Membre" as const,
      timeLeft: "—",
      userName: "Alex",
      photoUrl:
        "https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 102,
      title: "Aller au marché local",
      description: "Panier local",
      category: "Local" as any,
      difficulty: "Moyen" as const,
      points: 20,
      audience: "Membre" as const,
      timeLeft: "—",
      userName: "Lina",
      photoUrl:
        "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 103,
      title: "Défi compost maison",
      description: "Compost",
      category: "Tri" as any,
      difficulty: "Difficile" as const,
      points: 30,
      audience: "Membre" as const,
      timeLeft: "—",
      userName: "Marie",
      photoUrl:
        "https://images.unsplash.com/photo-1615485737651-6f6c4110fc94?q=80&w=800&auto=format&fit=crop",
    },
  ]);

  // 🔥 Load 3 rotation challenges from Firestore (FIFO per difficulty)
  useEffect(() => {
    const loadRotatingDefis = async () => {
      const snap = await getDocs(collection(db, "defis"));
      const docs = snap.docs.map(
        (d) => ({ id: d.id, ...(d.data() as any) } as DefiDoc)
      );

      // Only personal + rotation
      const personals = docs.filter(
        (d) => d.categorie === "personnel" && d.statut === "rotation"
      );

      // Sort FIFO by createdAt
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

      // Facile → Moyen → Difficile
      const pick = (diffKey: keyof typeof byDiff, label: Challenge["difficulty"]) => {
        const d = byDiff[diffKey][0];
        if (!d) return;
        selected.push({
          id: idCounter++,
          title: d.titre,
          description: d.description,
          category: "Recyclage" as any, // not really used anymore
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
    };

    loadRotatingDefis();
  }, []);

  // If user already has an ongoing challenge, only show that one.
  const gatingActive =
    current?.status === "pendingValidation" &&
    reviewCompleted < reviewRequiredCount;

  const hideAfterFeedback =
    current?.status === "pendingValidation" &&
    reviewCompleted >= reviewRequiredCount &&
    current?.feedbackSubmitted;

  const challengesToDisplay = useMemo(() => {
    if (current && !gatingActive && !hideAfterFeedback) return [current];
    return rotatingChallenges;
  }, [current, rotatingChallenges, gatingActive, hideAfterFeedback]);

  // 🔁 Activate or cancel a challenge
  const toggleOngoing = (id: number) => {
    const challenge = rotatingChallenges.find((c) => c.id === id);
    if (!challenge) return;

    if (current && current.id === id) {
      stop(id);
      return;
    }

    start(challenge);
  };

  // 📷 Camera
  const openCamera = (challengeId: number) => {
    router.push({ pathname: "/camera", params: { id: String(challengeId) } });
  };

  // 🖼 Gallery picker (still here if we need later)
  const pickFromGallery = async (challengeId: number) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]?.uri) {
      router.push({
        pathname: "/camera",
        params: { id: String(challengeId), preset: res.assets[0].uri },
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <Text style={[styles.title, { color: colors.text }]}>Défis</Text>

      {/* TAB SWITCHER */}
      <TabSwitcher activeTab={activeTab} onChange={setActiveTab} />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {/* PERSO TAB */}
        {activeTab === "perso" && (
          <>
            {/* Gating message */}
            {gatingActive && (
              <View
                style={{
                  backgroundColor: colors.surface,
                  padding: 20,
                  borderRadius: 24,
                  marginBottom: 18,
                }}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 16,
                    fontWeight: "700",
                  }}
                >
                  Validation requise
                </Text>
                <Text style={{ color: colors.mutedText, marginTop: 8 }}>
                  Il vous faut maintenant valider 3 défis d&apos;autres membres avant que
                  votre propre défi soit examiné.
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 14,
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                      height: 10,
                      backgroundColor: colors.surfaceAlt,
                      borderRadius: 6,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        width: `${(reviewCompleted / reviewRequiredCount) * 100}%`,
                        backgroundColor: colors.accent,
                        height: "100%",
                      }}
                    />
                  </View>
                  <Text
                    style={{
                      color: colors.text,
                      fontWeight: "700",
                    }}
                  >
                    {reviewCompleted}/{reviewRequiredCount}
                  </Text>
                </View>
              </View>
            )}

            {/* Validation cards phase */}
            {gatingActive &&
              (validationQueue.length === 0 ? (
                <Text
                  style={[styles.emptyText, { color: colors.mutedText }]}
                >
                  Aucun défi à valider.
                </Text>
              ) : (
                validationQueue.map((item) => (
                  <ValidationCard
                    key={item.id}
                    item={item}
                    onValidate={() => {
                      setValidationQueue((q) =>
                        q.filter((x) => x.id !== item.id)
                      );
                      incrementReview();
                    }}
                    onReject={() => {
                      setValidationQueue((q) =>
                        q.filter((x) => x.id !== item.id)
                      );
                      incrementReview();
                    }}
                  />
                ))
              ))}

            {/* Normal challenge cards (3 rotation + maybe current) */}
            {!gatingActive &&
              challengesToDisplay.map((challenge: any) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  categorie="personnel"
                  isOngoing={current?.id === challenge.id}
                  status={
                    current?.id === challenge.id ? current?.status : undefined
                  }
                  onToggle={toggleOngoing}
                  onValidatePhoto={
                    current &&
                    current.id === challenge.id &&
                    current.status === "active"
                      ? () => openCamera(challenge.id)
                      : undefined
                  }
                />
              ))}

            {/* Feedback form when pending validation & reviews complete */}
            {current &&
              current.status === "pendingValidation" &&
              reviewCompleted >= reviewRequiredCount &&
              !current.feedbackSubmitted && (
                <View
                  style={{
                    backgroundColor: colors.surface,
                    padding: 20,
                    borderRadius: 24,
                    marginTop: 10,
                  }}
                >
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 16,
                      fontWeight: "700",
                    }}
                  >
                    Laisser un avis
                  </Text>
                  <Text
                    style={{ color: colors.mutedText, marginTop: 6 }}
                  >
                    Notez ce défi et laissez un commentaire pour aider la validation.
                  </Text>
                  <View style={{ flexDirection: "row", marginTop: 12 }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <TouchableOpacity
                        key={n}
                        onPress={() => setFeedbackRating(n)}
                        style={{ marginRight: 8 }}
                      >
                        <Text style={{ fontSize: 24 }}>
                          {feedbackRating >= n ? "⭐" : "☆"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    value={feedbackComment}
                    onChangeText={setFeedbackComment}
                    placeholder="Votre commentaire"
                    multiline
                    numberOfLines={4}
                    style={{
                      marginTop: 12,
                      borderWidth: 1,
                      borderColor: colors.border ?? "#2A3431",
                      backgroundColor: colors.surfaceAlt,
                      color: colors.text,
                      borderRadius: 12,
                      padding: 12,
                      textAlignVertical: "top",
                    }}
                  />
                  <TouchableOpacity
                    onPress={() =>
                      setFeedback(feedbackRating || 0, feedbackComment.trim())
                    }
                    disabled={feedbackRating === 0}
                    style={{
                      marginTop: 14,
                      borderRadius: 14,
                      paddingVertical: 12,
                      alignItems: "center",
                      backgroundColor:
                        feedbackRating === 0 ? "#2A3431" : colors.accent,
                    }}
                  >
                    <Text
                      style={{
                        color:
                          feedbackRating === 0 ? "#8AA39C" : "#0F3327",
                        fontWeight: "700",
                      }}
                    >
                      Envoyer l&apos;avis
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

            {/* Message après envoi de l'avis */}
            {hideAfterFeedback && (
              <View
                style={{
                  backgroundColor: colors.surface,
                  padding: 20,
                  borderRadius: 24,
                  marginTop: 10,
                }}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 16,
                    fontWeight: "700",
                  }}
                >
                  Défi en cours de validation
                </Text>
                <Text
                  style={{ color: colors.mutedText, marginTop: 6 }}
                >
                  Merci pour votre avis. Votre défi sera examiné prochainement par
                  l&apos;équipe.
                </Text>
              </View>
            )}
          </>
        )}

        {/* CLUB TAB – placeholder for now */}
        {activeTab === "club" && (
          <View style={{ paddingTop: 40 }}>
            <Text
              style={{ color: colors.mutedText, textAlign: "center" }}
            >
              Aucun défi de club pour le moment.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  title: { fontSize: 28, fontWeight: "700" },
  scroll: { marginTop: 12 },
  emptyText: { textAlign: "center", marginTop: 40, fontSize: 16 },
});
