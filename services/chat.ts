import { auth } from '@/firebaseConfig';
import type { Conversation, ConversationMember, Message, SendMessageOptions } from '@/types/chat';
import { directConversationId } from '@/utils/chatFormat';
import { collection, doc, getDoc, getFirestore, limit, onSnapshot, orderBy, query, setDoc, startAfter, updateDoc, where } from 'firebase/firestore';

const db = getFirestore();

function now() { return Date.now(); }

export async function createConversation(otherUid: string): Promise<string> {
  const me = auth.currentUser?.uid;
  if (!me) throw new Error('Not authenticated');
  const id = directConversationId(me, otherUid);
  const ref = doc(db, 'conversations', id);
  const snap = await getDoc(ref);
  if (snap.exists()) return id;
  const members: ConversationMember[] = [
    { uid: me, role: 'owner', joinedAt: now(), lastReadAt: now(), unreadCount: 0 },
    { uid: otherUid, role: 'member', joinedAt: now(), unreadCount: 0 }
  ];
  await setDoc(ref, {
    id,
    type: 'direct',
    members,
    memberIds: members.map(m => m.uid),
    createdAt: now(),
    updatedAt: now(),
    createdBy: me
  });
  return id;
}

export async function createGroupConversation(title: string, memberUids: string[]): Promise<string> {
  const me = auth.currentUser?.uid;
  if (!me) throw new Error('Not authenticated');
  if (!memberUids.includes(me)) memberUids.push(me);
  const ref = doc(collection(db, 'conversations'));
  const members: ConversationMember[] = memberUids.map((uid, i) => ({
    uid,
    role: uid === me ? 'owner' : 'member',
    joinedAt: now(),
    lastReadAt: uid === me ? now() : undefined,
    unreadCount: 0
  }));
  await setDoc(ref, {
    id: ref.id,
    type: 'group',
    title,
    members,
    memberIds: members.map(m => m.uid),
    createdAt: now(),
    updatedAt: now(),
    createdBy: me
  });
  return ref.id;
}

export async function sendMessage(conversationId: string, options: SendMessageOptions): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  const convoRef = doc(db, 'conversations', conversationId);
  const messagesCol = collection(convoRef, 'messages');
  const messageRef = doc(messagesCol);
  const type: 'text' = 'text';

  const payload = {
    id: messageRef.id,
    senderId: uid,
    type,
    text: options.text || undefined,
    createdAt: Date.now(), // will be mirrored by serverTimestamp in security rules mapping
    replyToMessageId: options.replyToMessageId || undefined,
    reactions: {}
  } as Partial<Message>;

  await setDoc(messageRef, { ...payload, createdAt: Date.now() });
  // Update conversation metadata
  await updateDoc(convoRef, { lastMessage: { text: payload.text, senderId: uid, createdAt: Date.now(), type }, updatedAt: Date.now() });
  return messageRef.id;
}

export async function editMessage(conversationId: string, messageId: string, newText: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  const ref = doc(db, 'conversations', conversationId, 'messages', messageId);
  await updateDoc(ref, { text: newText, editedAt: Date.now() });
}

export async function deleteMessage(conversationId: string, messageId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  const ref = doc(db, 'conversations', conversationId, 'messages', messageId);
  await updateDoc(ref, { deleted: true });
}

export function listenMessages(conversationId: string, pageSize: number, onUpdate: (messages: Message[], cursor?: any) => void, cursor?: any) {
  const baseRef = collection(doc(db, 'conversations', conversationId), 'messages');
  let q = query(baseRef, orderBy('createdAt', 'desc'), limit(pageSize));
  if (cursor) q = query(baseRef, orderBy('createdAt', 'desc'), startAfter(cursor), limit(pageSize));
  return onSnapshot(q, (snap) => {
    const msgs: Message[] = snap.docs.map(d => d.data() as Message).sort((a,b) => a.createdAt - b.createdAt);
    const nextCursor = snap.docs[snap.docs.length - 1];
    onUpdate(msgs, nextCursor);
  });
}

export function listenConversations(onUpdate: (conversations: Conversation[]) => void) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  const convoCol = collection(db, 'conversations');
  const q = query(convoCol, where('memberIds', 'array-contains', uid), orderBy('updatedAt', 'desc'), limit(50));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map(d => d.data() as Conversation);
    onUpdate(items);
  });
}

export async function setTyping(conversationId: string, isTyping: boolean) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const ref = doc(db, 'conversations', conversationId, 'typing', uid);
  await setDoc(ref, { uid, isTyping, updatedAt: Date.now() }, { merge: true });
}

export function listenTyping(conversationId: string, cb: (map: Record<string, boolean>) => void) {
  const typingCol = collection(doc(db, 'conversations', conversationId), 'typing');
  return onSnapshot(typingCol, snap => {
    const state: Record<string, boolean> = {};
    snap.docs.forEach(d => { const data = d.data() as any; state[data.uid] = !!data.isTyping; });
    cb(state);
  });
}
export async function setReadStatus(conversationId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const convoRef = doc(db, 'conversations', conversationId);
  const snap = await getDoc(convoRef);
  if (!snap.exists()) return;
  const data = snap.data() as Conversation;
  const members = data.members.map(m => (
    m.uid === uid ? { ...m, lastReadAt: Date.now(), unreadCount: 0 } : m
  ));
  await updateDoc(convoRef, { members });
}

export async function reactToMessage(conversationId: string, messageId: string, emoji: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  const ref = doc(db, 'conversations', conversationId, 'messages', messageId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() as Message;
  const reactions = { ...(data.reactions || {}), [uid]: emoji };
  await updateDoc(ref, { reactions });
}

// Explicit re-exports to ensure TS picks them up in environments with incremental caching issues
// (re-export removed; function already exported above)
