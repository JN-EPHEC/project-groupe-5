import React from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

import { FontFamilies } from "@/constants/fonts";
import { useThemeMode } from "@/hooks/theme-context";

interface SettingSwitchProps {
  label: string;
  value: boolean;
  onValueChange: (next: boolean) => void | Promise<void>;
  disabled?: boolean;
}
export const SettingSwitch: React.FC<SettingSwitchProps> = ({ label, value, onValueChange, disabled }) => {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";
  const inactiveThumb = isLight ? "#e5e7eb" : "#2e2e32";
  const activeThumb = isLight ? colors.cardText : "#f5f5f5";
  const inactiveTrack = isLight ? "rgba(255,255,255,0.25)" : "#3f3f46";
  const activeTrack = isLight ? colors.accent : "#1f8f5a";
  return (
    <View style={styles.switchRow}>
      <Text style={[styles.switchText, { color: isLight ? colors.cardText : colors.mutedText }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        thumbColor={value ? activeThumb : inactiveThumb}
        trackColor={{ false: inactiveTrack, true: activeTrack }}
        disabled={disabled}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  switchRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  switchText: { fontSize: 15, fontFamily: FontFamilies.headingMedium },
});
