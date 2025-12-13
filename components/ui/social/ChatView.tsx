import { auth, db } from "@/firebaseConfig";
import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context";
import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as ImagePicker from "expo-image-picker";
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, Unsubscribe } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    FlatList,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface MessageItem {
  id: string;
  text?: string;
  imageUrl?: string;
  userId?: string;
  userName?: string;
  photoURL?: string;
}

interface ChatViewProps {
  selectedChat: any;
  input: string;
  setInput: (v: string) => void;
  onBack: () => void;
  showBack?: boolean;
  onSendImage?: (uri: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  selectedChat,
  input,
  setInput,
  onBack,
  showBack = true,
  onSendImage,
}) => {
  const { colors, mode } = useThemeMode();
  const { user } = useUser();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [sending, setSending] = useState(false);
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const currentUserName = useMemo(() => {
    if (!user) return "Moi";
    if (user.firstName || user.lastName) {
      return [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    }
    if (user.username) return user.username;
    return "Moi";
  }, [user]);

  const currentUserAvatar = user?.photoURL ?? null;
  const defaultOtherAvatar = selectedChat?.avatar || selectedChat?.photoUri || selectedChat?.photoURL || null;
  const defaultOtherName = selectedChat?.name || "Participant";

  useEffect(() => {
    if (!selectedChat?.id) {
      setMessages([]);
      return;
    }

    let unsubscribe: Unsubscribe | undefined;

    try {
      const q = query(
        collection(db, "clubs", selectedChat.id, "messages"),
        orderBy("createdAt", "asc")
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        const mapped = snapshot.docs.map((doc) => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            text: data.text ?? "",
            imageUrl: data.imageUrl ?? data.imageUri ?? "",
            userId: data.userId,
            userName: data.userName ?? data.authorName,
            photoURL: data.photoURL ?? data.avatar,
          } as MessageItem;
        });
        setMessages(mapped);
      });
    } catch (error) {
      console.warn("[ChatView] unable to init messages listener", error);
      setMessages([]);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [selectedChat?.id]);

  const send = async () => {
    const uid = auth.currentUser?.uid;
    const clubId = selectedChat?.id;
    const text = input.trim();

    if (!clubId || !text || !uid || sending) {
      return;
    }

    setSending(true);

    try {
      await addDoc(collection(db, "clubs", clubId, "messages"), {
        text,
        createdAt: serverTimestamp(),
        userId: uid,
        userName:
          auth.currentUser?.displayName ||
          [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
          user?.username ||
          "Utilisateur",
        photoURL: auth.currentUser?.photoURL || user?.photoURL || "",
      });
      setInput("");
      Keyboard.dismiss();
    } catch (error) {
      console.error("[ChatView] send message failed", error);
    } finally {
      setSending(false);
    }
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

  const keyboardVerticalOffset = 120;
  const composerBaseHeight = 72;
  const listPaddingBottom = composerBaseHeight + tabBarHeight + insets.bottom + 8;
  const inputPaddingBottom = 20;
  const borderTone = mode === "light" ? "rgba(15,51,39,0.14)" : "rgba(255,255,255,0.08)";
  const chatSurfaceBackground = mode === "light" ? "rgba(255,255,255,0.9)" : "rgba(0, 151, 178, 0.1)";
  const composerBackground = "transparent";
  const inputBackground = mode === "light" ? "#ffffff" : "rgba(255,255,255,0.06)";

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background, paddingBottom: tabBarHeight }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={keyboardVerticalOffset}
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

      <View
        style={[
          styles.chatSurface,
          {
            backgroundColor: chatSurfaceBackground,
            borderColor: borderTone,
            marginBottom: tabBarHeight > 0 ? tabBarHeight * 0.3 : 12,
          },
        ]}
      > 
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
          const isMe = item.userId === auth.currentUser?.uid;
          const avatarUri = isMe ? currentUserAvatar : item.photoURL || defaultOtherAvatar;
          const displayName = isMe ? currentUserName : item.userName || defaultOtherName;
          const initials = displayName ? displayName.charAt(0).toUpperCase() : "?";

          return (
            <View
              style={[styles.messageRow, { justifyContent: isMe ? "flex-end" : "flex-start" }]}
            >
              {!isMe && (
                <TouchableOpacity onPress={() => Alert.alert(displayName)} style={styles.avatarTouch}>
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
                    {item.imageUrl ? (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={{ width: 180, height: 180, borderRadius: 10 }}
                      />
                    ) : (
                      <Text style={[styles.text, { color: colors.text }]}>{item.text}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              {isMe && (
                <TouchableOpacity onPress={() => Alert.alert(displayName)} style={styles.avatarTouch}>
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
          contentContainerStyle={{ paddingVertical: 12, paddingBottom: listPaddingBottom }}
          ListEmptyComponent={() => (
            <Text style={[styles.empty, { color: colors.mutedText }]}>Démarre la conversation avec ton club</Text>
          )}
          style={{ flex: 1 }}
        />
      </View>

      <View
        style={[
          styles.inputRow,
          {
            paddingBottom: inputPaddingBottom,
            borderColor: "transparent",
            backgroundColor: composerBackground,
          },
        ]}
      >
        {onSendImage ? (
          <TouchableOpacity
            onPress={pickImage}
            style={[styles.attach, { backgroundColor: colors.surfaceAlt }]}
          >
            <Ionicons name="image-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 0, height: 0 }} />
        )}
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Écrire un message..."
          placeholderTextColor={colors.mutedText}
          style={[styles.input, { backgroundColor: inputBackground, color: colors.text, borderColor: mode === "light" ? "rgba(15,51,39,0.1)" : "rgba(255,255,255,0.08)" }]}
          multiline
        />
        <TouchableOpacity
          onPress={() => Keyboard.dismiss()}
          style={styles.dismiss}
        >
          <Ionicons name="chevron-down" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={send}
          disabled={sending || !input.trim().length}
          style={[
            styles.send,
            {
              backgroundColor: sending || !input.trim().length ? colors.surfaceAlt : colors.accent,
            },
          ]}
        >
          <Ionicons
            name="send"
            size={20}
            color={sending || !input.trim().length ? colors.mutedText : colors.text}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 8, paddingHorizontal: 12 },
  backBtn: { marginBottom: 10 },
  header: { fontSize: 18, fontWeight: "600", textAlign: "center", marginBottom: 10 },
  messageRow: { flexDirection: "row", alignItems: "flex-end", marginVertical: 6 },
  messageContent: { maxWidth: "78%" },
  message: { padding: 10, borderRadius: 12, marginVertical: 4, maxWidth: "100%" },
  text: { fontSize: 14 },
  empty: { textAlign: "center", marginTop: 40, fontSize: 15, fontWeight: "600" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  input: { flex: 1, borderRadius: 20, padding: 10, fontSize: 14, borderWidth: StyleSheet.hairlineWidth },
  attach: { marginRight: 8, borderRadius: 20, padding: 10 },
  send: { marginLeft: 8, borderRadius: 20, padding: 10 },
  dismiss: { marginLeft: 8, padding: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarTouch: { marginHorizontal: 8 },
  avatarPlaceholder: { alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontWeight: "700" },
  chatSurface: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
    marginBottom: 12,
  },
});
