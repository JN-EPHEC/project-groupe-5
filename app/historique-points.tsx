import { usePoints } from '@/hooks/points-context';
import { useThemeMode } from '@/hooks/theme-context';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HistoriquePointsScreen() {
  const { transactions, points, totalEarned, totalSpent } = usePoints();
  const { colors } = useThemeMode();
  const router = useRouter();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 140 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ paddingVertical: 4, paddingHorizontal: 8 }}>
          <Text style={{ color: colors.accent, fontWeight: '600' }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Historique des points</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ color: colors.mutedText }}>Total actuel</Text>
        <Text style={{ color: colors.text, fontWeight: '700' }}>{points} pts</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ color: colors.mutedText }}>Total gagnés</Text>
        <Text style={{ color: colors.text }}>{totalEarned} pts</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
        <Text style={{ color: colors.mutedText }}>Total dépensés</Text>
        <Text style={{ color: colors.text }}>{totalSpent} pts</Text>
      </View>

      {transactions.length === 0 ? (
        <Text style={{ color: colors.mutedText }}>Aucune transaction pour le moment.</Text>
      ) : (
        transactions.map((tx) => (
          <View key={tx.id} style={{ backgroundColor: colors.surface, padding: 12, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '600' }}>{tx.source}</Text>
              <Text style={{ color: colors.mutedText, fontSize: 12 }}>{new Date(tx.timestamp).toLocaleString()}</Text>
            </View>
            <Text style={{ color: tx.type === 'earn' ? '#2ECC71' : '#E74C3C', fontWeight: '700' }}>
              {tx.type === 'earn' ? `+${tx.amount}` : `-${tx.amount}`} pts
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  title: { fontSize: 22, fontWeight: '700' },
});
