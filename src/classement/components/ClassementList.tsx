import { useThemeMode } from "@/hooks/theme-context"; // ✅ IMPORT CORRECT
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Text, View } from "react-native";
import { ClassementUser } from "../types/classement";
import { ClassementRow } from "./ClassementRow";
import { FakeUserRow } from "./FakeUserRow";

type Props = {
  users: ClassementUser[];
  totalSlots?: number;
};

export function ClassementList({ users, totalSlots = 50 }: Props) {
  // ✅ CORRECTION : Utilisation du hook de thème de l'app, pas celui du système
  const { mode } = useThemeMode();
  const isDarkMode = mode === "dark";

  const qualifiedUsers = users.filter((u) => u.qualified === true);
  const nonQualifiedUsers = users.filter((u) => !u.qualified);

  return (
    <View style={{ paddingBottom: 40 }}>
      {/* ✅ SECTION QUALIFIÉS */}
      {qualifiedUsers.length > 0 && (
        <>
          <LinearGradient
            colors={isDarkMode 
                ? ["rgba(34, 197, 94, 0.25)", "rgba(34, 197, 94, 0.05)"]
                : ["rgba(34, 197, 94, 0.15)", "rgba(34, 197, 94, 0.02)"]
            }
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{
              alignSelf: "flex-start",
              marginBottom: 14,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              borderWidth: 1,
              borderColor: "rgba(34, 197, 94, 0.4)"
            }}
          >
            <Ionicons name="checkmark-circle" size={14} color="#4ade80" />
            <Text style={{ color: "#4ade80", fontWeight: "800", fontSize: 13, letterSpacing: 0.5 }}>
              QUALIFIÉS
            </Text>
          </LinearGradient>

          {qualifiedUsers.map((u) => (
            <ClassementRow key={u.uid} user={u} isDarkMode={isDarkMode} />
          ))}
        </>
      )}

      {/* ❌ SECTION NON QUALIFIÉS */}
      {nonQualifiedUsers.length > 0 && (
        <>
          <LinearGradient
            colors={isDarkMode
                ? ["rgba(239, 68, 68, 0.25)", "rgba(239, 68, 68, 0.05)"]
                : ["rgba(239, 68, 68, 0.15)", "rgba(239, 68, 68, 0.02)"]
            }
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{
              alignSelf: "flex-start",
              marginTop: 24,
              marginBottom: 14,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              borderWidth: 1,
              borderColor: "rgba(239, 68, 68, 0.4)"
            }}
          >
            <Ionicons name="alert-circle" size={14} color="#f87171" />
            <Text style={{ color: "#f87171", fontWeight: "800", fontSize: 13, letterSpacing: 0.5 }}>
              NON QUALIFIÉS ({'<'} 7 Défis)
            </Text>
          </LinearGradient>

          {nonQualifiedUsers.map((u) => (
            <ClassementRow key={u.uid} user={u} isDarkMode={isDarkMode} />
          ))}
        </>
      )}

      {/* Fake users */}
      {Array.from({ length: totalSlots - users.length }).map((_, i) => (
        <FakeUserRow key={`fake-${i}`} rank={users.length + i + 1} />
      ))}
    </View>
  );
}