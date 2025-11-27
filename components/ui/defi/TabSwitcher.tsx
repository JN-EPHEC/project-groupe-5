import { useThemeMode } from "@/hooks/theme-context";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { TabKey } from "./types";

type Props = {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
};

export function TabSwitcher({ activeTab, onChange }: Props) {
  const { colors } = useThemeMode();

  return (
    <View style={[styles.tabSwitcher, { backgroundColor: colors.surfaceAlt }]}>
      {(["perso", "club"] as TabKey[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.switcherButton,
            activeTab === tab && { backgroundColor: colors.accent },
          ]}
          onPress={() => onChange(tab)}
        >
          <Text
            style={[
              styles.switcherText,
              { color: activeTab === tab ? "#0F3327" : colors.mutedText },
            ]}
          >
            {tab === "perso" ? "Perso" : "Club"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
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
  switcherText: {
    fontWeight: "600",
  },
});
