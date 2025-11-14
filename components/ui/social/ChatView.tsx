import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface MessageItem { id: string; text: string; sender: string; reactions?: string[] }

interface ChatViewProps {
  selectedChat: any;
  messages: MessageItem[];
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  onBack: () => void;
  onDeleteMessage: (id: string) => void;
  onStartEditMessage: (id: string, text: string) => void;
  onReactMessage: (id: string, emoji: string) => void;
  editingId?: string | null;
}

export const ChatView: React.FC<ChatViewProps> = ({
  selectedChat,
  messages,
  input,
  setInput,
  onSend,
  onBack,
  onDeleteMessage,
  onStartEditMessage,
  onReactMessage,
  editingId,
}) => {
  const { colors } = useThemeMode();
  const [actionFor, setActionFor] = useState<string | null>(null);
  const [showReactionsFor, setShowReactionsFor] = useState<string | null>(null);
  const emojis = useMemo(() => ["👍", "😊", "🔥", "🎉", "❤️"], []);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* --- Header --- */}
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.header, { color: colors.text }]}>
        {selectedChat?.type === "club"
          ? `Salon ${selectedChat.name}`
          : `Chat avec ${selectedChat.name}`}
      </Text>

      {/* --- Messages --- */}
      {messages.length === 0 && (
        <Text style={[styles.empty, { color: colors.mutedText }]}>
          Commencez la discussion 🌿
        </Text>
      )}

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            delayLongPress={500}
            onLongPress={() => setActionFor(item.id)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.message,
                {
                  backgroundColor:
                    item.sender === "me" ? colors.accent : colors.surfaceAlt,
                  alignSelf:
                    item.sender === "me" ? "flex-end" : "flex-start",
                },
              ]}
            >
              <Text style={[styles.text, { color: colors.text }]}>{item.text}</Text>
              {item.reactions && item.reactions.length > 0 && (
                <View style={styles.reactionsCorner}>
                  <Text style={{ fontSize: 12 }}>{Array.from(new Set(item.reactions)).join(" ")}</Text>
                </View>
              )}
            </View>
            {actionFor === item.id && (
              <View style={[styles.actionsRow, { backgroundColor: colors.surfaceAlt }]}>
                <TouchableOpacity onPress={() => { setActionFor(null); onDeleteMessage(item.id); }} style={styles.actionBtn}>
                  <Ionicons name="trash" size={16} color={colors.text} />
                  <Text style={[styles.actionText, { color: colors.text }]}>Supprimer</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setActionFor(null); onStartEditMessage(item.id, item.text); }} style={styles.actionBtn}>
                  <Ionicons name="create-outline" size={16} color={colors.text} />
                  <Text style={[styles.actionText, { color: colors.text }]}>Modifier</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setShowReactionsFor(item.id); }} style={styles.actionBtn}>
                  <Ionicons name="happy-outline" size={16} color={colors.text} />
                  <Text style={[styles.actionText, { color: colors.text }]}>Réagir</Text>
                </TouchableOpacity>
              </View>
            )}
            {showReactionsFor === item.id && (
              <View style={[styles.emojiRow, { backgroundColor: colors.surface }]}>
                {emojis.map((e) => (
                  <TouchableOpacity
                    key={e}
                    onPress={() => { onReactMessage(item.id, e); setShowReactionsFor(null); setActionFor(null); }}
                    style={styles.emojiBtn}
                  >
                    <Text style={{ fontSize: 18 }}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingVertical: 10, paddingBottom: 120 }}
      />

      {/* --- Input --- */}
      <View style={[styles.inputRow, { marginBottom: 90 }]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Écrire un message..."
          placeholderTextColor={colors.mutedText}
          style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
          multiline
        />
        <TouchableOpacity
          onPress={onSend}
          style={[styles.send, { backgroundColor: colors.accent }]}
        >
          <Ionicons name="send" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  backBtn: { marginBottom: 10 },
  header: { fontSize: 18, fontWeight: "600", textAlign: "center", marginBottom: 10 },
  message: { padding: 10, borderRadius: 12, marginVertical: 4, maxWidth: "80%" },
  text: { fontSize: 14 },
  reactionsCorner: { position: "absolute", top: -6, right: -6, backgroundColor: "#FFFFFFCC", borderRadius: 10, paddingHorizontal: 4, paddingVertical: 2 },
  actionsRow: { flexDirection: "row", alignItems: "center", borderRadius: 10, paddingVertical: 6, paddingHorizontal: 8, marginTop: 6, alignSelf: "flex-end" },
  actionBtn: { flexDirection: "row", alignItems: "center", marginHorizontal: 6 },
  actionText: { marginLeft: 4, fontSize: 12 },
  emojiRow: { flexDirection: "row", alignItems: "center", borderRadius: 10, padding: 6, marginTop: 6, alignSelf: "flex-end" },
  emojiBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  empty: { textAlign: "center", marginTop: 40 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#1C2A27",
    paddingTop: 8,
  },
  input: { flex: 1, borderRadius: 20, padding: 10, fontSize: 14 },
  send: { marginLeft: 8, borderRadius: 20, padding: 10 },
});
