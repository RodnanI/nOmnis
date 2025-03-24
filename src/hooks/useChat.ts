'use client';

import { useContext } from 'react';
import { ChatContext } from '@/contexts/ChatContext';
import { ChatContextType, Message, Conversation } from '@/app/types/chat';

/**
 * Custom hook to access chat context
 * @returns ChatContextType
 */
export function useChat(): ChatContextType {
  const context = useContext(ChatContext);
  
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  
  return context;
}

interface UseConversationResult {
  conversation: Conversation | undefined;
  messages: Message[];
  isLoading: boolean;
  typingUserIds: string[];
  send: (content: string, parentId?: string) => Promise<void>;
  edit: (messageId: string, newContent: string) => Promise<void>;
  markRead: (messageId: string) => Promise<void>;
  loadMore: () => Promise<void>;
  setTyping: (isTyping: boolean) => void;
}

/**
 * Custom hook for conversation-specific functionality
 * @param conversationId - The ID of the conversation
 * @returns Conversation specific functions and data
 */
export function useConversation(conversationId: string): UseConversationResult {
  const {
    messages,
    isLoadingMessages,
    sendMessage,
    editMessage,
    markAsRead,
    loadMoreMessages,
    setTypingStatus,
    typingUsers,
    conversations
  } = useChat();

  const conversation = conversations.find((c: Conversation) => c.id === conversationId);
  const conversationMessages = messages[conversationId] || [];
  const isLoading = isLoadingMessages[conversationId] || false;
  const typingUserIds = typingUsers[conversationId] || [];

  const send = (content: string, parentId?: string) => {
    return sendMessage(conversationId, content, parentId);
  };

  const edit = (messageId: string, newContent: string) => {
    return editMessage(messageId, newContent);
  };

  const markRead = (messageId: string) => {
    return markAsRead(conversationId, messageId);
  };

  const loadMore = () => {
    return loadMoreMessages(conversationId);
  };

  const setTyping = (isTyping: boolean) => {
    setTypingStatus(conversationId, isTyping);
  };

  return {
    conversation,
    messages: conversationMessages,
    isLoading,
    typingUserIds,
    send,
    edit,
    markRead,
    loadMore,
    setTyping
  };
}