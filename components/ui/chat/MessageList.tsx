import { deleteMessage, listenMessages, reactToMessage } from '@/services/chat';
import type { Message } from '@/types/chat';
import { formatTimestamp } from '@/utils/chatFormat';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props { conversationId: string; pageSize?: number; onReplySelect?: (m: Message) => void; }

export function MessageList({ conversationId, pageSize = 30, onReplySelect }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  useEffect(() => {
    const unsub = listenMessages(conversationId, pageSize, (msgs) => setMessages(msgs));
    return () => unsub();
  }, [conversationId, pageSize]);

  const renderItem = ({ item }: { item: Message }) => (
    <TouchableOpacity style={[styles.msg, item.deleted && styles.deleted]} onLongPress={() => onReplySelect?.(item)}>
      <View style={styles.header}>        
        <Text style={styles.sender}>{item.senderId}</Text>
        <Text style={styles.time}>{formatTimestamp(item.createdAt)}</Text>
      </View>
      {item.replyToMessageId && <Text style={styles.replyRef}>↪ Réponse à {item.replyToMessageId}</Text>}
      {/* Images supprimées: messages texte uniquement */}
      {!item.deleted ? (
        <Text style={styles.text}>{item.text}</Text>
      ) : (
        <Text style={styles.textMuted}>Message supprimé</Text>
      )}
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => reactToMessage(conversationId, item.id, '❤️')}><Text style={styles.action}>❤️</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => reactToMessage(conversationId, item.id, '👍')}><Text style={styles.action}>👍</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => deleteMessage(conversationId, item.id)}><Text style={styles.action}>🗑️</Text></TouchableOpacity>
      </View>
      {item.reactions && Object.keys(item.reactions).length > 0 && (
        <Text style={styles.reactions}>Réactions: {Object.values(item.reactions).join(' ')}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <FlatList data={messages} keyExtractor={m => m.id} renderItem={renderItem} contentContainerStyle={{ padding: 12 }} />
  );
}

const styles = StyleSheet.create({
  msg: { backgroundColor: '#0F3327', padding: 10, marginBottom: 10, borderRadius: 10 },
  deleted: { opacity: 0.5 },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  sender: { color: '#E6FFF5', fontWeight: '600' },
  time: { color: '#8AA39C', fontSize: 11 },
  replyRef: { color: '#7DCAB0', fontSize: 11, marginTop: 2 },
  text: { color: '#EAF7F2', marginTop: 4 },
  textMuted: { color: '#8AA39C', fontStyle: 'italic', marginTop: 4 },
  actions: { flexDirection: 'row', marginTop: 6 },
  action: { marginRight: 12 },
  reactions: { marginTop: 4, fontSize: 11, color: '#7DCAB0' },
});