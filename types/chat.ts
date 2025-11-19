export type MemberRole = 'owner' | 'member';

export interface ConversationMember {
  uid: string;
  role: MemberRole;
  joinedAt: number;
  lastReadAt?: number;
  unreadCount?: number;
}

export type MessageType = 'text';

export interface MessageReactionMap {
  [uid: string]: string; // emoji e.g. '❤️'
}

export interface Message {
  id: string;
  senderId: string;
  type: MessageType;
  text?: string;
  createdAt: number;
  editedAt?: number;
  deleted?: boolean;
  replyToMessageId?: string;
  reactions?: MessageReactionMap;
}

export interface ConversationLastMessage {
  text?: string;
  senderId: string;
  createdAt: number;
  type: MessageType;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  title?: string;
  photoURL?: string;
  members: ConversationMember[];
  memberIds: string[]; // derived for querying
  lastMessage?: ConversationLastMessage;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor?: any; // Firestore DocumentSnapshot
}

export interface SendMessageOptions {
  text?: string;
  replyToMessageId?: string;
}