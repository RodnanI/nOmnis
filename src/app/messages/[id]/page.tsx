'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ChatContainer from '@/components/chat/ChatContainer';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface MessagePageProps {
  params: {
    id: string;
  };
}

export default function MessagePage({ params }: MessagePageProps) {
  const { data: session, status } = useSession();
  const conversationId = params.id;
  
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
      <div className="mb-6 flex items-center">
        <Link 
          href="/chat" 
          className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        
        <div>
          <h1 className="text-3xl font-bold">Conversation</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Viewing a specific conversation
          </p>
        </div>
      </div>
      
      <ChatContainer initialConversationId={conversationId} />
    </motion.div>
  );
}