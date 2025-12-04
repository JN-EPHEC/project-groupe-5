import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export interface MessageItem {
  id: string;
  sender: string;
  text?: string;
  imageUri?: string;
  type?: "text" | "image";
  reactions?: string[];
}

type SelectedChat = {
  id?: string;
  name?: string;
  username?: string;
  photoURL?: string;
  photoUri?: string;
  emoji?: string;
  type?: "ami" | "club" | string;
  desc?: string;
  city?: string;
  online?: boolean;
};

interface ChatViewProps {
  selectedChat: SelectedChat | null;
  messages: MessageItem[];
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  onSendImage: (uri: string) => void;
  onBack: () => void;
  onDeleteMessage: (id: string) => void;
  onStartEditMessage: (id: string, text: string) => void;
  onReactMessage: (id: string, emoji: string) => void;
  editingId: string | null;
  showBack?: boolean;
}

const EMOJIS = ["👍", "❤️", "🔥", "👏", "😊", "🌿"];

export const ChatView: React.FC<ChatViewProps> = ({
  selectedChat,
  messages,
  input,
  setInput,
  onSend,
  onSendImage,
  onBack,
  onDeleteMessage,
  onStartEditMessage,
  onReactMessage,
  editingId,
  showBack = true,
}) => {
  const { colors } = useThemeMode();
  const [actionFor, setActionFor] = useState<string | null>(null);
  const [showReactionsFor, setShowReactionsFor] = useState<string | null>(null);
  const isIOS = Platform.OS === "ios";

  const displayName = useMemo(() => {
    if (!selectedChat) return "Discussion";
    return (
      selectedChat.name ||
      selectedChat.username ||
      selectedChat.id ||
      "Discussion"
    );
  }, [selectedChat]);

  const subtitle = useMemo(() => {
    if (!selectedChat) return undefined;
    if (selectedChat.type === "ami") {
      return selectedChat.online ? "En ligne" : "Hors ligne";
    }
    if (selectedChat.type === "club") {
      return selectedChat.city || selectedChat.desc;
    }
    return undefined;
  }, [selectedChat]);

  const avatarUri = selectedChat?.photoURL || selectedChat?.photoUri || null;

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
      if (result.canceled) return;
      const uri = result.assets?.[0]?.uri;
      if (uri) {
        onSendImage(uri);
      }
    } catch (error) {
      console.warn("pickImage error", error);
    }
  };

  const renderMessage = ({ item }: { item: MessageItem }) => {
    const isMine = item.sender === "me";
    const bubbleColor = isMine ? colors.accent : colors.surfaceAlt;
    const textColor = isMine ? "#0F3327" : colors.text;

    return (
      <TouchableOpacity
        delayLongPress={500}
        onLongPress={() => setActionFor(item.id)}
        activeOpacity={0.8}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: isMine ? "flex-end" : "flex-start",
            marginVertical: 4,
          }}
        >
          {!isMine && (
            avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  marginRight: 6,
                  backgroundColor: "#222",
                }}
              />
            ) : (
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  marginRight: 6,
                  backgroundColor: colors.surfaceAlt,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text>{selectedChat?.emoji || "👤"}</Text>
              </View>
            )
          )}

          <View
            style={{
              maxWidth: "75%",
              backgroundColor: bubbleColor,
              padding: 10,
              borderRadius: 12,
            }}
          >
            {item.imageUri ? (
              <Image
                source={{ uri: item.imageUri }}
                style={{ width: 160, height: 160, borderRadius: 10 }}
              />
            ) : (
              <Text style={{ color: textColor, fontSize: 15 }}>{item.text}</Text>
            )}

            {item.reactions?.length ? (
              <View style={{ marginTop: 4 }}>
                <Text style={{ fontSize: 12 }}>
                  {Array.from(new Set(item.reactions)).join(" ")}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {actionFor === item.id && (
          <View
            style={[
              styles.actionsRow,
              { backgroundColor: colors.surfaceAlt },
            ]}
          >
            {isMine && (
              <>
                <TouchableOpacity
                  onPress={() => {
                    setActionFor(null);
                    onDeleteMessage(item.id);
                  }}
                  style={styles.actionBtn}
                >
                  <Ionicons name="trash" size={16} color={colors.text} />
                  <Text
                    style={[styles.actionText, { color: colors.text }]}
                  >
                    Supprimer
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setActionFor(null);
                    onStartEditMessage(item.id, item.text ?? "");
                  }}
                  style={styles.actionBtn}
                >
                  <Ionicons name="create-outline" size={16} color={colors.text} />
                  <Text
                    style={[styles.actionText, { color: colors.text }]}
                  >
                    Modifier
                  </Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              onPress={() => {
                setShowReactionsFor(item.id);
              }}
              style={styles.actionBtn}
            >
              <Ionicons name="happy-outline" size={16} color={colors.text} />
              <Text style={[styles.actionText, { color: colors.text }]}>Réagir</Text>
            </TouchableOpacity>
          </View>
        )}
        {showReactionsFor === item.id && (
          <View
            style={[
              styles.emojiRow,
              { backgroundColor: colors.surface },
            ]}
          >
            {EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                onPress={() => {
                  onReactMessage(item.id, emoji);
                  setShowReactionsFor(null);
                  setActionFor(null);
                }}
                style={styles.emojiBtn}
              >
                <Text style={{ fontSize: 18 }}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={isIOS ? "padding" : undefined}
      keyboardVerticalOffset={isIOS ? 88 : 0}
    >
      <View style={{ marginBottom: 12 }}>
        {showBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
        )}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceAlt }}
            />
          ) : (
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.surfaceAlt,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 24 }}>{selectedChat?.emoji || "💬"}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.header, { color: colors.text }]}>{displayName}</Text>
            {subtitle ? (
              <Text style={{ color: colors.mutedText, fontSize: 12 }}>{subtitle}</Text>
            ) : null}
          </View>
          {editingId && (
            <View style={{ backgroundColor: colors.surfaceAlt, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }}>
              <Text style={{ color: colors.text, fontSize: 12 }}>Modification...</Text>
            </View>
          )}
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ paddingVertical: 10, paddingBottom: 72 }}
        ListEmptyComponent={() => (
          <Text style={[styles.empty, { color: colors.mutedText }]}>
            Commencez la discussion 🌿
          </Text>
        )}
      />

      <View style={[styles.inputRow, { borderColor: colors.surfaceAlt }]}>
        <TouchableOpacity
          onPress={pickImage}
          style={[styles.attach, { backgroundColor: colors.surfaceAlt }]}
        >
          <Ionicons name="image-outline" size={20} color={colors.text} />
        </TouchableOpacity>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Écrire un message..."
          placeholderTextColor={colors.mutedText}
          style={[
            styles.input,
            { backgroundColor: colors.surfaceAlt, color: colors.text },
          ]}
          multiline
        />
        <TouchableOpacity
          onPress={onSend}
          style={[styles.send, { backgroundColor: colors.accent }]}
          disabled={!input.trim()}
        >
          <Ionicons name="send" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  backBtn: { marginBottom: 10 },
  header: { fontSize: 18, fontWeight: "600" },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 6,
    alignSelf: "flex-end",
  },
  actionBtn: { flexDirection: "row", alignItems: "center", marginHorizontal: 6 },
  actionText: { marginLeft: 4, fontSize: 12 },
  emojiRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    padding: 6,
    marginTop: 6,
    alignSelf: "flex-end",
  },
  emojiBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  empty: { textAlign: "center", marginTop: 40 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 8,
  },
  input: { flex: 1, borderRadius: 20, padding: 10, fontSize: 14 },
  attach: { marginRight: 8, borderRadius: 20, padding: 10 },
  send: { marginLeft: 8, borderRadius: 20, padding: 10 },
});
