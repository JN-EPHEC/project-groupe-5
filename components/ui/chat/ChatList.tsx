import { listenConversations } from '@/services/chat';
import type { Conversation } from '@/types/chat';
import { formatTimestamp } from '@/utils/chatFormat';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function ChatList() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const router = useRouter();
  useEffect(() => {
    const unsub = listenConversations(setConversations);
    return () => unsub();
  }, []);

  return (
    <FlatList
      data={conversations}
      keyExtractor={c => c.id}
      contentContainerStyle={{ padding: 12 }}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.item} onPress={() => router.push({ pathname: '/chat', params: { id: item.id } } as any)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.title || (item.type === 'direct' ? 'Conversation' : 'Groupe')}</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {item.lastMessage?.text || '—'}
            </Text>
          </View>
          <Text style={styles.time}>{item.lastMessage ? formatTimestamp(item.lastMessage.createdAt) : ''}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: '#121d19', marginBottom: 10 },
  title: { fontWeight: '600', color: '#E6FFF5' },
  subtitle: { color: '#8AA39C', marginTop: 4, fontSize: 12 },
  time: { color: '#7DCAB0', fontSize: 11, marginLeft: 8 }
});