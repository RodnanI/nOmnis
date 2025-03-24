'use client';

import React from 'react';
import { Conversation } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';
import OnlineIndicator from './OnlineIndicator';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { MoreVertical } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export default function ConversationItem({
  conversation,
  isActive,
  onClick
}: ConversationItemProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  // Format the conversation for display
  const getDisplayName = () => {
    if (conversation.type === 'dm' && conversation.participants) {
      // Find the other user in the DM
      const otherUser = conversation.participants.find(p => p.userId !== currentUserId);
      return otherUser?.user?.name || 'Unknown User';
    }
    return conversation.name || 'Unnamed Conversation';
  };

  const getAvatarUrl = () => {
    if (conversation.type === 'dm' && conversation.participants) {
      // Find the other user in the DM
      const otherUser = conversation.participants.find(p => p.userId !== currentUserId);
      return otherUser?.user?.avatarUrl || null;
    }
    return conversation.avatarUrl;
  };

  const getLastMessagePreview = () => {
    if (!conversation.lastMessage) return 'No messages yet';
    
    // If current user is the sender, prefix with "You: "
    const isCurrentUserSender = conversation.lastMessage.senderId === currentUserId;
    const prefix = isCurrentUserSender ? 'You: ' : '';
    
    return `${prefix}${conversation.lastMessage.content}`;
  };

  const getTimeAgo = () => {
    if (!conversation.lastMessage) return '';
    return formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true });
  };

  const avatarUrl = getAvatarUrl();
  const displayName = getDisplayName();
  const lastMessagePreview = getLastMessagePreview();
  const timeAgo = getTimeAgo();
  const hasUnread = (conversation.unreadCount || 0) > 0;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`p-3 rounded-lg cursor-pointer transition-colors ${
        isActive 
          ? 'bg-blue-100 dark:bg-blue-900/30' 
          : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
      }`}
    >
      <div className="flex items-center">
        {/* Avatar */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 overflow-hidden">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          {/* Online indicator for DMs */}
          {conversation.type === 'dm' && conversation.participants && (
            <OnlineIndicator 
              userId={conversation.participants.find(p => p.userId !== currentUserId)?.userId || ''}
              className="absolute right-0 bottom-0 border-2 border-white dark:border-gray-800"
            />
          )}
        </div>
        
        {/* Content */}
        <div className="ml-3 flex-grow min-w-0">
          <div className="flex justify-between items-center">
            <h3 className={`font-medium truncate ${hasUnread ? 'font-semibold' : ''}`}>
              {displayName}
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
              {timeAgo}
            </span>
          </div>
          
          <div className="flex items-center">
            <p 
              className={`text-sm truncate ${
                hasUnread 
                  ? 'text-gray-900 dark:text-gray-100 font-medium' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {lastMessagePreview}
            </p>
            
            {/* Unread indicator */}
            {hasUnread && (
              <div className="ml-2 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
            )}
          </div>
        </div>
        
        {/* Actions button */}
        <button 
          className="p-1 ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation(); // Prevent conversation selection
            // Add conversation menu logic
          }}
        >
          <MoreVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>
    </motion.div>
  );
}