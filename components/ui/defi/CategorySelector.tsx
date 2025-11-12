import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import { CATEGORY_CONFIG } from "./constants";
import { CategoryKey } from "./types";

type Props = {
  selected: CategoryKey;
  onSelect: (key: CategoryKey) => void;
};

export function CategorySelector({ selected, onSelect }: Props) {
  const { colors, mode } = useThemeMode();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      style={styles.scroll}
    >
      {(Object.keys(CATEGORY_CONFIG) as CategoryKey[]).map((key) => {
        const { icon, label } = CATEGORY_CONFIG[key];
        const isActive = key === selected;

        return (
          <TouchableOpacity
            key={key}
            style={[
              styles.chip,
              {
                backgroundColor: isActive
                  ? mode === "light"
                    ? colors.accent
                    : colors.pillActive
                  : colors.pill,
              },
            ]}
            onPress={() => onSelect(key)}
          >
            <Ionicons
              name={icon}
              size={16}
              color={isActive ? (mode === "light" ? colors.text : "#0F3327") : colors.mutedText}
            />
            <Text
              style={{
                color: isActive ? (mode === "light" ? colors.text : "#0F3327") : colors.mutedText,
                marginLeft: 8,
                fontWeight: "600",
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { marginTop: 18, marginBottom: 10 },
  content: { paddingRight: 20 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
});
