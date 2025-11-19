import { sendMessage } from '@/services/chat';
import type { Message } from '@/types/chat';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Props { conversationId: string; replyingTo?: Message | null; onCancelReply?: () => void; }

export function Composer({ conversationId, replyingTo, onCancelReply }: Props) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!text.trim()) return;
    setSending(true);
    try {
      await sendMessage(conversationId, { text: text || undefined, replyToMessageId: replyingTo?.id });
      setText('');
      onCancelReply?.();
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={styles.wrapper}>
      {replyingTo && (
        <View style={styles.replyBar}>
          <Text style={styles.replyText} numberOfLines={1}>Répondre à: {replyingTo.text || ''}</Text>
          <TouchableOpacity onPress={onCancelReply}><Text style={styles.cancel}>✕</Text></TouchableOpacity>
        </View>
      )}
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Message"
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity onPress={handleSend} style={[styles.sendBtn, sending && { opacity: 0.6 }]} disabled={sending}>
          <Text style={styles.sendText}>Envoyer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { padding: 10, borderTopWidth: 1, borderColor: '#173d33', backgroundColor: '#121d19' },
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  input: { flex: 1, minHeight: 40, maxHeight: 120, backgroundColor: '#0F3327', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, color: '#EAF7F2' },
  sendBtn: { marginLeft: 8, backgroundColor: '#19D07D', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  sendText: { color: '#0F3327', fontWeight: '700' },
  replyBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F3327', padding: 6, borderRadius: 8, marginBottom: 6 },
  replyText: { flex: 1, color: '#7DCAB0', fontSize: 12 },
  cancel: { marginLeft: 8, color: '#EBE6D3' },
  
});