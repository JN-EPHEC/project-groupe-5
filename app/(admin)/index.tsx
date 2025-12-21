import { AdminNav } from "@/components/ui/(admin)/AdminNav";
import { FontFamilies } from "@/constants/fonts";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// 🎨 THEME ADMIN
const adminTheme = {
    bgGradient: ["#F9FAFB", "#F3F4F6"] as const, // Fond très neutre (blanc/gris)
    glassCardBg: ["#FFFFFF", "rgba(255, 255, 255, 0.8)"] as const,
    borderColor: "rgba(0, 0, 0, 0.05)",
    textMain: "#111827", // Gris très foncé (presque noir)
    textMuted: "#6B7280", // Gris moyen
    accent: "#008F6B", // Vert Marque (pour garder le lien)
    danger: "#EF4444",
};

export default function AdminHome() {
  const { colors, theme } = useThemeMode();
  const router = useRouter();
  const isDark = theme === "dark";

  // Composant Bouton "Glass" Admin
  const AdminCard = ({
    title,
    subtitle,
    icon,
    route,
    variant = "normal",
  }: {
    title: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
    route: string;
    variant?: "accent" | "normal" | "danger";
  }) => {
    
    let iconColor = isDark ? "#fff" : adminTheme.textMain;
    let iconBg = isDark ? "rgba(255,255,255,0.1)" : "#F3F4F6";
    let titleColor = isDark ? "#fff" : adminTheme.textMain;

    if (variant === "accent") {
      iconColor = adminTheme.accent;
      iconBg = isDark ? "rgba(0,143,107,0.2)" : "#E0F7EF";
    } else if (variant === "danger") {
      iconColor = adminTheme.danger;
      iconBg = isDark ? "rgba(239,68,68,0.2)" : "#FEF2F2";
    }

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push(route as any)}
        style={styles.cardContainer}
      >
        <LinearGradient
            colors={isDark ? ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"] : adminTheme.glassCardBg}
            style={[styles.cardContent, { borderColor: isDark ? "rgba(255,255,255,0.1)" : adminTheme.borderColor }]}
        >
            <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
                <Ionicons name={icon} size={24} color={iconColor} />
            </View>
            
            <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: titleColor }]}>{title}</Text>
                <Text style={[styles.cardSubtitle, { color: isDark ? "#9CA3AF" : adminTheme.textMuted }]}>{subtitle}</Text>
            </View>

            <View style={[styles.arrowBox, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F9FAFB" }]}>
                <Ionicons name="chevron-forward" size={16} color={isDark ? "#6B7280" : "#9CA3AF"} />
            </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // Background Props
  const bgColors = isDark ? [colors.background, "#1F2937"] : adminTheme.bgGradient;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* FOND */}
      <LinearGradient
        colors={bgColors as any}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.container}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
              <View>
                <Text style={[styles.welcomeText, { color: isDark ? "#9CA3AF" : adminTheme.textMuted }]}>Bienvenue,</Text>
                <Text style={[styles.headerTitle, { color: isDark ? "#FFF" : adminTheme.textMain }]}>Panneau Admin</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: isDark ? "rgba(0,143,107,0.2)" : "#ECFDF5" }]}>
                <View style={[styles.dot, { backgroundColor: adminTheme.accent }]} />
                <Text style={[styles.badgeText, { color: adminTheme.accent }]}>Actif</Text>
              </View>
          </View>
          <Text style={[styles.headerSubtitle, { color: isDark ? "#6B7280" : "#9CA3AF" }]}>Gérez le contenu et la communauté.</Text>
        </View>

        {/* MENU GRID */}
        <View style={styles.menuContainer}>
          <AdminCard
            title="Créer un défi"
            subtitle="Lancer un nouveau challenge"
            icon="add-circle-outline" // Icone plus moderne
            route="/(admin)/create-defi"
            variant="accent"
          />

          <AdminCard
            title="Gérer les défis"
            subtitle="Modifier ou supprimer"
            icon="list-outline"
            route="/(admin)/list-defis"
          />

          <AdminCard
            title="Signalements"
            subtitle="Modération de la communauté"
            icon="shield-half-outline" // Icone plus "sécurité"
            route="/(admin)/reports"
            variant="danger"
          />

          <AdminCard
            title="Avis & Retours"
            subtitle="Feedback des utilisateurs"
            icon="chatbubbles-outline"
            route="/(admin)/feedback"
          />
        </View>
      </View>

      <AdminNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 70,
  },
  
  // Header Styles
  header: { marginBottom: 40 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  welcomeText: { fontSize: 14, fontFamily: FontFamilies.heading, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontSize: 32, fontFamily: FontFamilies.heading, fontWeight: "800" },
  headerSubtitle: { fontSize: 16, fontFamily: FontFamilies.body },
  
  // Badge
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  badgeText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },

  // Menu Styles
  menuContainer: { gap: 16 },
  
  // Card Styles
  cardContainer: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.03,
      shadowRadius: 10,
      elevation: 2,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: FontFamilies.heading,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: FontFamilies.body,
  },
  arrowBox: {
      width: 32, height: 32, borderRadius: 12,
      alignItems: 'center', justifyContent: 'center',
      marginLeft: 10
  }
});