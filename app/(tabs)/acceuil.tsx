import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ProgressCircle from "../../components/ProgressCircle";

export default function AcceuilScreen() {
  const { colors } = useThemeMode();
  const defisFaient = 2;
  const defisTotal = 5;

  return (
  <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 100 }}>

      {/* HEADER */}
  <Text style={[styles.appTitle, { color: colors.text }]}>GREEN UP</Text>

      <View style={styles.center}>
        <View style={styles.avatar}>
          <Ionicons name="walk-outline" size={40} color="#fff" />
        </View>

        <View style={styles.badge}>
          <Ionicons name="leaf-outline" size={14} color="#fff" />
          <Text style={styles.badgeText}>10</Text>
        </View>

  <Text style={[styles.username, { color: colors.text }]}>Bonjour Marie</Text>
  <Text style={[styles.team, { color: colors.mutedText }]}>Éco-Warriors</Text>
      </View>

      {/* POINTS */}
      <View style={[styles.pointsBox, { backgroundColor: colors.surface }]}>
        <Text style={[styles.pointsNumber, { color: colors.accent }]}>285</Text>
        <Text style={[styles.pointsLabel, { color: colors.mutedText }]}>Points</Text>
      </View>

      {/* CLASSEMENT */}
  <Text style={[styles.sectionTitle, { color: colors.text }]}>Classement</Text>
      <View style={styles.row}>
        <View style={[styles.rankCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.rankNumber, { color: colors.text }]}>2e sur 400</Text>
          <Text style={[styles.rankLabel, { color: colors.mutedText }]}>Individuel</Text>
        </View>

        <View style={[styles.rankCardActive, { backgroundColor: colors.surfaceAlt }]}>
          <Text style={[styles.rankNumber, { color: colors.text }]}>1er sur 5</Text>
          <Text style={[styles.rankLabel, { color: colors.mutedText }]}>Club</Text>
        </View>
      </View>

      {/* PROGRESSION SEMAINE */}
      <View style={[styles.progressCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Progression de la semaine</Text>

        <View style={styles.row}>
          <ProgressCircle done={defisFaient} total={defisTotal} />
          <View style={{ marginLeft: 16 }}>
            <Text style={[styles.progressStat, { color: colors.text }]}>50 Points gagnés</Text>
            <Text style={[styles.progressSub, { color: colors.mutedText }]}>2 jours de suite 🔥</Text>
          </View>
        </View>
      </View>

      {/* DÉFI DU JOUR */}
      <View style={[styles.challengeCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.challengeTitle, { color: colors.mutedText }]}>Défi du jour</Text>
        <Text style={[styles.challengeName, { color: colors.text }]}>Recycler 3 bouteilles plastiques</Text>

  <Text style={[styles.challengeDesc, { color: colors.mutedText }]}>
          Recyclez 3 bouteilles en plastique et prenez une photo de votre geste écologique.
        </Text>

        <View style={styles.row}>
          <View style={[styles.tag, { backgroundColor: colors.surfaceAlt }] }>
            <Ionicons name="leaf-outline" size={14} color="#fff" />
            <Text style={styles.tagText}>Facile</Text>
          </View>

          <TouchableOpacity style={[styles.validateBtn, { backgroundColor: colors.accent }]}>
            <Text style={styles.validateText}>Valider avec photo</Text>
          </TouchableOpacity>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },

  center: { alignItems: "center", marginVertical: 10 },

  appTitle: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 10 },

  avatar: {
    width: 85,
    height: 85,
    borderRadius: 50,
    backgroundColor: "#E45353",
    alignItems: "center",
    justifyContent: "center",
  },

  badge: {
    backgroundColor: "#00C389",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    top: 75,
    right: 120,
  },

  badgeText: { color: "#fff", marginLeft: 4, fontWeight: "600" },

  username: { color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 12 },

  team: { color: "#aaa", marginBottom: 14 },

  pointsBox: {
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 20,
  },

  pointsNumber: { color: "#00C389", fontWeight: "700", fontSize: 24 },
  pointsLabel: { color: "#888", marginTop: 2 },

  sectionTitle: { color: "#fff", fontWeight: "600", marginVertical: 10, fontSize: 16 },

  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  rankCard: {
    padding: 16,
    width: "48%",
    borderRadius: 14,
  },

  rankCardActive: {
    backgroundColor: "#00C38930",
    padding: 16,
    width: "48%",
    borderRadius: 14,
  },

  rankNumber: { color: "#fff", fontWeight: "600", fontSize: 16 },
  rankLabel: { color: "#aaa", marginTop: 4 },

  progressCard: {
    padding: 16,
    borderRadius: 14,
    marginTop: 14,
  },

  progressStat: { color: "#fff", fontWeight: "600", fontSize: 15 },
  progressSub: { color: "#bbb", marginTop: 4 },

  challengeCard: { padding: 16, borderRadius: 14, marginTop: 18 },

  challengeTitle: { color: "#aaa", fontSize: 13, marginBottom: 6 },
  challengeName: { color: "#fff", fontWeight: "600", fontSize: 16 },
  challengeDesc: { color: "#bbb", marginTop: 6, marginBottom: 16 },

  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  tagText: { color: "#fff", marginLeft: 4, fontSize: 12 },

  validateBtn: {
    backgroundColor: "#00C389",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },

  validateText: { color: "#fff", fontWeight: "600" },
});
