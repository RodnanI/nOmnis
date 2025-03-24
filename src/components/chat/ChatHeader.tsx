'use client';

import React, { useState } from 'react';
import { Conversation } from '@/types/chat';
import { useSession } from 'next-auth/react';
import { Menu, X, Phone, Video, MoreVertical, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import OnlineIndicator from './OnlineIndicator';
import { motion, AnimatePresence } from 'framer-motion';
import TypingIndicator from './TypingIndicator';

interface ChatHeaderProps {
  conversation: Conversation;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export default function ChatHeader({
  conversation,
  onToggleSidebar,
  isSidebarOpen
}: ChatHeaderProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const [infoOpen, setInfoOpen] = useState(false);
  
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
  
  const getParticipantCount = () => {
    if (!conversation.participants) return 0;
    return conversation.participants.length;
  };
  
  const avatarUrl = getAvatarUrl();
  const displayName = getDisplayName();
  const participantCount = getParticipantCount();
  
  // Get the ID of the other user in a DM for typing indicator
  const getOtherUserId = () => {
    if (conversation.type === 'dm' && conversation.participants) {
      const otherUser = conversation.participants.find(p => p.userId !== currentUserId);
      return otherUser?.userId;
    }
    return null;
  };
  
  const otherUserId = getOtherUserId();
  
  return (
    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
      <div className="flex items-center">
        {/* Sidebar toggle button */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 mr-2 lg:hidden"
          aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {isSidebarOpen ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </button>
        
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
          {conversation.type === 'dm' && otherUserId && (
            <OnlineIndicator 
              userId={otherUserId}
              className="absolute right-0 bottom-0 border-2 border-white dark:border-gray-800"
            />
          )}
        </div>
        
        {/* Conversation Info */}
        <div className="ml-3">
          <h2 className="font-medium text-gray-900 dark:text-white flex items-center">
            {displayName}
            
            {conversation.type !== 'dm' && (
              <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                {participantCount} {participantCount === 1 ? 'member' : 'members'}
              </span>
            )}
          </h2>
          
          {/* Typing indicator or status */}
          <div className="text-sm text-gray-500 dark:text-gray-400 h-5">
            {conversation.type === 'dm' && otherUserId ? (
              <TypingIndicator conversationId={conversation.id} userId={otherUserId} />
            ) : (
              <span>
                {conversation.type === 'group' ? 'Group Chat' : 'Public Room'}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center space-x-1">
        {conversation.type === 'dm' && (
          <>
            <button
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Voice call"
            >
              <Phone className="h-5 w-5" />
            </button>
            <button
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Video call"
            >
              <Video className="h-5 w-5" />
            </button>
          </>
        )}
        
        {conversation.type !== 'dm' && (
          <button
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="View participants"
            onClick={() => setInfoOpen(!infoOpen)}
          >
            <Users className="h-5 w-5" />
          </button>
        )}
        
        <button
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="More options"
        >
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>
      
      {/* Conversation info panel */}
      <AnimatePresence>
        {infoOpen && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-800 shadow-lg z-20 overflow-y-auto"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-medium">Conversation Info</h3>
              <button
                onClick={() => setInfoOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Participants ({participantCount})
              </h4>
              
              <div className="space-y-2">
                {conversation.participants?.map(participant => (
                  <div key={participant.userId} className="flex items-center">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 overflow-hidden">
                        {participant.user?.avatarUrl ? (
                          <Image
                            src={participant.user.avatarUrl}
                            alt={participant.user.name}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                            {participant.user?.name.charAt(0).toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      
                      <OnlineIndicator 
                        userId={participant.userId}
                        size="sm"
                        className="absolute right-0 bottom-0 border-1 border-white dark:border-gray-800"
                      />
                    </div>
                    
                    <div className="ml-2">
                      <div className="text-sm font-medium">
                        {participant.user?.name || 'Unknown User'}
                        {participant.userId === currentUserId && ' (You)'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {participant.role === 'admin' ? 'Admin' : 'Member'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Overlay for mobile when info panel is open */}
      {infoOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
          onClick={() => setInfoOpen(false)}
        />
      )}
    </div>
  );
}