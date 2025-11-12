import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
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

interface ChatViewProps {
  selectedChat: any;
  messages: { id: string; text: string; sender: string }[];
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  onBack: () => void;
  onDeleteMessage: (id: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  selectedChat,
  messages,
  input,
  setInput,
  onSend,
  onBack,
  onDeleteMessage,
}) => {
  const { colors } = useThemeMode();

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
            onLongPress={() => onDeleteMessage(item.id)}
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
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingVertical: 10 }}
      />

      {/* --- Input --- */}
      <View style={styles.inputRow}>
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
