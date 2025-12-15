import { AdminNav } from "@/components/ui/(admin)/AdminNav";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function AdminHome() {
  const { colors, theme } = useThemeMode();
  const router = useRouter();

  const isDark = theme === "dark";

  // Composant Bouton "Glass"
  const GlassButton = ({
    title,
    subtitle,
    icon,
    route,
    colorType = "normal",
  }: {
    title: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
    route: string;
    colorType?: "accent" | "normal" | "alert";
  }) => {
    
    let iconColor = isDark ? "#fff" : colors.text;
    let bgOpacity = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.65)";
    
    if (colorType === "accent") {
      iconColor = "#fff";
      bgOpacity = colors.accent;
    } else if (colorType === "alert") {
      iconColor = colors.error || "#EF4444";
    }

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push(route as any)}
        style={[
          styles.glassCard,
          {
            backgroundColor: colorType === "accent" ? colors.accent : bgOpacity,
            borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.5)",
          },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: "rgba(0,0,0,0.05)" }]}>
          <Ionicons name={icon} size={24} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.cardTitle,
              { color: colorType === "accent" ? "#fff" : colors.text },
            ]}
          >
            {title}
          </Text>
          <Text
            style={[
              styles.cardSubtitle,
              { color: colorType === "accent" ? "rgba(255,255,255,0.9)" : colors.mutedText },
            ]}
          >
            {subtitle}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colorType === "accent" ? "rgba(255,255,255,0.6)" : colors.mutedText}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Cette ligne tente de cacher le header spécifique à cet écran, mais voir l'étape 2 si ça ne suffit pas */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* 🟢 BACKGROUND LIQUIDE VERT / BLEU */}
      <LinearGradient
        colors={
          isDark
            ? [colors.background, "#0f2027", "#203a43"] 
            : ["#d1fae5", "#cffafe", "#ffffff"] // Menthe -> Cyan -> Blanc
        }
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.container}>
        
        {/* En-tête avec gros titre */}
        <View style={styles.header}>
          <View style={styles.pill}>
            <Ionicons name="shield-checkmark" size={18} color={colors.accent} />
            <Text style={[styles.pillText, { color: colors.accent }]}>MODE ADMIN</Text>
          </View>
        </View>

        <View style={styles.menuContainer}>
          <GlassButton
            title="Créer un défi"
            subtitle="Lancer un nouveau challenge"
            icon="add"
            route="/(admin)/create-defi"
            colorType="accent"
          />

          <GlassButton
            title="Gérer les défis"
            subtitle="Modifier ou supprimer"
            icon="list"
            route="/(admin)/list-defis"
          />

          <GlassButton
            title="Signalements"
            subtitle="Modération de la communauté"
            icon="alert-circle-outline"
            route="/(admin)/reports"
            colorType="alert"
          />
          <GlassButton
            title="Avis & Retours"
            subtitle="Notes et commentaires des membres"
            icon="star-outline" // ou "chatbox-outline"
            route="/(admin)/feedback"
            colorType="normal" // ou un nouveau type "warning" jaune si tu veux
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
    paddingHorizontal: 20,
    paddingTop: 80, // Plus d'espace en haut
  },
  header: {
    marginBottom: 50,
    alignItems: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.5)", // Fond semi-transparent pour le pill
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 30,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    // Ombre légère
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  pillText: {
    fontSize: 16, // Beaucoup plus grand
    fontWeight: "800", // Plus gras
    letterSpacing: 1.5,
  },
  menuContainer: {
    gap: 20,
  },
  glassCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24, // Cards un peu plus grandes
    borderRadius: 30,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
  },
});