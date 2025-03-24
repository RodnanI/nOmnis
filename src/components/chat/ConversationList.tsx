'use client';

import React from 'react';
import { Conversation } from '@/types/chat';
import ConversationItem from './ConversationItem';
import { motion } from 'framer-motion';

interface ConversationListProps {
  conversations: Conversation[];
  isLoading: boolean;
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
}

export default function ConversationList({
  conversations,
  isLoading,
  activeConversationId,
  onSelectConversation
}: ConversationListProps) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center text-gray-500 dark:text-gray-400">
        <p>No conversations yet</p>
        <p className="text-sm mt-1">Start a new chat to get going!</p>
      </div>
    );
  }

  return (
    <div className="p-2">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.05 }}
        className="space-y-1"
      >
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isActive={conversation.id === activeConversationId}
            onClick={() => onSelectConversation(conversation.id)}
          />
        ))}
      </motion.div>
    </div>
  );
}