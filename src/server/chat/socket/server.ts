// src/server/chat/socket/server.ts
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { getToken } from 'next-auth/jwt';
import { updateUserStatus, registerUser } from '../db/users';
import { getConversationParticipants } from '../db/conversations';
import { handleMessageSend, handleMessageEdit, handleMessageRead } from './handlers';
import { handleTypingStatus } from './handlers';
import { Conversation } from '@/app/types/chat';

// In-memory store for connected users
const connectedUsers: Record<string, Set<string>> = {}; // userId -> Set of socketIds

// Mock function for getUserConversations since it's not exported from db/conversations
async function getUserConversations(userId: string): Promise<Conversation[]> {
  // In a real app, this would fetch actual conversations for a user
  // For now, return an empty array of properly typed Conversation objects
  return [];
}

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    path: '/api/socketio',
    cors: {
      origin: '*', // In production, you'd want to restrict this
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'], // Allow both WebSocket and polling
  });

  console.log('Socket.io server initialized with path: /api/socketio');

  // Socket middleware for authentication
  io.use(async (socket, next) => {
    try {
      console.log('Socket authentication middleware running');
      const req = socket.request as any;
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

      if (!token || !token.sub) {
        console.log('Socket authentication failed: No token or user ID');
        return next(new Error('Unauthorized'));
      }

      console.log('Socket authenticated for user:', token.sub);
      
      // Attach user data to the socket
      socket.data.userId = token.sub;
      socket.data.name = token.name || '';
      socket.data.email = token.email || '';
      socket.data.image = token.picture || '';
      
      // Register or update this user in our user database
      // Convert null values to undefined where needed
      await registerUser({
        id: token.sub,
        name: token.name || undefined,
        email: token.email || undefined,
        image: token.picture || undefined,
        username: token.email || undefined
      });
      
      return next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      return next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.data.userId;
    console.log(`User ${userId} connected with socket ${socket.id}`);
    
    // Add user to connected users
    if (!connectedUsers[userId]) {
      connectedUsers[userId] = new Set();
    }
    connectedUsers[userId].add(socket.id);

    // Update user status to online
    await updateUserStatus(userId, 'online');
    
    // Broadcast user status to relevant clients
    io.emit('user:status', {
      userId,
      status: 'online',
      timestamp: new Date().toISOString()
    });

    // Join user's conversations automatically
    try {
      const conversations: Conversation[] = await getUserConversations(userId);
      for (const conversation of conversations) {
        if (conversation && conversation.id) {
          socket.join(`conversation:${conversation.id}`);
        }
      }
    } catch (error) {
      console.error('Error joining user conversations:', error);
    }

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Handle events
    socket.on('conversation:join', (data) => {
      socket.join(`conversation:${data.conversationId}`);
      console.log(`User ${userId} joined conversation: ${data.conversationId}`);
    });

    socket.on('conversation:leave', (data) => {
      socket.leave(`conversation:${data.conversationId}`);
      console.log(`User ${userId} left conversation: ${data.conversationId}`);
    });

    socket.on('message:send', (data, callback) => {
      console.log(`User ${userId} sending message to conversation: ${data.conversationId}`);
      handleMessageSend(io, socket, data, callback);
    });

    socket.on('message:edit', (data, callback) => {
      console.log(`User ${userId} editing message: ${data.messageId}`);
      handleMessageEdit(io, socket, data, callback);
    });

    socket.on('message:read', (data) => {
      console.log(`User ${userId} marking message as read: ${data.messageId}`);
      handleMessageRead(io, socket, data);
    });

    socket.on('user:typing', (data) => {
      console.log(`User ${userId} typing status in conversation ${data.conversationId}: ${data.isTyping}`);
      handleTypingStatus(io, socket, data);
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User ${userId} disconnected from socket ${socket.id}`);
      
      // Remove socket from connected users
      connectedUsers[userId]?.delete(socket.id);
      
      // If user has no more active connections, update status to offline
      if (!connectedUsers[userId]?.size) {
        await updateUserStatus(userId, 'offline');
        delete connectedUsers[userId];
        
        // Broadcast user status to relevant clients
        io.emit('user:status', {
          userId,
          status: 'offline',
          timestamp: new Date().toISOString()
        });
      }
    });
  });

  return io;
}

// Helper function to check if a user is online
export function isUserOnline(userId: string): boolean {
  return !!connectedUsers[userId]?.size;
}

// Helper function to get all online users
export function getOnlineUsers(): string[] {
  return Object.keys(connectedUsers);
}