// src/app/types/chat.ts
export type ConversationType = 'dm' | 'group' | 'public';
export type UserStatus = 'online' | 'offline' | 'away' | 'busy';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  status?: UserStatus;
  lastActive?: string | null;
  isTypingIn?: string | null;
  typingUpdatedAt?: string | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  parentId: string | null;
  sender?: User;
  readBy?: ReadReceipt[];
  edits?: MessageEdit[];
}

export interface MessageEdit {
  id: string;
  messageId: string;
  previousContent: string;
  editedAt: string;
}

export interface ReadReceipt {
  messageId: string;
  userId: string;
  readAt: string;
  user?: User;
}

export interface Participant {
  conversationId: string;
  userId: string;
  joinedAt: string;
  leftAt: string | null;
  isActive: boolean;
  isMuted: boolean;
  lastReadMessageId: string | null;
  role: 'member' | 'admin';
  user?: User;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessageId: string | null;
  avatarUrl: string | null;
  participants?: Participant[];
  lastMessage?: Message | null;
  unreadCount?: number;
}

export interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoadingConversations: boolean;
  messages: Record<string, Message[]>;
  isLoadingMessages: Record<string, boolean>;
  onlineUsers: Record<string, boolean>;
  typingUsers: Record<string, string[]>;
}

export interface ChatContextType extends ChatState {
  createConversation: (type: ConversationType, userIds: string[], name?: string) => Promise<string>;
  sendMessage: (conversationId: string, content: string, parentId?: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  markAsRead: (conversationId: string, messageId: string) => Promise<void>;
  loadMoreMessages: (conversationId: string) => Promise<void>;
  setActiveConversation: (conversationId: string | null) => void;
  muteConversation: (conversationId: string, mute: boolean) => Promise<void>;
  leaveConversation: (conversationId: string) => Promise<void>;
  searchUsers: (query: string) => Promise<User[]>;
  setTypingStatus: (conversationId: string, isTyping: boolean) => void;
}