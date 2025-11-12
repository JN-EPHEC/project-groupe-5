import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ActionButtonProps {
  icon: string;
  label: string;
  rewardText: string;
  onPress: () => void;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  rewardText,
  onPress,
}) => {
  const { colors } = useThemeMode();

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: colors.surfaceAlt }]}
      onPress={onPress}
    >
      <Ionicons name={icon as any} size={24} color={colors.text} />
      <View style={{ marginLeft: 10 }}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.reward, { color: colors.accent }]}>{rewardText}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  label: { fontSize: 14, fontWeight: "600" },
  reward: { fontSize: 12 },
});
