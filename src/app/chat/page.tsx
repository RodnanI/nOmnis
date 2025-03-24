'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import ChatContainer from '@/components/chat/ChatContainer';
import { motion } from 'framer-motion';

export default function ChatPage() {
  const { data: session, status } = useSession();
  
  // Handle loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!session) {
    redirect('/login');
  }
  
  return (
    <motion.div 
      className="container mx-auto px-4 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Chat</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Connect and communicate with friends and colleagues
        </p>
      </div>
      
      <ChatContainer />
    </motion.div>
  );
}