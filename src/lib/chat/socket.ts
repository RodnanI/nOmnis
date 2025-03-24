// src/lib/chat/socket.ts
import { io, Socket } from 'socket.io-client';
import { Message, User } from '@/app/types/chat';

class ChatSocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private eventHandlers: Record<string, Function[]> = {};

  initialize(userId: string): void {
    if (this.socket || !userId) return;

    this.userId = userId;
    
    // Connect to WebSocket server
    this.socket = io(window.location.origin, {
      path: '/api/socket',
      auth: {
        userId,
      },
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    // Set up default event listeners
    this.socket.on('connect', () => {
      console.log('Connected to chat server');
      this.emit('event', 'connect');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
      this.emit('event', 'disconnect');
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
      this.emit('event', 'error', error);
    });

    // Chat-specific events
    this.socket.on('user:status', (data: any) => {
      this.emit('event', 'user:status', data);
    });

    this.socket.on('user:typing', (data: any) => {
      this.emit('event', 'user:typing', data);
    });

    this.socket.on('message:received', (data: any) => {
      this.emit('event', 'message:received', data);
    });

    this.socket.on('message:edit', (data: any) => {
      this.emit('event', 'message:edit', data);
    });

    this.socket.on('message:read', (data: any) => {
      this.emit('event', 'message:read', data);
    });

    this.socket.on('conversation:created', (data: any) => {
      this.emit('event', 'conversation:created', data);
    });

    this.socket.on('conversation:updated', (data: any) => {
      this.emit('event', 'conversation:updated', data);
    });
  }

  disconnect(): void {
    if (!this.socket) return;
    this.socket.disconnect();
    this.socket = null;
    this.userId = null;
  }

  joinConversation(conversationId: string): void {
    if (!this.socket) return;
    this.socket.emit('conversation:join', { conversationId });
  }

  leaveConversation(conversationId: string): void {
    if (!this.socket) return;
    this.socket.emit('conversation:leave', { conversationId });
  }

  sendMessage(conversationId: string, content: string, temporaryId: string, parentId?: string): Promise<Message> {
    return new Promise<Message>((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit(
        'message:send',
        { conversationId, content, temporaryId, parentId },
        (response: any) => {
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response.message);
          }
        }
      );
    });
  }

  editMessage(messageId: string, newContent: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit(
        'message:edit',
        { messageId, newContent },
        (response: any) => {
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve();
          }
        }
      );
    });
  }

  markAsRead(conversationId: string, messageId: string): void {
    if (!this.socket) return;
    this.socket.emit('message:read', { conversationId, messageId });
  }

  setTypingStatus(conversationId: string, isTyping: boolean): void {
    if (!this.socket) return;
    this.socket.emit('user:typing', { conversationId, isTyping });
  }

  // Event handling system
  on(event: string, callback: Function): () => void {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    
    this.eventHandlers[event].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.eventHandlers[event] = this.eventHandlers[event].filter(
        (cb) => cb !== callback
      );
    };
  }

  private emit(eventType: string, event: string, data?: any): void {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach((callback) => {
        callback(data);
      });
    }
  }
}

// Create a singleton instance
const chatSocket = new ChatSocketService();
export default chatSocket;