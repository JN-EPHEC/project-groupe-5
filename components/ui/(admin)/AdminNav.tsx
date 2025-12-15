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
            backgroundColor: activeHere ? colors.accent : "transparent",
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
            fontSize: 9, 
            marginTop: 2,
            fontWeight: activeHere ? "700" : "400",
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
        <Btn icon="add-circle-outline" label="Créer" route="/(admin)/create-defi" />
        <Btn icon="list-outline" label="Liste" route="/(admin)/list-defis" />
        <Btn icon="star-outline" label="Avis" route="/(admin)/feedback" />
        <Btn icon="alert-circle-outline" label="Alertes" route="/(admin)/reports" />
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
    marginHorizontal: 10,
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 4,
    flexDirection: "row",
    justifyContent: "space-between",
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
    paddingHorizontal: 2,
    borderRadius: 16,
    width: "19%", 
  },
});