// src/pages/api/socket/index.ts
import { Server as HttpServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { initSocketServer } from '@/server/chat/socket/server';

// Global SocketIO instance
let socketIOInstance: SocketIOServer | null = null;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // We only want to handle the initial upgrade request
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method && req.method.toUpperCase() === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const httpServer: HttpServer = (res.socket as any)?.server;

  // Initialize Socket.io server if not already initialized
  if (!socketIOInstance && httpServer) {
    socketIOInstance = initSocketServer(httpServer);
  }

  // Send a simple response since the WebSocket connection happens separately
  res.status(200).json({ message: 'Socket server is running' });
}

// This tells Next.js to handle the request using Node.js
export const config = {
  api: {
    bodyParser: false,
  },
};