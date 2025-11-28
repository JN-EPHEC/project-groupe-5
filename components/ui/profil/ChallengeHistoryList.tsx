import { useChallenges } from '@/hooks/challenges-context';
import { useThemeMode } from '@/hooks/theme-context';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

export function ChallengeHistoryList() {
  const { colors } = useThemeMode();
  const { history } = useChallenges();

  if (history.length === 0) {
    return (
      <View style={[styles.card, { backgroundColor: colors.surface }]}> 
        <Text style={[styles.title, { color: colors.text }]}>Historique des défis</Text>
        <Text style={{ color: colors.mutedText, marginTop: 6 }}>Aucun défi validé pour le moment.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}> 
      <Text style={[styles.title, { color: colors.text }]}>Historique des défis</Text>
      {history.map((h) => {
        const dt = new Date(h.validatedAt);
        const dateLabel = dt.toLocaleDateString();
        const timeLabel = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return (
          <View key={h.id} style={[styles.entry, { backgroundColor: colors.surfaceAlt }]}> 
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{h.title}</Text>
              <Text style={{ color: colors.mutedText, fontSize: 12 }}>{dateLabel} • {timeLabel}</Text>
              {h.description ? (
                <Text style={{ color: colors.mutedText, marginTop: 4, fontSize: 12 }} numberOfLines={2}>{h.description}</Text>
              ) : null}
              <Text style={{ color: colors.accent, fontWeight: '600', marginTop: 4 }}>{h.points} pts</Text>
            </View>
            {h.photoUri ? (
              <Image source={{ uri: h.photoUri }} style={styles.photo} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 16, marginVertical: 10 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  entry: { flexDirection: 'row', padding: 12, borderRadius: 12, marginBottom: 10, alignItems: 'center', gap: 12 },
  photo: { width: 56, height: 56, borderRadius: 12, marginLeft: 8 },
});
