import { useThemeMode } from "@/hooks/theme-context";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Tab = "clubs" | "amis";

interface TabsSwitcherProps {
  selectedTab: Tab;
  onChange: (tab: Tab) => void;
}

export const TabsSwitcher: React.FC<TabsSwitcherProps> = ({ selectedTab, onChange }) => {
  const { colors } = useThemeMode();
  const tabs: Tab[] = ["clubs", "amis"];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => onChange(tab)}
          style={[
            styles.tab,
            {
              backgroundColor: selectedTab === tab ? colors.accent : colors.surfaceAlt,
            },
          ]}
        >
          <Text
            style={[
              styles.tabText,
              { color: selectedTab === tab ? colors.text : colors.mutedText },
            ]}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: "row", justifyContent: "space-around", marginBottom: 16 },
  tab: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20 },
  tabText: { fontWeight: "600", textTransform: "capitalize" },
});
