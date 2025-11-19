import { Composer } from '@/components/ui/chat/Composer';
import { MessageList } from '@/components/ui/chat/MessageList';
import { useThemeMode } from '@/hooks/theme-context';
import { listenTyping, setReadStatus, setTyping } from '@/services/chat';
import type { Message } from '@/types/chat';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = id as string;
  const { colors } = useThemeMode();
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [typingMap, setTypingMap] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!conversationId) return;    
    const unsubTyping = listenTyping(conversationId, setTypingMap);
    setReadStatus(conversationId);
    setMounted(true);
    return () => {
      unsubTyping();
      setTyping(conversationId, false);
    };
  }, [conversationId]);

  const handleReplySelect = useCallback((m: Message) => {
    setReplyingTo(m);
  }, []);

  if (!conversationId) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><Text style={{ color: colors.text }}>Conversation manquante</Text></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>      
      {!mounted ? (
        <View style={styles.center}><ActivityIndicator color={colors.accent} /></View>
      ) : (
        <MessageList conversationId={conversationId} onReplySelect={handleReplySelect} />
      )}
      <View style={styles.typingBar}>
        {Object.entries(typingMap).filter(([, v]) => v).length > 0 && (
          <Text style={{ color: colors.mutedText, fontSize: 12 }}>
            {Object.keys(typingMap).filter(uid => typingMap[uid]).join(', ')} écrit...
          </Text>
        )}
      </View>
      <Composer
        conversationId={conversationId}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  typingBar: { paddingHorizontal: 12, paddingBottom: 4 },
});