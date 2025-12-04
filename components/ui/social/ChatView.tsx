import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useMemo, useState } from "react";
import {
    Alert,
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

interface MessageItem {
  id: string;
  text?: string;
  imageUri?: string;
  type?: "text" | "image";
  sender: string;
  reactions?: string[];
}

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
  showBack?: boolean;
  onSendImage?: (uri: string) => void;
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
  showBack = true,
  onSendImage,
}) => {
  const { colors } = useThemeMode();
  const { user } = useUser();

  const [actionFor, setActionFor] = useState<string | null>(null);
  const [showReactionsFor, setShowReactionsFor] = useState<string | null>(null);
  const emojis = useMemo(() => ["👍", "😊", "🔥", "🎉", "❤️"], []);

  const currentUserName = useMemo(() => {
    if (!user) return "Moi";
    if (user.firstName || user.lastName) {
      return [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    }
    if (user.username) return user.username;
    return "Moi";
  }, [user]);

  const currentUserAvatar = user?.photoURL ?? null;
  const otherAvatar =
    selectedChat?.avatar || selectedChat?.photoUri || selectedChat?.photoURL || null;
  const otherName = selectedChat?.name || "Participant";

  const showNameAlert = (name: string) => {
    if (!name) return;
    Alert.alert(name);
  };

  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== "granted") return;
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (!res.canceled && res.assets?.[0]?.uri) {
        onSendImage && onSendImage(res.assets[0].uri);
      }
    } catch {}
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {showBack && (
        <>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.header, { color: colors.text }]}> 
            {selectedChat?.type === "club"
              ? `Salon ${selectedChat.name}`
              : `Chat avec ${selectedChat.name}`}
          </Text>
        </>
      )}

      {messages.length === 0 && (
        <Text style={[styles.empty, { color: colors.mutedText }]}>Commencez la discussion 🌿</Text>
      )}

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isMe = item.sender === "me";
          const avatarUri = isMe ? currentUserAvatar : otherAvatar;
          const displayName = isMe ? currentUserName : otherName;
          const initials = displayName ? displayName.charAt(0).toUpperCase() : "?";

          return (
            <View
              style={[styles.messageRow, { justifyContent: isMe ? "flex-end" : "flex-start" }]}
            >
              {!isMe && (
                <TouchableOpacity
                  onPress={() => showNameAlert(displayName)}
                  style={styles.avatarTouch}
                >
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatar} />
                  ) : (
                    <View
                      style={[
                        styles.avatar,
                        styles.avatarPlaceholder,
                        { backgroundColor: colors.pill },
                      ]}
                    >
                      <Text style={[styles.avatarInitial, { color: colors.text }]}>
                        {initials}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}

              <View style={styles.messageContent}>
                <TouchableOpacity
                  delayLongPress={500}
                  onLongPress={() => setActionFor(item.id)}
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      styles.message,
                      {
                        backgroundColor: isMe ? colors.accent : colors.surfaceAlt,
                        alignSelf: "flex-start",
                      },
                    ]}
                  >
                    {item.imageUri ? (
                      <Image
                        source={{ uri: item.imageUri }}
                        style={{ width: 180, height: 180, borderRadius: 10 }}
                      />
                    ) : (
                      <Text style={[styles.text, { color: colors.text }]}>{item.text}</Text>
                    )}
                    {item.reactions && item.reactions.length > 0 && (
                      <View style={styles.reactionsCorner}>
                        <Text style={{ fontSize: 12 }}>
                          {Array.from(new Set(item.reactions)).join(" ")}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                {actionFor === item.id && (
                  <View style={[styles.actionsRow, { backgroundColor: colors.surfaceAlt }]}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        setActionFor(null);
                        onDeleteMessage(item.id);
                      }}
                      style={styles.actionBtn}
                    >
                      <Ionicons name="trash" size={16} color={colors.text} />
                      <Text style={[styles.actionText, { color: colors.text }]}>Supprimer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setActionFor(null);
                        onStartEditMessage(item.id, item.text ?? "");
                      }}
                      style={styles.actionBtn}
                    >
                      <Ionicons name="create-outline" size={16} color={colors.text} />
                      <Text style={[styles.actionText, { color: colors.text }]}>Modifier</Text>
                    </TouchableOpacity>
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
                  <View style={[styles.emojiRow, { backgroundColor: colors.surface }]}
                  >
                    {emojis.map((emoji) => (
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
              </View>

              {isMe && (
                <TouchableOpacity
                  onPress={() => showNameAlert(displayName)}
                  style={styles.avatarTouch}
                >
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatar} />
                  ) : (
                    <View
                      style={[
                        styles.avatar,
                        styles.avatarPlaceholder,
                        { backgroundColor: colors.pill },
                      ]}
                    >
                      <Text style={[styles.avatarInitial, { color: colors.text }]}>
                        {initials}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        contentContainerStyle={{ paddingVertical: 10, paddingBottom: 72 }}
      />

      <View style={[styles.inputRow, { marginBottom: 110 }]}>
        <TouchableOpacity onPress={pickImage} style={[styles.attach, { backgroundColor: colors.surfaceAlt }]}>
          <Ionicons name="image-outline" size={20} color={colors.text} />
        </TouchableOpacity>
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
  container: { flex: 1, paddingTop: 8, paddingHorizontal: 12, paddingBottom: 0 },
  backBtn: { marginBottom: 10 },
  header: { fontSize: 18, fontWeight: "600", textAlign: "center", marginBottom: 10 },
  messageRow: { flexDirection: "row", alignItems: "flex-end", marginVertical: 6 },
  messageContent: { maxWidth: "78%" },
  message: { padding: 10, borderRadius: 12, marginVertical: 4, maxWidth: "100%" },
  text: { fontSize: 14 },
  reactionsCorner: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#FFFFFFCC",
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
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
    borderColor: "#1C2A27",
    paddingTop: 8,
  },
  input: { flex: 1, borderRadius: 20, padding: 10, fontSize: 14 },
  attach: { marginRight: 8, borderRadius: 20, padding: 10 },
  send: { marginLeft: 8, borderRadius: 20, padding: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarTouch: { marginHorizontal: 8 },
  avatarPlaceholder: { alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontWeight: "700" },
});
