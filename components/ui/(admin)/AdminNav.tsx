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
          style={{
            color: activeHere ? "#fff" : colors.text,
            fontSize: 12,
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
          label="Créer défi"
          route="/(admin)/create-defi"
        />
        <Btn
          icon="list-outline"
          label="Liste défis"
          route="/(admin)/list-defis"
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
    paddingHorizontal: 10,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    elevation: 10,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: -2 },
  },
  btn: {
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    width: 90,
  },
});
