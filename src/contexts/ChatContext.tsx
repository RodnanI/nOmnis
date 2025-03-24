'use client';

import React, { createContext, useEffect, useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useSession } from 'next-auth/react';
import chatSocket from '@/lib/chat/socket';
import {
  ChatContextType,
  ChatState,
  Conversation,
  ConversationType,
  Message,
  User
} from '@/types/chat';

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
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Initialize chat socket when session is available
  useEffect(() => {
    if (session?.user?.id && status === 'authenticated') {
      chatSocket.initialize(session.user.id);

      return () => {
        chatSocket.disconnect();
      };
    }
  }, [session, status]);

  // Load conversations when session is available
  useEffect(() => {
    if (session?.user?.id && status === 'authenticated') {
      loadConversations();
    }
  }, [session, status]);

  // Set up socket event listeners
  useEffect(() => {
    if (!session?.user?.id) return;

    const onUserStatus = (data: { userId: string; status: 'online' | 'offline' }) => {
      setState(prevState => ({
        ...prevState,
        onlineUsers: {
          ...prevState.onlineUsers,
          [data.userId]: data.status === 'online'
        }
      }));
    };

    const onUserTyping = (data: { userId: string; conversationId: string; isTyping: boolean }) => {
      if (data.userId === session.user.id) return;

      setState(prevState => {
        const updatedTypingUsers = { ...prevState.typingUsers };
        
        if (!updatedTypingUsers[data.conversationId]) {
          updatedTypingUsers[data.conversationId] = [];
        }

        if (data.isTyping) {
          // Add user to typing list if not already there
          if (!updatedTypingUsers[data.conversationId].includes(data.userId)) {
            updatedTypingUsers[data.conversationId] = [
              ...updatedTypingUsers[data.conversationId],
              data.userId
            ];
          }
        } else {
          // Remove user from typing list
          updatedTypingUsers[data.conversationId] = updatedTypingUsers[data.conversationId].filter(
            id => id !== data.userId
          );
        }

        return {
          ...prevState,
          typingUsers: updatedTypingUsers
        };
      });
    };

    const onMessageReceived = (data: { message: Message }) => {
      const { message } = data;

      setState(prevState => {
        // Update messages for the conversation
        const updatedMessages = { ...prevState.messages };
        if (!updatedMessages[message.conversationId]) {
          updatedMessages[message.conversationId] = [];
        }
        
        // Don't add duplicate messages
        if (!updatedMessages[message.conversationId].some(m => m.id === message.id)) {
          updatedMessages[message.conversationId] = [
            ...updatedMessages[message.conversationId],
            message
          ];
        }

        // Update conversation list to reflect the new message
        const updatedConversations = prevState.conversations.map(conv => {
          if (conv.id === message.conversationId) {
            return {
              ...conv,
              lastMessage: message,
              lastMessageId: message.id,
              updatedAt: message.createdAt,
              // Increment unread count if this conversation isn't active
              unreadCount: 
                prevState.activeConversationId === message.conversationId 
                  ? 0 
                  : (conv.unreadCount || 0) + 1
            };
          }
          return conv;
        });

        // Sort conversations by most recent message
        updatedConversations.sort((a, b) => {
          const aDate = new Date(a.updatedAt);
          const bDate = new Date(b.updatedAt);
          return bDate.getTime() - aDate.getTime();
        });

        return {
          ...prevState,
          messages: updatedMessages,
          conversations: updatedConversations
        };
      });
    };

    const onMessageEdit = (data: { 
      messageId: string; 
      newContent: string;
      previousContent: string;
      updatedAt: string;
    }) => {
      setState(prevState => {
        const updatedMessages = { ...prevState.messages };
        
        // Find the conversation that contains this message
        let conversationId: string | null = null;
        
        // Look through all conversations' messages
        Object.entries(updatedMessages).forEach(([convId, messages]) => {
          const messageIndex = messages.findIndex(m => m.id === data.messageId);
          if (messageIndex !== -1) {
            conversationId = convId;
            // Update the message
            updatedMessages[convId] = [...messages];
            updatedMessages[convId][messageIndex] = {
              ...updatedMessages[convId][messageIndex],
              content: data.newContent,
              updatedAt: data.updatedAt,
              isEdited: true
            };
          }
        });

        // If we found and updated the message
        if (conversationId) {
          // Also update the last message in the conversation if needed
          const updatedConversations = prevState.conversations.map(conv => {
            if (conv.id === conversationId && conv.lastMessageId === data.messageId) {
              return {
                ...conv,
                lastMessage: conv.lastMessage ? {
                  ...conv.lastMessage,
                  content: data.newContent,
                  updatedAt: data.updatedAt,
                  isEdited: true
                } : null
              };
            }
            return conv;
          });

          return {
            ...prevState,
            messages: updatedMessages,
            conversations: updatedConversations
          };
        }

        return prevState;
      });
    };

    const onMessageRead = (data: { 
      userId: string; 
      messageId: string; 
      conversationId: string;
      readAt: string;
    }) => {
      setState(prevState => {
        const updatedMessages = { ...prevState.messages };
        
        // Update read receipts for the message
        if (updatedMessages[data.conversationId]) {
          const messageIndex = updatedMessages[data.conversationId].findIndex(
            m => m.id === data.messageId
          );
          
          if (messageIndex !== -1) {
            const message = updatedMessages[data.conversationId][messageIndex];
            const readBy = message.readBy || [];
            
            // Check if this user already has a read receipt
            const existingReceiptIndex = readBy.findIndex(r => r.userId === data.userId);
            
            if (existingReceiptIndex !== -1) {
              // Update existing receipt
              updatedMessages[data.conversationId][messageIndex].readBy = [
                ...readBy.slice(0, existingReceiptIndex),
                { messageId: data.messageId, userId: data.userId, readAt: data.readAt },
                ...readBy.slice(existingReceiptIndex + 1)
              ];
            } else {
              // Add new receipt
              updatedMessages[data.conversationId][messageIndex].readBy = [
                ...readBy,
                { messageId: data.messageId, userId: data.userId, readAt: data.readAt }
              ];
            }
          }
        }

        // If the reader is the current user, reset unread count for the conversation
        if (data.userId === session.user.id) {
          const updatedConversations = prevState.conversations.map(conv => {
            if (conv.id === data.conversationId) {
              return {
                ...conv,
                unreadCount: 0
              };
            }
            return conv;
          });

          return {
            ...prevState,
            messages: updatedMessages,
            conversations: updatedConversations
          };
        }

        return {
          ...prevState,
          messages: updatedMessages
        };
      });
    };

    const onConversationCreated = (data: { conversation: Conversation }) => {
      setState(prevState => {
        // Check if conversation already exists
        if (prevState.conversations.some(c => c.id === data.conversation.id)) {
          return prevState;
        }

        return {
          ...prevState,
          conversations: [data.conversation, ...prevState.conversations]
        };
      });
    };

    const onConversationUpdated = (data: { 
      conversationId: string; 
      updates: { name?: string; avatarUrl?: string; }
    }) => {
      setState(prevState => {
        const updatedConversations = prevState.conversations.map(conv => {
          if (conv.id === data.conversationId) {
            return {
              ...conv,
              ...(data.updates.name && { name: data.updates.name }),
              ...(data.updates.avatarUrl !== undefined && { avatarUrl: data.updates.avatarUrl })
            };
          }
          return conv;
        });

        return {
          ...prevState,
          conversations: updatedConversations
        };
      });
    };

    // Register event handlers
    const unsubscribers = [
      chatSocket.on('user:status', onUserStatus),
      chatSocket.on('user:typing', onUserTyping),
      chatSocket.on('message:received', onMessageReceived),
      chatSocket.on('message:edit', onMessageEdit),
      chatSocket.on('message:read', onMessageRead),
      chatSocket.on('conversation:created', onConversationCreated),
      chatSocket.on('conversation:updated', onConversationUpdated)
    ];

    // Clean up event handlers
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [session]);

  // Load conversations from API
  const loadConversations = async () => {
    setState(prevState => ({ ...prevState, isLoadingConversations: true }));

    try {
      const response = await fetch('/api/chat/conversations');
      const data = await response.json();

      if (data.conversations) {
        setState(prevState => ({ 
          ...prevState, 
          conversations: data.conversations,
          isLoadingConversations: false
        }));
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      setState(prevState => ({ ...prevState, isLoadingConversations: false }));
    }
  };

  // Load messages for a conversation
  const loadMessages = async (conversationId: string) => {
    setState(prevState => ({
      ...prevState,
      isLoadingMessages: {
        ...prevState.isLoadingMessages,
        [conversationId]: true
      }
    }));

    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`);
      const data = await response.json();

      if (data.messages) {
        setState(prevState => ({
          ...prevState,
          messages: {
            ...prevState.messages,
            [conversationId]: data.messages
          },
          isLoadingMessages: {
            ...prevState.isLoadingMessages,
            [conversationId]: false
          }
        }));

        // If this is the active conversation, mark messages as read
        if (state.activeConversationId === conversationId && data.messages.length > 0) {
          const lastMessage = data.messages[data.messages.length - 1];
          markAsRead(conversationId, lastMessage.id);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setState(prevState => ({
        ...prevState,
        isLoadingMessages: {
          ...prevState.isLoadingMessages,
          [conversationId]: false
        }
      }));
    }
  };

  // Load more messages (pagination)
  const loadMoreMessages = async (conversationId: string) => {
    const messages = state.messages[conversationId] || [];
    if (messages.length === 0) return;

    // Get the oldest message timestamp for pagination
    const oldestMessage = messages[0];
    
    setState(prevState => ({
      ...prevState,
      isLoadingMessages: {
        ...prevState.isLoadingMessages,
        [conversationId]: true
      }
    }));

    try {
      const response = await fetch(
        `/api/chat/conversations/${conversationId}/messages?before=${oldestMessage.createdAt}`
      );
      const data = await response.json();

      if (data.messages && data.messages.length > 0) {
        setState(prevState => ({
          ...prevState,
          messages: {
            ...prevState.messages,
            [conversationId]: [...data.messages, ...prevState.messages[conversationId]]
          },
          isLoadingMessages: {
            ...prevState.isLoadingMessages,
            [conversationId]: false
          }
        }));
      } else {
        setState(prevState => ({
          ...prevState,
          isLoadingMessages: {
            ...prevState.isLoadingMessages,
            [conversationId]: false
          }
        }));
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
      setState(prevState => ({
        ...prevState,
        isLoadingMessages: {
          ...prevState.isLoadingMessages,
          [conversationId]: false
        }
      }));
    }
  };

  // Set active conversation
  const setActiveConversation = useCallback((conversationId: string | null) => {
    setState(prevState => {
      // If we're switching away from a conversation, clear typing status
      if (prevState.activeConversationId && prevState.activeConversationId !== conversationId) {
        chatSocket.setTypingStatus(prevState.activeConversationId, false);
      }

      return {
        ...prevState,
        activeConversationId: conversationId
      };
    });

    // Join the conversation room if needed
    if (conversationId) {
      chatSocket.joinConversation(conversationId);
      
      // Load messages if not already loaded
      if (!state.messages[conversationId]) {
        loadMessages(conversationId);
      }
      
      // Find last message to mark as read
      const conversation = state.conversations.find(c => c.id === conversationId);
      if (conversation && conversation.lastMessageId) {
        markAsRead(conversationId, conversation.lastMessageId);
      }
    }
  }, [state.conversations, state.messages]);

  // Create a new conversation
  const createConversation = async (
    type: ConversationType,
    userIds: string[],
    name?: string
  ): Promise<string> => {
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          participantIds: userIds,
          name: name || null
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      if (data.conversation) {
        setState(prevState => ({
          ...prevState,
          conversations: [data.conversation, ...prevState.conversations]
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

    // Generate temporary ID for optimistic update
    const temporaryId = uuidv4();
    const now = new Date().toISOString();

    // Create temporary message for optimistic update
    const tempMessage: Message = {
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
        username: session.user.name || '',
        name: session.user.name || '',
        email: session.user.email || '',
        avatarUrl: session.user.image || null
      }
    };

    // Update UI optimistically
    setState(prevState => {
      const updatedMessages = { ...prevState.messages };
      if (!updatedMessages[conversationId]) {
        updatedMessages[conversationId] = [];
      }
      updatedMessages[conversationId] = [...updatedMessages[conversationId], tempMessage];

      // Update conversation with new message
      const updatedConversations = prevState.conversations.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            lastMessage: tempMessage,
            lastMessageId: temporaryId,
            updatedAt: now,
            unreadCount: 0 // Reset unread count for sender
          };
        }
        return conv;
      });

      // Move this conversation to the top
      updatedConversations.sort((a, b) => {
        const aDate = new Date(a.updatedAt);
        const bDate = new Date(b.updatedAt);
        return bDate.getTime() - aDate.getTime();
      });

      return {
        ...prevState,
        messages: updatedMessages,
        conversations: updatedConversations
      };
    });

    try {
      // Send message through socket
      const message = await chatSocket.sendMessage(conversationId, content, temporaryId, parentId);

      // Update temporary message with real message
      setState(prevState => {
        const updatedMessages = { ...prevState.messages };
        if (updatedMessages[conversationId]) {
          updatedMessages[conversationId] = updatedMessages[conversationId].map(msg => 
            msg.id === temporaryId ? message : msg
          );
        }

        // Update conversation with real message ID
        const updatedConversations = prevState.conversations.map(conv => {
          if (conv.id === conversationId && conv.lastMessageId === temporaryId) {
            return {
              ...conv,
              lastMessage: message,
              lastMessageId: message.id
            };
          }
          return conv;
        });

        return {
          ...prevState,
          messages: updatedMessages,
          conversations: updatedConversations
        };
      });
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove temporary message on error
      setState(prevState => {
        const updatedMessages = { ...prevState.messages };
        if (updatedMessages[conversationId]) {
          updatedMessages[conversationId] = updatedMessages[conversationId].filter(
            msg => msg.id !== temporaryId
          );
        }

        return {
          ...prevState,
          messages: updatedMessages
        };
      });
    }
  };

  // Edit a message
  const editMessage = async (messageId: string, newContent: string): Promise<void> => {
    if (!session?.user?.id) return;

    // Find the message
    let conversationId: string | null = null;
    let originalContent: string | null = null;

    // Search through all conversations to find the message
    Object.entries(state.messages).forEach(([convId, messages]) => {
      const message = messages.find(m => m.id === messageId);
      if (message) {
        conversationId = convId;
        originalContent = message.content;
      }
    });

    if (!conversationId || !originalContent) {
      throw new Error('Message not found');
    }

    // Optimistically update the UI
    setState(prevState => {
      const updatedMessages = { ...prevState.messages };
      
      if (updatedMessages[conversationId!]) {
        updatedMessages[conversationId!] = updatedMessages[conversationId!].map(msg => {
          if (msg.id === messageId) {
            return {
              ...msg,
              content: newContent,
              isEdited: true,
              updatedAt: new Date().toISOString()
            };
          }
          return msg;
        });
      }

      // Update conversation's last message if needed
      const updatedConversations = prevState.conversations.map(conv => {
        if (conv.id === conversationId && conv.lastMessageId === messageId) {
          return {
            ...conv,
            lastMessage: conv.lastMessage ? {
              ...conv.lastMessage,
              content: newContent,
              isEdited: true,
              updatedAt: new Date().toISOString()
            } : null
          };
        }
        return conv;
      });

      return {
        ...prevState,
        messages: updatedMessages,
        conversations: updatedConversations
      };
    });

    try {
      // Send edit through socket
      await chatSocket.editMessage(messageId, newContent);
    } catch (error) {
      console.error('Error editing message:', error);
      
      // Revert changes on error
      setState(prevState => {
        const updatedMessages = { ...prevState.messages };
        
        if (updatedMessages[conversationId!]) {
          updatedMessages[conversationId!] = updatedMessages[conversationId!].map(msg => {
            if (msg.id === messageId) {
              return {
                ...msg,
                content: originalContent!
              };
            }
            return msg;
          });
        }

        return {
          ...prevState,
          messages: updatedMessages
        };
      });
    }
  };

  // Mark message as read
  const markAsRead = async (conversationId: string, messageId: string): Promise<void> => {
    if (!session?.user?.id) return;

    // Update UI optimistically
    setState(prevState => {
      const updatedConversations = prevState.conversations.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            unreadCount: 0
          };
        }
        return conv;
      });

      return {
        ...prevState,
        conversations: updatedConversations
      };
    });

    try {
      // Send read receipt through socket
      chatSocket.markAsRead(conversationId, messageId);

      // Also update through API to ensure persistence
      await fetch(`/api/chat/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messageId })
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Mute or unmute a conversation
  const muteConversation = async (conversationId: string, mute: boolean): Promise<void> => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}/participants/${session?.user?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isMuted: mute })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      // Update state if successful
      setState(prevState => {
        const updatedConversations = prevState.conversations.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              participants: conv.participants?.map(p => {
                if (p.userId === session?.user?.id) {
                  return {
                    ...p,
                    isMuted: mute
                  };
                }
                return p;
              })
            };
          }
          return conv;
        });

        return {
          ...prevState,
          conversations: updatedConversations
        };
      });
    } catch (error) {
      console.error('Error updating mute status:', error);
      throw error;
    }
  };

  // Leave a conversation
  const leaveConversation = async (conversationId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      // Leave the conversation socket room
      chatSocket.leaveConversation(conversationId);

      // Remove from state if successful
      setState(prevState => {
        const updatedConversations = prevState.conversations.filter(
          conv => conv.id !== conversationId
        );

        // Clean up messages
        const updatedMessages = { ...prevState.messages };
        delete updatedMessages[conversationId];

        // Reset active conversation if needed
        const updatedActiveConversation = 
          prevState.activeConversationId === conversationId 
            ? null 
            : prevState.activeConversationId;

        return {
          ...prevState,
          conversations: updatedConversations,
          messages: updatedMessages,
          activeConversationId: updatedActiveConversation
        };
      });
    } catch (error) {
      console.error('Error leaving conversation:', error);
      throw error;
    }
  };

  // Search for users
  const searchUsers = async (query: string): Promise<User[]> => {
    try {
      const response = await fetch(`/api/chat/users/search?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      return data.users || [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  // Set typing status
  const setTypingStatus = (conversationId: string, isTyping: boolean): void => {
    if (!session?.user?.id) return;

    // Clear any existing timeout for this conversation
    if (typingTimeoutRef.current[conversationId]) {
      clearTimeout(typingTimeoutRef.current[conversationId]);
    }

    // Send typing status through socket
    chatSocket.setTypingStatus(conversationId, isTyping);

    // If typing, set a timeout to automatically clear typing status after 5 seconds
    if (isTyping) {
      typingTimeoutRef.current[conversationId] = setTimeout(() => {
        chatSocket.setTypingStatus(conversationId, false);
      }, 5000);
    }
  };

  // Combine state and methods for context value
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

  return <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>;
};