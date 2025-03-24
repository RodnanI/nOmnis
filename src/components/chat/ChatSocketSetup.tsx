'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import chatSocket from '@/lib/chat/socket';

export default function ChatSocketSetup() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Initialize socket connection when we have a logged-in user
    const initSocketConnection = async () => {
      if (status === 'authenticated' && session?.user?.id) {
        console.log('Initializing socket connection for user ID:', session.user.id);
        
        try {
          // Fetch to initialize the socket.io server if it's not already running
          await fetch('/api/socketio');
          
          // Initialize the socket client with the user ID
          chatSocket.initialize(session.user.id);
          
          console.log('Socket connection initialized successfully');
        } catch (error) {
          console.error('Failed to initialize socket connection:', error);
        }
      }
    };

    initSocketConnection();

    // Cleanup when the component unmounts
    return () => {
      if (status === 'authenticated') {
        chatSocket.disconnect();
      }
    };
  }, [session, status]);

  // This component doesn't render anything
  return null;
}