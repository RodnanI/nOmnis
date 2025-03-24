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
  
  // Load conversations
  const loadConversations = async () => {
    setState((prev: ChatState) => ({ ...prev, isLoadingConversations: true }));
    
    try {
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
      const optimisticMessage: Message = {
        id: temporaryId,
        conversationId,
        senderId: session.user.id,
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isEdited: false,
        parentId: parentId || null,
        sender: {
          id: session.user.id,
          name: session.user.name || '',
          username: session.user.email || '',
          email: session.user.email || '',
          avatarUrl: session.user.image || null
        }
      };
      
      // Add message to state
      setState((prev: ChatState) => ({
        ...prev,
        messages: {
          ...prev.messages,
          [conversationId]: [
            ...(prev.messages[conversationId] || []),
            optimisticMessage
          ]
        }
      }));
      
      // Send to API
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parentId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const data = await response.json();
      
      // Replace optimistic message with real one
      setState((prev: ChatState) => ({
        ...prev,
        messages: {
          ...prev.messages,
          [conversationId]: prev.messages[conversationId].map(msg => 
            msg.id === temporaryId ? data.message : msg
          )
        }
      }));
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setState((prev: ChatState) => ({
        ...prev,
        messages: {
          ...prev.messages,
          [conversationId]: prev.messages[conversationId].filter(msg => msg.id !== temporaryId)
        }
      }));
    }
  };
  
  const editMessage = async (messageId: string, newContent: string): Promise<void> => {
    try {
      await chatSocket.editMessage(messageId, newContent);
      
      // Update message in state
      setState((prev: ChatState) => {
        const updatedMessages = { ...prev.messages };
        
        // Find the conversation that contains this message
        for (const conversationId in updatedMessages) {
          const index = updatedMessages[conversationId].findIndex(m => m.id === messageId);
          
          if (index !== -1) {
            // Update the message
            updatedMessages[conversationId] = [...updatedMessages[conversationId]];
            updatedMessages[conversationId][index] = {
              ...updatedMessages[conversationId][index],
              content: newContent,
              isEdited: true,
              updatedAt: new Date().toISOString()
            };
            break;
          }
        }
        
        return {
          ...prev,
          messages: updatedMessages
        };
      });
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  };
  
  const markAsRead = async (conversationId: string, messageId: string): Promise<void> => {
    try {
      await chatSocket.markAsRead(conversationId, messageId);
      
      // Update read status in state
      setState((prev: ChatState) => {
        // Update unread count for the conversation
        const updatedConversations = prev.conversations.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              unreadCount: 0
            };
          }
          return conv;
        });
        
        return {
          ...prev,
          conversations: updatedConversations
        };
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };
  
  const loadMoreMessages = async (conversationId: string): Promise<void> => {
    // Don't load if already loading
    if (state.isLoadingMessages[conversationId]) return;
    
    // Set loading state
    setState((prev: ChatState) => ({
      ...prev,
      isLoadingMessages: {
        ...prev.isLoadingMessages,
        [conversationId]: true
      }
    }));
    
    try {
      // Get oldest message ID for pagination
      const messages = state.messages[conversationId] || [];
      const oldestMessage = messages.length > 0 ? messages[0] : null;
      
      // Fetch earlier messages
      const query = oldestMessage ? `?before=${oldestMessage.id}` : '';
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages${query}`);
      
      if (!response.ok) {
        throw new Error('Failed to load messages');
      }
      
      const data = await response.json();
      
      if (data.messages && Array.isArray(data.messages)) {
        // Update state with new messages
        setState((prev: ChatState) => ({
          ...prev,
          messages: {
            ...prev.messages,
            [conversationId]: [
              ...data.messages,
              ...(prev.messages[conversationId] || [])
            ]
          },
          isLoadingMessages: {
            ...prev.isLoadingMessages,
            [conversationId]: false
          }
        }));
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
      
      // Reset loading state
      setState((prev: ChatState) => ({
        ...prev,
        isLoadingMessages: {
          ...prev.isLoadingMessages,
          [conversationId]: false
        }
      }));
    }
  };
  
  const setActiveConversation = useCallback((conversationId: string | null) => {
    setState((prev: ChatState) => ({ ...prev, activeConversationId: conversationId }));
    
    // If we have a conversation ID, join the socket room
    if (conversationId) {
      chatSocket.joinConversation(conversationId);
    }
  }, []);
  
  const muteConversation = async (conversationId: string, mute: boolean): Promise<void> => {
    try {
      // Call API to mute/unmute
      const response = await fetch(`/api/chat/conversations/${conversationId}/mute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mute })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update mute status');
      }
      
      // Update state
      setState((prev: ChatState) => {
        const updatedConversations = prev.conversations.map(conv => {
          if (conv.id === conversationId) {
            // Find current user in participants
            const updatedParticipants = conv.participants?.map(p => {
              if (session && p.userId === session.user.id) {
                return { ...p, isMuted: mute };
              }
              return p;
            });
            
            return {
              ...conv,
              participants: updatedParticipants
            };
          }
          return conv;
        });
        
        return {
          ...prev,
          conversations: updatedConversations
        };
      });
    } catch (error) {
      console.error('Error updating mute status:', error);
      throw error;
    }
  };
  
  const leaveConversation = async (conversationId: string): Promise<void> => {
    try {
      // Call API to leave conversation
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to leave conversation');
      }
      
      // Remove from state
      setState((prev: ChatState) => ({
        ...prev,
        conversations: prev.conversations.filter(conv => conv.id !== conversationId),
        activeConversationId: prev.activeConversationId === conversationId ? null : prev.activeConversationId
      }));
      
      // Leave socket room
      chatSocket.leaveConversation(conversationId);
    } catch (error) {
      console.error('Error leaving conversation:', error);
      throw error;
    }
  };
  
  const searchUsers = async (query: string): Promise<User[]> => {
    if (!session?.user?.id || query.trim().length < 2) return [];
    
    try {
      const response = await fetch(`/api/chat/users/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error('Failed to search users');
      }
      
      const data = await response.json();
      return data.users || [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };
  
  const setTypingStatus = (conversationId: string, isTyping: boolean): void => {
    chatSocket.setTypingStatus(conversationId, isTyping);
  };
  
  // Set up socket event listeners
  useEffect(() => {
    if (!chatSocket) return;
    
    // Handle user status changes
    const onUserStatus = (data: any) => {
      const { userId, status } = data;
      
      setState((prev: ChatState) => ({
        ...prev,
        onlineUsers: {
          ...prev.onlineUsers,
          [userId]: status === 'online'
        }
      }));
    };
    
    // Handle typing status changes
    const onUserTyping = (data: any) => {
      const { userId, conversationId, isTyping } = data;
      
      setState((prev: ChatState) => {
        const typingUsers = { ...prev.typingUsers };
        const currentTypingUsers = typingUsers[conversationId] || [];
        
        if (isTyping && !currentTypingUsers.includes(userId)) {
          // Add user to typing list
          typingUsers[conversationId] = [...currentTypingUsers, userId];
        } else if (!isTyping && currentTypingUsers.includes(userId)) {
          // Remove user from typing list
          typingUsers[conversationId] = currentTypingUsers.filter(id => id !== userId);
        }
        
        return {
          ...prev,
          typingUsers
        };
      });
    };
    
    // Handle new messages
    const onMessageReceived = (data: any) => {
      const { message } = data;
      
      if (!message || !message.conversationId) return;
      
      setState((prev: ChatState) => {
        // Check if we already have this message (to avoid duplicates)
        const existingMessages = prev.messages[message.conversationId] || [];
        const messageExists = existingMessages.some(m => m.id === message.id);
        
        if (messageExists) return prev;
        
        // Update conversations with last message
        const updatedConversations: Conversation[] = prev.conversations.map(conv => {
          if (conv.id === message.conversationId) {
            // Ensure all required fields for Conversation type
            const updatedConv: Conversation = {
              ...conv,
              lastMessage: {
                id: message.id,
                conversationId: message.conversationId,
                senderId: message.senderId,
                content: message.content,
                createdAt: message.createdAt,
                updatedAt: message.createdAt,
                isEdited: false,
                parentId: message.parentId || null,
                sender: message.sender
              },
              lastMessageId: message.id,
              updatedAt: message.createdAt,
              // Increment unread count if not the active conversation
              unreadCount: prev.activeConversationId !== message.conversationId ? 
                (conv.unreadCount || 0) + 1 : 0
            };
            return updatedConv;
          }
          return conv;
        });
        
        // Sort conversations to show most recent first
        updatedConversations.sort((a, b) => {
          const dateA = new Date(a.updatedAt);
          const dateB = new Date(b.updatedAt);
          return dateB.getTime() - dateA.getTime();
        });
        
        return {
          ...prev,
          conversations: updatedConversations,
          messages: {
            ...prev.messages,
            [message.conversationId]: [...existingMessages, message]
          }
        };
      });
    };
    
    // Handle message edits
    const onMessageEdit = (data: any) => {
      const { messageId, newContent, updatedAt } = data;
      
      setState((prev: ChatState) => {
        const updatedMessages = { ...prev.messages };
        let updatedConversations = [...prev.conversations];
        
        // Find the conversation that contains this message
        for (const conversationId in updatedMessages) {
          const index = updatedMessages[conversationId].findIndex(m => m.id === messageId);
          
          if (index !== -1) {
            // Update the message
            updatedMessages[conversationId] = [...updatedMessages[conversationId]];
            updatedMessages[conversationId][index] = {
              ...updatedMessages[conversationId][index],
              content: newContent,
              isEdited: true,
              updatedAt: updatedAt || new Date().toISOString()
            };
            
            // Update last message in conversation if needed
            updatedConversations = updatedConversations.map(conv => {
              if (conv.id === conversationId && conv.lastMessageId === messageId) {
                return {
                  ...conv,
                  lastMessage: {
                    ...conv.lastMessage!,
                    content: newContent,
                    isEdited: true,
                    updatedAt: updatedAt || new Date().toISOString()
                  }
                };
              }
              return conv;
            });
            
            return {
              ...prev,
              conversations: updatedConversations,
              messages: updatedMessages
            };
          }
        }
        
        return prev;
      });
    };
    
    // Handle read receipts
    const onMessageRead = (data: any) => {
      const { userId, messageId, conversationId, readAt } = data;
      
      setState((prev: ChatState) => {
        // If this is our current user reading, update unread count
        if (session?.user?.id === userId) {
          const updatedConversations = prev.conversations.map(conv => {
            if (conv.id === conversationId) {
              return { ...conv, unreadCount: 0 };
            }
            return conv;
          });
          
          return {
            ...prev,
            conversations: updatedConversations
          };
        }
        
        // If someone else is reading our message, update read receipts
        const conversationMessages = prev.messages[conversationId] || [];
        const updatedMessages = [...conversationMessages];
        
        const messageIndex = updatedMessages.findIndex(m => m.id === messageId);
        if (messageIndex !== -1) {
          const message = updatedMessages[messageIndex];
          const readBy = message.readBy || [];
          
          // Check if read receipt already exists
          const receiptExists = readBy.some(r => r.userId === userId);
          
          if (!receiptExists) {
            // Add new read receipt
            updatedMessages[messageIndex] = {
              ...message,
              readBy: [...readBy, { messageId, userId, readAt }]
            };
            
            return {
              ...prev,
              messages: {
                ...prev.messages,
                [conversationId]: updatedMessages
              }
            };
          }
        }
        
        return prev;
      });
    };
    
    // Subscribe to events
    const unsubscribeUserStatus = chatSocket.on('user:status', onUserStatus);
    const unsubscribeUserTyping = chatSocket.on('user:typing', onUserTyping);
    const unsubscribeMessageReceived = chatSocket.on('message:received', onMessageReceived);
    const unsubscribeMessageEdit = chatSocket.on('message:edit', onMessageEdit);
    const unsubscribeMessageRead = chatSocket.on('message:read', onMessageRead);
    
    // Clean up listeners
    return () => {
      unsubscribeUserStatus();
      unsubscribeUserTyping();
      unsubscribeMessageReceived();
      unsubscribeMessageEdit();
      unsubscribeMessageRead();
    };
  }, [session]);
  
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