// src/classement/components/ClassementList.tsx
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
  const qualifiedUsers = users.filter((u) => u.qualified === true);
  const nonQualifiedUsers = users.filter((u) => !u.qualified);

  return (
    <View>
      {/* ✅ QUALIFIED SECTION */}
      {qualifiedUsers.length > 0 && (
        <>
          <View
            style={{
              alignSelf: "flex-start",
              marginBottom: 8,
              backgroundColor: "rgba(34,197,94,0.15)",
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Text style={{ color: "#22c55e", fontWeight: "800", fontSize: 12 }}>
              Qualifiés
            </Text>
          </View>

          {qualifiedUsers.map((u) => (
            <ClassementRow key={u.uid} user={u} />
          ))}
        </>
      )}

      {/* ❌ NON QUALIFIED SECTION */}
      {nonQualifiedUsers.length > 0 && (
        <>
          <View
            style={{
              alignSelf: "flex-start",
              marginTop: 16,
              marginBottom: 8,
              backgroundColor: "rgba(239,68,68,0.14)",
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Text style={{ color: "#ef4444", fontWeight: "800", fontSize: 12 }}>
              Non qualifiés
            </Text>
          </View>

          {nonQualifiedUsers.map((u) => (
            <ClassementRow key={u.uid} user={u} />
          ))}
        </>
      )}

      {/* Fake users if needed */}
      {Array.from({ length: totalSlots - users.length }).map((_, i) => (
        <FakeUserRow key={`fake-${i}`} rank={users.length + i + 1} />
      ))}
    </View>
  );
}
