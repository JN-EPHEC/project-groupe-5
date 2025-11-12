import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const CATEGORY_CONFIG = {
  Tous: { icon: "earth-outline", label: "Tous" },
  Recyclage: { icon: "leaf-outline", label: "Recyclage" },
  Local: { icon: "storefront-outline", label: "Local" },
  Transports: { icon: "bicycle-outline", label: "Transports" },
  Tri: { icon: "trash-outline", label: "Tri" },
  Sensibilisation: { icon: "megaphone-outline", label: "Sensibilisation" },
} as const;

type CategoryKey = keyof typeof CATEGORY_CONFIG;
type ChallengeCategory = Exclude<CategoryKey, "Tous">;
type TabKey = "defis" | "validations";

type Challenge = {
  id: number;
  title: string;
  description: string;
  category: ChallengeCategory;
  difficulty: "Facile" | "Moyen" | "Difficile";
  points: number;
  audience: string;
  timeLeft: string;
};

const DIFFICULTY_COLORS: Record<Challenge["difficulty"], string> = {
  Facile: "#52D192",
  Moyen: "#F4C95D",
  Difficile: "#F45B69",
};

const CHALLENGES: Challenge[] = [
  {
    id: 1,
    title: "Recycler 3 bouteilles plastiques",
    description: "Recyclez 3 bouteilles en plastique et partagez une photo de votre geste.",
    category: "Recyclage",
    difficulty: "Facile",
    points: 10,
    audience: "Membre",
    timeLeft: "14 h 25",
  },
  {
    id: 2,
    title: "Aller au marché local",
    description: "Achetez des produits locaux et montrez votre panier de fruits/légumes.",
    category: "Local",
    difficulty: "Moyen",
    points: 20,
    audience: "Membre",
    timeLeft: "2 j 03 h",
  },
  {
    id: 3,
    title: "Choisir le vélo pour se déplacer",
    description: "Faites un trajet de 5 km à vélo au lieu de prendre la voiture.",
    category: "Transports",
    difficulty: "Moyen",
    points: 20,
    audience: "Membre",
    timeLeft: "1 j 12 h",
  },
  {
    id: 4,
    title: "Défi compost maison",
    description: "Mettez en place un composteur domestique et partagez une photo.",
    category: "Tri",
    difficulty: "Difficile",
    points: 30,
    audience: "Membre",
    timeLeft: "4 j 05 h",
  },
  {
    id: 5,
    title: "Partager un conseil écologique",
    description: "Publiez un conseil zéro-déchet sur les réseaux sociaux.",
    category: "Sensibilisation",
    difficulty: "Facile",
    points: 10,
    audience: "Membre",
    timeLeft: "8 h 10",
  },
];

export default function DefiScreen() {
  const router = useRouter();
  const { colors, mode } = useThemeMode();
  const [activeTab, setActiveTab] = useState<TabKey>("defis");
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof CATEGORY_CONFIG>("Tous");
  const [ongoingIds, setOngoingIds] = useState<number[]>([]);

  const filteredChallenges = useMemo(() => {
    if (selectedCategory === "Tous") {
      return CHALLENGES;
    }
    return CHALLENGES.filter((challenge) => challenge.category === selectedCategory);
  }, [selectedCategory]);

  const ongoingChallenges = useMemo(
    () => CHALLENGES.filter((challenge) => ongoingIds.includes(challenge.id)),
    [ongoingIds]
  );

  const toggleOngoing = (id: number) => {
    setOngoingIds((prev) =>
      prev.includes(id) ? prev.filter((challengeId) => challengeId !== id) : [...prev, id]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }] }>
      <Text style={[styles.title, { color: colors.text }]}>Défis</Text>
      <Text style={[styles.subtitle, { color: colors.mutedText }]}>Relevez des défis et gagnez des points</Text>

      <TouchableOpacity style={styles.clubButton} onPress={() => router.push("/social")}>
        <Text style={styles.clubButtonText}>Rejoindre un club</Text>
      </TouchableOpacity>

      <View style={styles.tabSwitcher}>
        <TouchableOpacity
          style={[styles.switcherButton, activeTab === "defis" && styles.switcherButtonActive]}
          onPress={() => setActiveTab("defis")}
        >
          <Text
            style={[styles.switcherText, activeTab === "defis" && styles.switcherTextActive]}
          >
            Défis
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.switcherButton, activeTab === "validations" && styles.switcherButtonActive]}
          onPress={() => setActiveTab("validations")}
        >
          <Text
            style={[styles.switcherText, activeTab === "validations" && styles.switcherTextActive]}
          >
            Validations
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "defis" && (
        <ScrollView
          horizontal
          style={styles.categoryScroll}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContent}
        >
          {(Object.keys(CATEGORY_CONFIG) as CategoryKey[]).map((typedKey) => {
            const { icon, label } = CATEGORY_CONFIG[typedKey];

            return (
              <TouchableOpacity
                key={label}
                onPress={() => setSelectedCategory(typedKey)}
                style={[
                  styles.categoryChip,
                  { backgroundColor: colors.pill },
                  selectedCategory === typedKey && {
                    backgroundColor: mode === "light" ? colors.accent : colors.pillActive,
                  },
                ]}
              >
                <Ionicons
                  name={icon}
                  size={16}
                  color={selectedCategory === typedKey
                    ? mode === "light"
                      ? colors.text
                      : "#0F3327"
                    : colors.mutedText}
                />
                <Text style={{
                  color: selectedCategory === typedKey
                    ? mode === "light"
                      ? colors.text
                      : "#0F3327"
                    : colors.mutedText,
                  marginLeft: 8,
                  fontWeight: "600",
                }}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <ScrollView
        style={styles.contentScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {activeTab === "defis" &&
          filteredChallenges.map((challenge) => {
            const categoryInfo = CATEGORY_CONFIG[challenge.category];
            const isOngoing = ongoingIds.includes(challenge.id);

            return (
              <View key={challenge.id} style={[styles.card, { backgroundColor: colors.surface }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardCategoryPill, { backgroundColor: colors.surfaceAlt }] }>
                    <Ionicons name={categoryInfo.icon} size={16} color="#7DCAB0" />
                    <Text style={styles.cardCategoryText}>{categoryInfo.label}</Text>
                  </View>
                  <View style={styles.pointsBadge}>
                    <Ionicons name="leaf" size={16} color="#0F3327" />
                    <Text style={styles.pointsBadgeText}>{challenge.points} pts</Text>
                  </View>
                </View>

                <Text style={[styles.cardTitle, { color: colors.text }]}>{challenge.title}</Text>
                <Text style={[styles.cardDescription, { color: colors.mutedText }]}>{challenge.description}</Text>

                <View style={styles.metaRow}>
                  <View style={[styles.metaPill, { backgroundColor: DIFFICULTY_COLORS[challenge.difficulty] }]}>
                    <Ionicons name="speedometer-outline" size={16} color="#0F3327" />
                    <Text style={styles.metaPillTextDark}>{challenge.difficulty}</Text>
                  </View>
                  <View style={[styles.metaPillMuted, { backgroundColor: colors.surfaceAlt }]}>
                    <Ionicons name="time-outline" size={16} color="#9FB9AE" />
                    <Text style={styles.metaPillText}>{challenge.timeLeft}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, { marginTop: 16 }, isOngoing && styles.primaryButtonActive]}
                  onPress={() => toggleOngoing(challenge.id)}
                >
                  <Text style={[styles.primaryButtonText, isOngoing && styles.primaryButtonTextActive]}>
                    {isOngoing ? "Défi en cours" : "Relever le défi"}
                  </Text>
                  <Ionicons
                    name={isOngoing ? "checkmark-circle" : "arrow-forward"}
                    size={18}
                    color={isOngoing ? "#7DCAB0" : "#0F3327"}
                    style={styles.trailingIcon}
                  />
                </TouchableOpacity>
              </View>
            );
          })}

        {activeTab === "validations" && (
          ongoingChallenges.length === 0 ? (
            <Text style={styles.emptyState}>Aucun défi en cours pour le moment.</Text>
          ) : (
            ongoingChallenges.map((challenge) => {
              const categoryInfo = CATEGORY_CONFIG[challenge.category];

              return (
                <View key={`validation-${challenge.id}`} style={styles.validationCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardCategoryPill}>
                      <Ionicons name={categoryInfo.icon} size={16} color="#7DCAB0" />
                      <Text style={styles.cardCategoryText}>{categoryInfo.label}</Text>
                    </View>
                    <View style={styles.pointsBadge}>
                      <Ionicons name="leaf" size={16} color="#0F3327" />
                      <Text style={styles.pointsBadgeText}>{challenge.points} pts</Text>
                    </View>
                  </View>

                  <Text style={styles.cardTitle}>{challenge.title}</Text>

                  <View style={styles.proofBox}>
                    <Ionicons name="image-outline" size={36} color="#5C6F69" />
                    <Text style={styles.proofText}>Preuve à vérifier</Text>
                  </View>

                  <View style={styles.validationActions}>
                    <TouchableOpacity style={styles.secondaryButton}>
                      <Ionicons name="close-circle" size={18} color="#EBE6D3" style={styles.leadingIcon} />
                      <Text style={styles.secondaryButtonText}>Refuser</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.successButton}>
                      <Ionicons name="checkmark-circle" size={18} color="#0F3327" style={styles.leadingIcon} />
                      <Text style={styles.successButtonText}>Valider</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1412",
    paddingHorizontal: 20,
    paddingTop: 16,
    position: "relative",
  },
  title: {
    color: "#F2F6F4",
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: "#9FB9AE",
    marginTop: 6,
  },
  clubButton: {
    backgroundColor: "#19D07D",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 8,
    alignSelf: "flex-start",
    marginTop: 16,
  },
  clubButtonText: {
    color: "#0F3327",
    fontWeight: "600",
  },
  tabSwitcher: {
    flexDirection: "row",
    borderRadius: 24,
    padding: 4,
    marginTop: 20,
  },
  switcherButton: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: "center",
  },
  switcherButtonActive: {
    backgroundColor: "#19D07D",
  },
  switcherText: {
    color: "#8FA79D",
    fontWeight: "600",
  },
  switcherTextActive: {
    color: "#0F3327",
  },
 categoryScroll: {
  marginTop: 18,
  marginBottom: 12, // reduce spacing
  paddingBottom: 6, // IMPORTANT → prevents overlap
  zIndex: 10,

  },

  categoryContent: {
    paddingRight: 20,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  categoryChipActive: {
    backgroundColor: "#D4F7E7",
  },
  categoryText: {
    color: "#9FB9AE",
    marginLeft: 8,
    fontWeight: "600",
  },
  categoryTextActive: {
    color: "#0F3327",
  },
  contentScroll: {
    marginTop: 8,
  },
  contentContainer: {
    paddingTop: 8,
    paddingBottom: 160,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
    minHeight: 260,
    maxHeight: 260,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardCategoryPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  cardCategoryText: {
    color: "#7DCAB0",
    fontWeight: "600",
    marginLeft: 6,
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D4F7E7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pointsBadgeText: {
    color: "#0F3327",
    fontWeight: "700",
    marginLeft: 6,
  },
  cardTitle: {
    color: "#EEF8F1",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
  },
  cardDescription: {
    color: "#9FB9AE",
    marginTop: 8,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
    marginBottom: 8,
  },
  metaPillMuted: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
    marginBottom: 8,
  },
  metaPillText: {
    color: "#9FB9AE",
    marginLeft: 6,
    fontWeight: "600",
  },
  metaPillTextDark: {
    color: "#0F3327",
    marginLeft: 6,
    fontWeight: "700",
  },
  primaryButton: {
    marginTop: 20,
    backgroundColor: "#D4F7E7",
    borderRadius: 18,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  primaryButtonActive: {
    backgroundColor: "#142822",
    borderWidth: 1,
    borderColor: "#7DCAB0",
  },
  primaryButtonText: {
    color: "#0F3327",
    fontWeight: "700",
  },
  primaryButtonTextActive: {
    color: "#7DCAB0",
  },
  trailingIcon: {
    marginLeft: 8,
  },
  leadingIcon: {
    marginRight: 8,
  },
  emptyState: {
    color: "#9FB9AE",
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
  },
  validationCard: {
    backgroundColor: "#111F1B",
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
  },
  proofBox: {
    backgroundColor: "#152922",
    borderRadius: 18,
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },
  proofText: {
    color: "#5C6F69",
    marginTop: 12,
  },
  validationActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2F2B2A",
    borderRadius: 18,
    paddingVertical: 12,
    width: "48%",
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    color: "#EBE6D3",
    fontWeight: "600",
  },
  successButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#19D07D",
    borderRadius: 18,
    paddingVertical: 12,
    width: "48%",
    paddingHorizontal: 12,
  },
  successButtonText: {
    color: "#0F3327",
    fontWeight: "700",
  },
});
