import React from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

interface SettingSwitchProps {
  label: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}

export const SettingSwitch: React.FC<SettingSwitchProps> = ({ label, value, onValueChange }) => (
  <View style={styles.switchRow}>
    <Text style={styles.switchText}>{label}</Text>
    <Switch value={value} onValueChange={onValueChange} thumbColor="#19D07D" />
  </View>
);

const styles = StyleSheet.create({
  switchRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  switchText: { color: "#A1A1AA", fontSize: 14 },
});
