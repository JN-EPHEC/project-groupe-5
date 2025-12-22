import { auth, db } from "@/firebaseConfig";
import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context";
import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, Unsubscribe } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
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
  View
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

const chatTheme = {
    myBubble: "#008F6B", 
    myText: "#FFFFFF",
    otherBubble: ["rgba(255, 255, 255, 0.8)", "rgba(255, 255, 255, 0.6)"] as const,
    otherText: "#0A3F33",
    inputBg: ["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"] as const,
    inputBorder: "rgba(255, 255, 255, 0.5)",
};

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
  const isLight = mode === "light";

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
        userName: currentUserName, // Utilise le nom calculé correctement
        photoURL: currentUserAvatar || "",
      });
      setInput("");
      // Ne pas dismiss le clavier ici pour permettre d'enchainer les messages
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

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingBottom: 0 }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      {showBack && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={isLight ? "#0A3F33" : colors.text} />
          </TouchableOpacity>
          <Text style={[styles.header, { color: isLight ? "#0A3F33" : colors.text }]}> 
            {selectedChat?.type === "club"
              ? `Salon ${selectedChat.name}`
              : `Chat avec ${selectedChat.name}`}
          </Text>
        </View>
      )}

      {messages.length === 0 && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="chatbubbles-outline" size={48} color={colors.mutedText} style={{ opacity: 0.5 }} />
            <Text style={[styles.empty, { color: colors.mutedText }]}>Commencez la discussion 🌿</Text>
        </View>
      )}

      <View style={{ flex: 1 }}> 
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          // ✅ FIX CLAVIER : "interactive" permet de le baisser en slidant
          keyboardDismissMode="interactive" 
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingVertical: 12, paddingBottom: 20 }}
          renderItem={({ item }) => {
            const isMe = item.userId === auth.currentUser?.uid;
            const avatarUri = isMe ? currentUserAvatar : item.photoURL || defaultOtherAvatar;
            const displayName = isMe ? currentUserName : item.userName || defaultOtherName;
            // ✅ FIX INITIALES : Gestion sécurisée
            const initials = (displayName && typeof displayName === 'string') 
                ? displayName.charAt(0).toUpperCase() 
                : "?";

            const BubbleComponent = (!isMe && isLight) ? LinearGradient : View;
            const bubbleProps = (!isMe && isLight)
                ? { colors: chatTheme.otherBubble, style: [styles.message, styles.otherBubbleLight] }
                : { style: [styles.message, { backgroundColor: isMe ? (isLight ? chatTheme.myBubble : colors.accent) : colors.surfaceAlt }] };

            const textColor = isMe 
                ? (isLight ? chatTheme.myText : "#000") 
                : (isLight ? chatTheme.otherText : colors.text);

            return (
              <View style={[styles.messageRow, { justifyContent: isMe ? "flex-end" : "flex-start" }]}>
                {!isMe && (
                  <TouchableOpacity onPress={() => Alert.alert(displayName)} style={styles.avatarTouch}>
                    {avatarUri ? (
                      <Image source={{ uri: avatarUri }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: isLight ? "#E0F7EF" : colors.pill }]}>
                        {/* ✅ FIX INITIALES : Couleur forcée pour être visible */}
                        <Text style={[styles.avatarInitial, { color: "#008F6B" }]}>{initials}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}

                <View style={styles.messageContent}>
                    <BubbleComponent {...(bubbleProps as any)}>
                        {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={{ width: 180, height: 180, borderRadius: 10 }} />
                        ) : (
                        <Text style={[styles.text, { color: textColor }]}>{item.text}</Text>
                        )}
                    </BubbleComponent>
                </View>
              </View>
            );
          }}
        />
      </View>

      <View style={{ paddingBottom: insets.bottom + 12, paddingHorizontal: 16, paddingTop: 8 }}>
        <LinearGradient
            colors={isLight ? ["rgba(255, 255, 255, 0.9)", "rgba(240, 253, 244, 0.9)"] : ["rgba(0, 151, 178, 0.2)", "rgba(0, 151, 178, 0.1)"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.inputRow, { borderColor: isLight ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 0.1)", borderWidth: 1 }]}
        >
            {onSendImage && (
            <TouchableOpacity onPress={pickImage} style={{ padding: 10 }}>
                <Ionicons name="image-outline" size={24} color={isLight ? "#008F6B" : colors.text} />
            </TouchableOpacity>
            )}
            <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Écrire un message..."
                placeholderTextColor={isLight ? "#6E8580" : colors.mutedText}
                style={[styles.input, { color: isLight ? "#0A3F33" : colors.text }]}
                multiline
            />
            <TouchableOpacity
                onPress={send}
                disabled={sending || !input.trim().length}
                style={[styles.send, { backgroundColor: sending || !input.trim().length ? (isLight ? "#E2E8F0" : colors.surfaceAlt) : "#008F6B" }]}
            >
                <Ionicons name="send" size={18} color="#FFF" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
        </LinearGradient>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: { marginRight: 10 },
  header: { fontSize: 18, fontWeight: "600" },
  messageRow: { flexDirection: "row", alignItems: "flex-end", marginVertical: 4, marginHorizontal: 12 },
  messageContent: { maxWidth: "75%" },
  message: { padding: 12, borderRadius: 18, marginBottom: 2 },
  otherBubbleLight: { borderWidth: 1, borderColor: "rgba(255,255,255,0.5)", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  text: { fontSize: 15, lineHeight: 20 },
  empty: { textAlign: "center", marginTop: 10, fontSize: 15, fontWeight: "600" },
  inputRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 6, paddingVertical: 6, borderRadius: 30, shadowColor: "#005c4b", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  input: { flex: 1, fontSize: 15, paddingHorizontal: 8, paddingVertical: 8, maxHeight: 100 },
  send: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  avatarTouch: { marginRight: 8, paddingBottom: 4 },
  avatarPlaceholder: { alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontWeight: "700", fontSize: 14 },
});