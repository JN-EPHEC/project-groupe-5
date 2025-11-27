import { useThemeMode } from "@/hooks/theme-context";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { CategorySelector } from "@/components/ui/defi/CategorySelector";
import { ChallengeCard } from "@/components/ui/defi/ChallengeCard";
import { ClubChallengeCard } from "@/components/ui/defi/ClubChallengeCard";
import { CHALLENGES } from "@/components/ui/defi/constants";
import { TabSwitcher } from "@/components/ui/defi/TabSwitcher";
import { CategoryKey, ClubChallenge, TabKey } from "@/components/ui/defi/types";
import { ValidationCard } from "@/components/ui/defi/ValidationCard";
import { useChallenges } from "@/hooks/challenges-context";
import * as ImagePicker from 'expo-image-picker';

export default function DefiScreen() {
  const router = useRouter();
  const { colors } = useThemeMode();

  const [activeTab, setActiveTab] = useState<TabKey>("perso");
  const [selectedCategories, setSelectedCategories] = useState<CategoryKey[]>(["Tous"]);
  const { current, start, stop, canceledIds, reviewCompleted, reviewRequiredCount, incrementReview, setFeedback } = useChallenges();
  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [feedbackComment, setFeedbackComment] = useState<string>("");
  const [clubChallenges, setClubChallenges] = useState<ClubChallenge[]>([
    { id: 201, title: "Nettoyage du parc", description: "Venez nettoyer le parc du quartier.", category: "Sensibilisation", difficulty: "Facile", points: 15, goalParticipants: 46, participants: 12 },
    { id: 202, title: "Collecte de recyclage", description: "Collecte commune de déchets recyclables.", category: "Recyclage", difficulty: "Moyen", points: 25, goalParticipants: 46, participants: 28 },
  ]);
  const [clubParticipatingIds, setClubParticipatingIds] = useState<number[]>([]);
  const [clubCanceledIds, setClubCanceledIds] = useState<number[]>([]);
  const [validationQueue, setValidationQueue] = useState([
    {
      id: 101,
      title: "Recycler des bouteilles",
      description: "Preuve de recyclage",
      category: "Recyclage" as const,
      difficulty: "Facile" as const,
      points: 10,
      audience: "Membre" as const,
      timeLeft: "—",
      userName: "Alex",
      photoUrl: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 102,
      title: "Aller au marché local",
      description: "Panier local",
      category: "Local" as const,
      difficulty: "Moyen" as const,
      points: 20,
      audience: "Membre" as const,
      timeLeft: "—",
      userName: "Lina",
      photoUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 103,
      title: "Défi compost maison",
      description: "Compost",
      category: "Tri" as const,
      difficulty: "Difficile" as const,
      points: 30,
      audience: "Membre" as const,
      timeLeft: "—",
      userName: "Marie",
      photoUrl: "https://images.unsplash.com/photo-1615485737651-6f6c4110fc94?q=80&w=800&auto=format&fit=crop",
    },
  ]);

  const filteredChallenges = useMemo(() => {
    if (selectedCategories.includes("Tous") || selectedCategories.length === 0) return CHALLENGES;
    const set = new Set(selectedCategories.filter((c) => c !== "Tous") as any);
    return CHALLENGES.filter((c) => set.has(c.category));
  }, [selectedCategories]);

  // Exclude canceled challenges from display
  const availableChallenges = useMemo(() => {
    if (!canceledIds.length) return filteredChallenges;
    const canceled = new Set(canceledIds);
    return filteredChallenges.filter((c) => !canceled.has(c.id));
  }, [filteredChallenges, canceledIds]);

  const ongoingChallenges = useMemo(
    () => (current ? [current] : []),
    [current]
  );

  const gatingActive = current?.status === 'pendingValidation' && reviewCompleted < reviewRequiredCount;

  const hideAfterFeedback = current?.status === 'pendingValidation' && reviewCompleted >= reviewRequiredCount && current?.feedbackSubmitted;

  const challengesToDisplay = useMemo(() => {
    // Masquer le défi courant après feedback soumis pendant la phase d'attente de validation admin
    if (current && !gatingActive && !hideAfterFeedback) return [current];
    return availableChallenges;
  }, [current, availableChallenges, gatingActive, hideAfterFeedback]);

  const toggleOngoing = (id: number) => {
    const challenge = CHALLENGES.find((c) => c.id === id);
    if (!challenge) return;
    if (current && current.id === id) {
      stop(id);
    } else {
      start(challenge);
    }
  };

  const openCamera = (challengeId: number) => {
    router.push({ pathname: '/camera', params: { id: String(challengeId) } });
  };

  const pickFromGallery = async (challengeId: number) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!res.canceled && res.assets[0]?.uri) {
      // Re-use camera flow by navigating with a param? Simpler: push camera with temp param and rely on manual retake not needed.
      // For simplicity we can navigate to camera to confirm, or extend context directly; keep camera for consistency.
      router.push({ pathname: '/camera', params: { id: String(challengeId), preset: res.assets[0].uri } });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
  {/* HEADER -> titre + sous-titre inline ; cartes via components/ui/defi */}
      <Text style={[styles.title, { color: colors.text }]}>Défis</Text>
      {/* Subtitle and join club button removed as requested */}

  {/* SWITCHER -> components/ui/defi/TabSwitcher */}
      <TabSwitcher activeTab={activeTab} onChange={setActiveTab} />


  {/* CONTENU -> components/ui/defi/ChallengeCard & ValidationCard */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        stickyHeaderIndices={[0]} // Make the first child sticky
      >
        {/* Sticky header */}
        {activeTab === "perso" && !current && (
          <View style={{ backgroundColor: colors.background }}>
            <CategorySelector
              selected={selectedCategories}
              onToggle={(key) => {
                if (key === "Tous") {
                  setSelectedCategories(["Tous"]);
                  return;
                }
                setSelectedCategories((prev) => {
                  // If "Tous" was selected, replace with the key
                  const withoutTous = prev.filter((k) => k !== "Tous");
                  const exists = withoutTous.includes(key);
                  const next = exists
                    ? withoutTous.filter((k) => k !== key)
                    : [...withoutTous, key];
                  return next.length === 0 ? ["Tous"] : (next as CategoryKey[]);
                });
              }}
            />
          </View>
        )}

        {/* Gating message when user's challenge awaiting validation and needs reviews */}
        {activeTab === 'perso' && gatingActive && (
          <View style={{
            backgroundColor: colors.surface,
            padding: 20,
            borderRadius: 24,
            marginBottom: 18,
          }}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>Validation requise</Text>
            <Text style={{ color: colors.mutedText, marginTop: 8 }}>
              Il vous faut maintenant valider 3 défis d'autres membres avant que votre propre défi soit examiné.
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 12 }}>
              <View style={{ flex: 1, height: 10, backgroundColor: colors.surfaceAlt, borderRadius: 6, overflow: 'hidden' }}>
                <View style={{ width: `${(reviewCompleted / reviewRequiredCount) * 100}%`, backgroundColor: colors.accent, height: '100%' }} />
              </View>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{reviewCompleted}/{reviewRequiredCount}</Text>
            </View>
          </View>
        )}

        {/* Gating phase shows validation cards instead of challenge list */}
        {activeTab === 'perso' && gatingActive && (
          validationQueue.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.mutedText }]}>Aucun défi à valider.</Text>
          ) : (
            validationQueue.map((item) => (
              <ValidationCard
                key={item.id}
                item={item}
                onValidate={() => {
                  setValidationQueue((q) => q.filter((x) => x.id !== item.id));
                  incrementReview();
                }}
                onReject={() => {
                  setValidationQueue((q) => q.filter((x) => x.id !== item.id));
                  incrementReview();
                }}
              />
            ))
          )
        )}

        {/* Normal challenge cards when not in gating phase */}
        {activeTab === "perso" && !gatingActive && challengesToDisplay.map((challenge: any) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            isOngoing={current?.id === challenge.id}
            status={current?.id === challenge.id ? current?.status : undefined}
            onToggle={toggleOngoing}
            onValidatePhoto={
              current && current.id === challenge.id && current.status === "active"
                ? () => openCamera(challenge.id)
                : undefined
            }
          />
        ))}

        {/* Feedback form while current is pending validation and reviews complete (not yet submitted) */}
        {activeTab === 'perso' && current && current.status === 'pendingValidation' && reviewCompleted >= reviewRequiredCount && !current.feedbackSubmitted && (
          <View style={{ backgroundColor: colors.surface, padding: 20, borderRadius: 24, marginTop: 10 }}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>Laisser un avis</Text>
            <Text style={{ color: colors.mutedText, marginTop: 6 }}>Notez ce défi et laissez un commentaire pour aider la validation.</Text>
            <View style={{ flexDirection: 'row', marginTop: 12 }}>
              {[1,2,3,4,5].map((n) => (
                <TouchableOpacity key={n} onPress={() => setFeedbackRating(n)} style={{ marginRight: 8 }}>
                  <Text style={{ fontSize: 24 }}>{feedbackRating >= n ? '⭐' : '☆'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              value={feedbackComment}
              onChangeText={setFeedbackComment}
              placeholder="Votre commentaire"
              multiline
              numberOfLines={4}
              style={{ marginTop: 12, borderWidth: 1, borderColor: colors.border ?? '#2A3431', backgroundColor: colors.surfaceAlt, color: colors.text, borderRadius: 12, padding: 12, textAlignVertical: 'top' }}
            />
            <TouchableOpacity
              onPress={() => setFeedback(feedbackRating || 0, feedbackComment.trim())}
              disabled={feedbackRating === 0}
              style={{ marginTop: 14, borderRadius: 14, paddingVertical: 12, alignItems: 'center', backgroundColor: feedbackRating === 0 ? '#2A3431' : colors.accent }}
            >
              <Text style={{ color: feedbackRating === 0 ? '#8AA39C' : '#0F3327', fontWeight: '700' }}>Envoyer l'avis</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Message après envoi de l'avis */}
        {activeTab === 'perso' && hideAfterFeedback && (
          <View style={{ backgroundColor: colors.surface, padding: 20, borderRadius: 24, marginTop: 10 }}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>Défi en cours de validation</Text>
            <Text style={{ color: colors.mutedText, marginTop: 6 }}>Merci pour votre avis. Votre défi sera examiné prochainement par l'équipe.</Text>
          </View>
        )}

        {/* Club tab: club challenges with participant counters */}
        {activeTab === 'club' && (
          clubChallenges.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.mutedText }]}>Aucun défi de club.</Text>
          ) : (
            clubChallenges.filter((c) => !clubCanceledIds.includes(c.id)).map((cc) => (
              <ClubChallengeCard
                key={cc.id}
                challenge={cc}
                participating={clubParticipatingIds.includes(cc.id)}
                onParticipate={(id) => {
                  if (clubParticipatingIds.includes(id)) return;
                  setClubChallenges((arr) => arr.map((c) => c.id === id ? { ...c, participants: Math.min(c.participants + 1, c.goalParticipants) } : c));
                  setClubParticipatingIds((ids) => [...ids, id]);
                }}
                onCancel={(id) => {
                  // Decrement participants then hide challenge entirely
                  setClubChallenges((arr) => arr.map((c) => c.id === id ? { ...c, participants: Math.max(0, c.participants - 1) } : c));
                  setClubParticipatingIds((ids) => ids.filter((x) => x !== id));
                  setClubCanceledIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
                }}
              />
            ))
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { marginTop: 6, fontSize: 14 },
  clubButton: {
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 8,
    alignSelf: "flex-start",
    marginTop: 16,
  },
  clubButtonText: { color: "#0F3327", fontWeight: "600" },
  scroll: { marginTop: 12 },
  emptyText: { textAlign: "center", marginTop: 40, fontSize: 16 },
});
