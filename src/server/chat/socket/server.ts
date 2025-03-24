// src/server/chat/socket/server.ts
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { getToken } from 'next-auth/jwt';
import { updateUserStatus } from '../db/users';
import { getUserConversations } from '../db/conversations';
import { handleMessageSend, handleMessageEdit, handleMessageRead } from './handlers';
import { handleTypingStatus } from './handlers';

// In-memory store for connected users
const connectedUsers: Record<string, Set<string>> = {}; // userId -> Set of socketIds

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    path: '/api/socket',
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Socket middleware for authentication
  io.use(async (socket, next) => {
    try {
      const req = socket.request as any;
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

      if (!token || !token.sub) {
        return next(new Error('Unauthorized'));
      }

      // Attach user data to the socket
      socket.data.userId = token.sub;
      return next();
    } catch (error) {
      return next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.data.userId;
    
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
    const conversations = await getUserConversations(userId);
    for (const conversation of conversations) {
      socket.join(`conversation:${conversation.id}`);
    }

    // Join user's personal room
    socket.join(`user:${userId}`);

    console.log(`User ${userId} connected with socket ${socket.id}`);

    // Handle events
    socket.on('conversation:join', (data) => {
      socket.join(`conversation:${data.conversationId}`);
    });

    socket.on('conversation:leave', (data) => {
      socket.leave(`conversation:${data.conversationId}`);
    });

    socket.on('message:send', (data, callback) => {
      handleMessageSend(io, socket, data, callback);
    });

    socket.on('message:edit', (data, callback) => {
      handleMessageEdit(io, socket, data, callback);
    });

    socket.on('message:read', (data) => {
      handleMessageRead(io, socket, data);
    });

    socket.on('user:typing', (data) => {
      handleTypingStatus(io, socket, data);
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User ${userId} disconnected`);
      
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