'use client';

import React from 'react';
import { useChat } from '@/hooks/useChat';
import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  conversationId: string;
  userId?: string; // Optional, if you want to check a specific user
}

export default function TypingIndicator({ conversationId, userId }: TypingIndicatorProps) {
  const { typingUsers } = useChat();
  
  // Get the typing users for this conversation
  const typingUserIds = typingUsers[conversationId] || [];
  
  // If a specific user ID is provided, check if they are typing
  if (userId) {
    const isTyping = typingUserIds.includes(userId);
    
    if (!isTyping) {
      return null;
    }
    
    return (
      <div className="flex items-center text-blue-500">
        <span>Typing</span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: "easeInOut",
          }}
          className="ml-1"
        >
          ...
        </motion.span>
      </div>
    );
  }
  
  // If no specific user, show all typing users
  if (typingUserIds.length === 0) {
    return null;
  }
  
  return (
    <div className="flex items-center text-blue-500">
      <span>
        {typingUserIds.length === 1 
          ? 'Someone is typing' 
          : `${typingUserIds.length} people are typing`}
      </span>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: "easeInOut",
        }}
        className="ml-1"
      >
        ...
      </motion.span>
    </div>
  );
}