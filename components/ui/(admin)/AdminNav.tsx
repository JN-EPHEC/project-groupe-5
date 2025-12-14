import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useSegments } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export function AdminNav() {
  const { colors } = useThemeMode();
  const router = useRouter();
  const segments = useSegments();

  const active = segments[segments.length - 1];

  const isActive = (route: string) =>
    active === route.replace("/(admin)/", "") ||
    // when you are on / (admin root)
    (!active && route === "/(admin)/");

  const Btn = ({
    icon,
    label,
    route,
  }: {
    icon: any;
    label: string;
    route: string;
  }) => {
    const activeHere = isActive(route);

    return (
      <TouchableOpacity
        onPress={() => router.push(route as any)}
        style={[
          styles.btn,
          {
            backgroundColor: activeHere ? colors.accent : colors.surfaceAlt,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={activeHere ? "#fff" : colors.text}
        />
        <Text
          numberOfLines={1}
          style={{
            color: activeHere ? "#fff" : colors.text,
            fontSize: 10, // Réduit légèrement la taille pour que "Signalements" rentre
            marginTop: 2,
          }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: colors.surface,
            shadowColor: "#000",
          },
        ]}
      >
        <Btn icon="home-outline" label="Accueil" route="/(admin)/" />
        <Btn
          icon="add-circle-outline"
          label="Créer"
          route="/(admin)/create-defi"
        />
        <Btn
          icon="list-outline"
          label="Liste"
          route="/(admin)/list-defis"
        />
        {/* NOUVEAU BOUTON */}
        <Btn
          icon="alert-circle-outline"
          label="Signalements"
          route="/(admin)/reports"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 8,
    paddingTop: 4,
    backgroundColor: "transparent",
  },
  bar: {
    marginHorizontal: 16,
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 6, // Réduit un peu le padding horizontal
    flexDirection: "row",
    justifyContent: "space-between", // Changé de space-around à space-between pour mieux répartir
    alignItems: "center",
    elevation: 10,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: -2 },
  },
  btn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 16,
    width: "23%", // Utilisation de pourcentage au lieu de fixe pour s'adapter
  },
});