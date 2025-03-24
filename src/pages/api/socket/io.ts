// src/pages/api/socket/io.ts
import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { initSocketServer } from '@/server/chat/socket/server';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Define a custom type for the response that includes the server
type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer;
  };
};

// Global SocketIO instance to prevent reinitialization on API route hot reloads
let socketIOInstance: SocketIOServer | null = null;

export default function handler(
  req: NextApiRequest,
  res: NextApiResponseWithSocket
) {
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS setup
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Initialize Socket.io if not already initialized
  if (!socketIOInstance) {
    // Get HTTP server instance
    const httpServer: NetServer = res.socket.server;
    socketIOInstance = initSocketServer(httpServer);
    
    // Store socket instance on the server object
    (res.socket.server as any).io = socketIOInstance;
  }

  res.status(200).json({
    success: true,
    message: 'Socket.io server is running',
  });
}