import { FontFamilies } from "@/constants/fonts";
import { useThemeMode } from "@/hooks/theme-context";
import React from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

interface SettingSwitchProps {
  label: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  disabled?: boolean;
}

export const SettingSwitch = ({ label, value, onValueChange, disabled }: SettingSwitchProps) => {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";

  const textColor = isLight ? "#0A3F33" : colors.text;
  const accentColor = isLight ? "#008F6B" : colors.accent;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        thumbColor={isLight ? "#fff" : "#f5f5f5"} 
        trackColor={{ false: "#d1d5db", true: accentColor }} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.03)",
  },
  label: {
    fontSize: 14,
    fontFamily: FontFamilies.body,
    fontWeight: "500",
  },
});