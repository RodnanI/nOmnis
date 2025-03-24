// src/pages/api/socketio.ts
import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { Socket } from 'net';
import { initSocketServer } from '@/server/chat/socket/server';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Define custom interface for socket server
interface ServerWithIO extends NetServer {
  io?: SocketIOServer;
}

// We need to declare the custom server property on the socket
// This doesn't extend Socket, but augments the request type
interface CustomSocket extends Socket {
  server: ServerWithIO;
}

// Global SocketIO instance to prevent reinitialization on API route hot reloads
let io: SocketIOServer | null = null;

export default async function SocketHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Access response socket safely with type assertion
  const socket = res.socket as unknown as CustomSocket | null;
  
  if (!socket) {
    console.error("Socket not available on response object");
    res.status(500).end();
    return;
  }

  // Early return if socket is already initialized
  if (socket.server.io) {
    console.log('Socket is already initialized');
    res.end();
    return;
  }

  try {
    const httpServer: ServerWithIO = socket.server;
    io = initSocketServer(httpServer);
    httpServer.io = io;

    console.log('Socket server initialized successfully');
    res.end();
  } catch (error) {
    console.error('Error initializing socket server:', error);
    res.status(500).end();
  }
}