'use client';

import React, { createContext, useState, useCallback, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import chatSocket from '@/lib/chat/socket';
import {
  ChatContextType,
  ChatState,
  Conversation,
  ConversationType,
  Message,
  User
} from '@/app/types/chat';

// Initial state
const initialState: ChatState = {
  conversations: [],
  activeConversationId: null,
  isLoadingConversations: false,
  messages: {},
  isLoadingMessages: {},
  onlineUsers: {},
  typingUsers: {}
};

// Create context
export const ChatContext = createContext<ChatContextType>({
  ...initialState,
  createConversation: async () => '',
  sendMessage: async () => {},
  editMessage: async () => {},
  markAsRead: async () => {},
  loadMoreMessages: async () => {},
  setActiveConversation: () => {},
  muteConversation: async () => {},
  leaveConversation: async () => {},
  searchUsers: async () => [],
  setTypingStatus: () => {}
});

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession();
  const [state, setState] = useState<ChatState>(initialState);
  
  // Initialize chat when session is available
  useEffect(() => {
    if (session?.user?.id && status === 'authenticated') {
      // Initialize socket connection
      chatSocket.initialize(session.user.id);
      
      // Load conversations
      loadConversations();
      
      return () => {
        chatSocket.disconnect();
      };
    }
  }, [session, status]);
  
  // Mock function to load conversations - replace with actual API call
  const loadConversations = async () => {
    setState((prev: ChatState) => ({ ...prev, isLoadingConversations: true }));
    
    try {
      // Replace with actual API call
      const response = await fetch('/api/chat/conversations');
      const data = await response.json();
      
      if (data.conversations) {
        setState((prev: ChatState) => ({
          ...prev,
          conversations: data.conversations,
          isLoadingConversations: false
        }));
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      setState((prev: ChatState) => ({ ...prev, isLoadingConversations: false }));
    }
  };
  
  // Create a new conversation
  const createConversation = async (
    type: ConversationType,
    userIds: string[],
    name?: string
  ): Promise<string> => {
    try {
      // Replace with actual API call
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, participantIds: userIds, name })
      });
      
      const data = await response.json();
      
      if (data.conversation) {
        setState((prev: ChatState) => ({
          ...prev,
          conversations: [data.conversation, ...prev.conversations]
        }));
        
        return data.conversation.id;
      }
      
      throw new Error('Failed to create conversation');
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  };
  
  // Send a message
  const sendMessage = async (
    conversationId: string,
    content: string,
    parentId?: string
  ): Promise<void> => {
    if (!session?.user?.id) return;
    
    // Generate a temporary ID for optimistic updates
    const temporaryId = Math.random().toString(36).substring(2, 15);
    
    try {
      // Optimistic update
      // ... (implementation details omitted for brevity)
      
      // Actual API call would go here
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Revert optimistic update if needed
    }
  };
  
  // Other functions would be implemented similarly
  
  const editMessage = async (messageId: string, newContent: string): Promise<void> => {
    // Implementation
  };
  
  const markAsRead = async (conversationId: string, messageId: string): Promise<void> => {
    // Implementation
  };
  
  const loadMoreMessages = async (conversationId: string): Promise<void> => {
    // Implementation
  };
  
  const setActiveConversation = useCallback((conversationId: string | null) => {
    setState((prev: ChatState) => ({ ...prev, activeConversationId: conversationId }));
  }, []);
  
  const muteConversation = async (conversationId: string, mute: boolean): Promise<void> => {
    // Implementation
  };
  
  const leaveConversation = async (conversationId: string): Promise<void> => {
    // Implementation
  };
  
  const searchUsers = async (query: string): Promise<User[]> => {
    // Implementation
    return [];
  };
  
  const setTypingStatus = (conversationId: string, isTyping: boolean): void => {
    // Implementation
  };
  
  // Combine state and methods for context
  const contextValue: ChatContextType = {
    ...state,
    createConversation,
    sendMessage,
    editMessage,
    markAsRead,
    loadMoreMessages,
    setActiveConversation,
    muteConversation,
    leaveConversation,
    searchUsers,
    setTypingStatus
  };
  
  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};