'use client';

import React, { useEffect, useRef } from 'react';
import { useConversation } from '@/hooks/useChat';
import { useSession } from 'next-auth/react';
import MessageItem from './MessageItem';
import { motion } from 'framer-motion';

interface MessageListProps {
  conversationId: string;
}

export default function MessageList({ conversationId }: MessageListProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  
  const { messages, isLoading, markRead, loadMore } = useConversation(conversationId);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      
      // Mark the most recent message as read
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.senderId !== currentUserId) {
        markRead(lastMessage.id);
      }
    }
  }, [isLoading, messages, markRead, currentUserId]);
  
  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    if (!loadMoreTriggerRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && messages.length > 0) {
          // Save current scroll position before loading more
          prevScrollHeightRef.current = containerRef.current?.scrollHeight || 0;
          
          // Load more messages
          loadMore();
        }
      },
      { threshold: 1.0 }
    );
    
    observer.observe(loadMoreTriggerRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, [isLoading, messages, loadMore]);
  
  // Maintain scroll position when loading older messages
  useEffect(() => {
    if (prevScrollHeightRef.current > 0 && containerRef.current) {
      const newScrollHeight = containerRef.current.scrollHeight;
      const scrollDifference = newScrollHeight - prevScrollHeightRef.current;
      containerRef.current.scrollTop = scrollDifference;
      prevScrollHeightRef.current = 0;
    }
  }, [messages]);
  
  // Group messages by date
  const groupedMessages = messages.reduce<{ date: string; messages: typeof messages }[]>(
    (groups, message) => {
      const date = new Date(message.createdAt).toLocaleDateString();
      
      if (!groups.length || groups[groups.length - 1].date !== date) {
        groups.push({ date, messages: [message] });
      } else {
        groups[groups.length - 1].messages.push(message);
      }
      
      return groups;
    },
    []
  );
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div 
      ref={containerRef}
      className="h-full overflow-y-auto p-4 flex flex-col"
    >
      {/* Load more trigger */}
      <div ref={loadMoreTriggerRef} className="h-1" />
      
      {/* Loading indicator for older messages */}
      {isLoading && messages.length > 0 && (
        <div className="flex justify-center py-2">
          <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
        </div>
      )}
      
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <p className="text-center">No messages yet. Send the first message!</p>
        </div>
      ) : (
        <>
          {groupedMessages.map((group, groupIndex) => (
            <div key={group.date} className="mb-4">
              {/* Date separator */}
              <div className="flex items-center justify-center mb-4">
                <div className="border-t border-gray-200 dark:border-gray-700 flex-grow"></div>
                <div className="px-3 text-xs text-gray-500 dark:text-gray-400">
                  {new Date(group.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 flex-grow"></div>
              </div>
              
              {/* Messages for this date */}
              {group.messages.map((message, messageIndex) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <MessageItem
                    message={message}
                    isOwn={message.senderId === currentUserId}
                    showAvatar={
                      messageIndex === 0 ||
                      group.messages[messageIndex - 1].senderId !== message.senderId
                    }
                    conversationId={conversationId}
                  />
                </motion.div>
              ))}
            </div>
          ))}
          
          {/* Element to scroll to */}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}