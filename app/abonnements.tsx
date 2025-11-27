import { useSubscriptions } from '@/hooks/subscriptions-context';
import { useThemeMode } from '@/hooks/theme-context';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AbonnementsScreen() {
  const { colors } = useThemeMode();
  const { followers, following, unfollow, removeFollower } = useSubscriptions();
  const [tab, setTab] = useState<'followers'|'following'>('followers');
  const router = useRouter();

  const list = tab === 'followers' ? followers : following;
  const isFollowers = tab === 'followers';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 8 }}>
          <Text style={{ color: colors.accent, fontWeight: '700' }}>{'←'}</Text>
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>Abonnements</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        <TabBtn label={`Abonnés (${followers.length})`} active={isFollowers} onPress={() => setTab('followers')} colors={colors} />
        <TabBtn label={`Abonnements (${following.length})`} active={!isFollowers} onPress={() => setTab('following')} colors={colors} />
      </View>

      {list.length === 0 ? (
        <Text style={{ color: colors.mutedText }}>Aucun {isFollowers ? 'abonné' : 'abonnement'}.</Text>
      ) : (
        list.map((u) => (
          <View key={u.id} style={[styles.row, { backgroundColor: colors.surface }]}> 
            {u.avatar ? (
              <Image source={{ uri: u.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.surfaceAlt }]} />
            )}
            <Text style={{ color: colors.text, fontWeight: '600', flex: 1 }}>{u.name}</Text>
            <TouchableOpacity
              onPress={() => (isFollowers ? removeFollower(u.id) : unfollow(u.id))}
              style={{ backgroundColor: '#2A3431', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 }}
            >
              <Text style={{ color: colors.mutedText, fontWeight: '600' }}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function TabBtn({ label, active, onPress, colors }: any) {
  return (
    <Text onPress={onPress} style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20, backgroundColor: active ? colors.accent : colors.surface, color: active ? '#0F3327' : colors.mutedText, fontWeight: '700' }}>{label}</Text>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
});
