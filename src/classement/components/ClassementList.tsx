// src/classement/components/ClassementList.tsx
import React from "react";
import { View } from "react-native";
import { ClassementUser } from "../types/classement";
import { ClassementRow } from "./ClassementRow";
import { FakeUserRow } from "./FakeUserRow";

type Props = {
  users: ClassementUser[];
  totalSlots?: number;
};

export function ClassementList({ users, totalSlots = 50 }: Props) {
  return (
    <View>
      {users.map((u) => (
        <ClassementRow key={u.uid} user={u} />
      ))}

      {/* Fill remaining slots with fake users */}
      {Array.from({ length: totalSlots - users.length }).map((_, i) => (
        <FakeUserRow
          key={`fake-${i}`}
          rank={users.length + i + 1}
        />
      ))}
    </View>
  );
}
