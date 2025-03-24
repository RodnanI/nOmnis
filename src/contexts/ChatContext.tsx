'use client';

import React, { createContext, useState, useCallback, useEffect } from 'react';
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
import { v4 as uuidv4 } from 'uuid';

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

// Mock data for development
const mockUsers: User[] = [
  {
    id: 'user1',
    username: 'johndoe',
    name: 'John Doe',
    email: 'john@example.com',
    avatarUrl: null,
    status: 'online'
  },
  {
    id: 'user2',
    username: 'janedoe',
    name: 'Jane Doe',
    email: 'jane@example.com',
    avatarUrl: null,
    status: 'offline'
  }
];

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
  getAllUsers: async () => [],
  setTypingStatus: () => {}
});

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession();
  const [state, setState] = useState<ChatState>(initialState);
  
  // Initialize chat when session is available
  useEffect(() => {
    if (session?.user?.id && status === 'authenticated') {
      // Initialize socket connection (disabled for now)
      // chatSocket.initialize(session.user.id);
      
      // Load conversations
      loadConversations();
      
      return () => {
        // chatSocket.disconnect();
      };
    }
  }, [session, status]);
  
  // Load conversations
  const loadConversations = async () => {
    setState((prev: ChatState) => ({ ...prev, isLoadingConversations: true }));
    
    try {
      // MOCK: Instead of making a real API call, use mock data
      // const response = await fetch('/api/chat/conversations');
      // const data = await response.json();
      
      // Mock some conversations
      const mockConversations = [
        {
          id: 'conv1',
          type: 'dm' as ConversationType,
          name: 'John Doe',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastMessageId: null,
          avatarUrl: null,
          participants: [
            {
              userId: 'user1',
              conversationId: 'conv1',
              joinedAt: new Date().toISOString(),
              leftAt: null,
              isActive: true,
              isMuted: false,
              lastReadMessageId: null,
              role: 'member' as const,
              user: mockUsers[0]
            }
          ],
          lastMessage: null,
          unreadCount: 0
        },
        {
          id: 'conv2',
          type: 'public' as ConversationType,
          name: 'Public Chat',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastMessageId: null,
          avatarUrl: null,
          participants: mockUsers.map(user => ({
            userId: user.id,
            conversationId: 'conv2',
            joinedAt: new Date().toISOString(),
            leftAt: null,
            isActive: true,
            isMuted: false,
            lastReadMessageId: null,
            role: 'member' as const,
            user
          })),
          lastMessage: null,
          unreadCount: 0
        }
      ];
      
      setState((prev: ChatState) => ({
        ...prev,
        conversations: mockConversations,
        isLoadingConversations: false
      }));
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
      // MOCK: Instead of making a real API call, create a conversation locally
      // const response = await fetch('/api/chat/conversations', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ type, participantIds: userIds, name })
      // });
      
      // const data = await response.json();
      
      // Create a mock conversation
      const newConversationId = uuidv4();
      const newConversation: Conversation = {
        id: newConversationId,
        type,
        name: name || (type === 'dm' ? 'Direct Message' : 'Group Chat'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastMessageId: null,
        avatarUrl: null,
        participants: userIds.map(userId => ({
          userId,
          conversationId: newConversationId,
          joinedAt: new Date().toISOString(),
          leftAt: null,
          isActive: true,
          isMuted: false,
          lastReadMessageId: null,
          role: 'member' as const,
          user: mockUsers.find(u => u.id === userId) || {
            id: userId,
            username: 'user',
            name: 'User',
            email: 'user@example.com',
            avatarUrl: null
          }
        })),
        lastMessage: null,
        unreadCount: 0
      };
      
      // Add the current user as a participant if not already included
      if (session?.user?.id && !userIds.includes(session.user.id)) {
        newConversation.participants?.push({
          userId: session.user.id,
          conversationId: newConversationId,
          joinedAt: new Date().toISOString(),
          leftAt: null,
          isActive: true,
          isMuted: false,
          lastReadMessageId: null,
          role: 'admin' as const,
          user: {
            id: session.user.id,
            username: session.user.email || '',
            name: session.user.name || '',
            email: session.user.email || '',
            avatarUrl: session.user.image || null
          }
        });
      }
      
      setState((prev: ChatState) => ({
        ...prev,
        conversations: [newConversation, ...prev.conversations]
      }));
      
      return newConversationId;
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
    const temporaryId = uuidv4();
    const messageId = uuidv4();
    const now = new Date().toISOString();
    
    try {
      // Optimistic update
      const optimisticMessage: Message = {
        id: temporaryId,
        conversationId,
        senderId: session.user.id,
        content,
        createdAt: now,
        updatedAt: now,
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
      
      // MOCK: Instead of making a real API call, simulate a successful response
      // const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ content, parentId })
      // });
      
      // Simulate server response delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create permanent message
      const permanentMessage: Message = {
        ...optimisticMessage,
        id: messageId
      };
      
      // Replace optimistic message with permanent one
      setState((prev: ChatState) => {
        // Update messages
        const updatedMessages = {
          ...prev.messages,
          [conversationId]: prev.messages[conversationId].map(msg => 
            msg.id === temporaryId ? permanentMessage : msg
          )
        };
        
        // Update conversation with last message
        const updatedConversations = prev.conversations.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              lastMessage: permanentMessage,
              lastMessageId: messageId,
              updatedAt: now
            };
          }
          return conv;
        });
        
        return {
          ...prev,
          messages: updatedMessages,
          conversations: updatedConversations
        };
      });
      
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
      // MOCK: In a real app we'd call chatSocket.editMessage
      // await chatSocket.editMessage(messageId, newContent);
      
      // Update message in state (directly in this mock version)
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
      // MOCK: In a real app we'd call chatSocket.markAsRead
      // await chatSocket.markAsRead(conversationId, messageId);
      
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
      
      // MOCK: Instead of fetching from API, generate some mock messages
      // const query = oldestMessage ? `?before=${oldestMessage.id}` : '';
      // const response = await fetch(`/api/chat/conversations/${conversationId}/messages${query}`);
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock messages (older than existing ones)
      const oldestDate = messages.length > 0 
        ? new Date(messages[0].createdAt)
        : new Date();
        
      const mockMessages: Message[] = [];
      
      // Create 10 mock messages
      for (let i = 0; i < 10; i++) {
        const mockDate = new Date(oldestDate);
        mockDate.setMinutes(mockDate.getMinutes() - (i + 1) * 5); // 5 minute intervals
        
        mockMessages.push({
          id: uuidv4(),
          conversationId,
          senderId: mockUsers[i % 2].id, // Alternate senders
          content: `This is an older message #${i + 1}`,
          createdAt: mockDate.toISOString(),
          updatedAt: mockDate.toISOString(),
          isEdited: false,
          parentId: null,
          sender: mockUsers[i % 2]
        });
      }
      
      // Sort by date (oldest first)
      mockMessages.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      // Update state with new messages
      setState((prev: ChatState) => ({
        ...prev,
        messages: {
          ...prev.messages,
          [conversationId]: [
            ...mockMessages,
            ...(prev.messages[conversationId] || [])
          ]
        },
        isLoadingMessages: {
          ...prev.isLoadingMessages,
          [conversationId]: false
        }
      }));
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
    
    // If we have a conversation ID, join the socket room (disabled in mock version)
    if (conversationId) {
      // chatSocket.joinConversation(conversationId);
    }
  }, []);
  
  const muteConversation = async (conversationId: string, mute: boolean): Promise<void> => {
    try {
      // MOCK: In a real app we'd call an API
      // const response = await fetch(`/api/chat/conversations/${conversationId}/mute`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ mute })
      // });
      
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
      // MOCK: In a real app we'd call an API
      // const response = await fetch(`/api/chat/conversations/${conversationId}`, {
      //   method: 'DELETE'
      // });
      
      // Remove from state
      setState((prev: ChatState) => ({
        ...prev,
        conversations: prev.conversations.filter(conv => conv.id !== conversationId),
        activeConversationId: prev.activeConversationId === conversationId ? null : prev.activeConversationId
      }));
      
      // Leave socket room (disabled in mock version)
      // chatSocket.leaveConversation(conversationId);
    } catch (error) {
      console.error('Error leaving conversation:', error);
      throw error;
    }
  };
  
  const getAllUsers = async (): Promise<User[]> => {
    if (!session?.user?.id) return [];
    
    try {
      // MOCK: Return mock users instead of calling API
      // const response = await fetch('/api/chat/users');
      // const data = await response.json();
      
      // Add the current user to mock users if not already present
      const currentUser: User = {
        id: session.user.id,
        username: session.user.email || '',
        name: session.user.name || '',
        email: session.user.email || '',
        avatarUrl: session.user.image || null,
        status: 'online'
      };
      
      const allUsers = [...mockUsers];
      if (!allUsers.some(user => user.id === currentUser.id)) {
        allUsers.push(currentUser);
      }
      
      return allUsers.filter(user => user.id !== session.user.id); // Exclude current user
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  };
  
  const setTypingStatus = (conversationId: string, isTyping: boolean): void => {
    // MOCK: Disabled in mock version
    // chatSocket.setTypingStatus(conversationId, isTyping);
    
    // Update local state to simulate typing
    if (session?.user?.id) {
      setState((prev: ChatState) => {
        const typingUsers = { ...prev.typingUsers };
        const currentTypingUsers = typingUsers[conversationId] || [];
        
        if (isTyping && !currentTypingUsers.includes(session.user.id)) {
          typingUsers[conversationId] = [...currentTypingUsers, session.user.id];
        } else if (!isTyping && currentTypingUsers.includes(session.user.id)) {
          typingUsers[conversationId] = currentTypingUsers.filter(id => id !== session.user.id);
        }
        
        return {
          ...prev,
          typingUsers
        };
      });
    }
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
    getAllUsers,
    setTypingStatus
  };
  
  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};