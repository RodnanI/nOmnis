'use client';

import React, { useState, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import ChatSidebar from './ChatSidebar';
import MessageList from './MessageList';
import MessageComposer from './MessageComposer';
import ChatHeader from './ChatHeader';
import EmptyState from './EmptyState';
import { motion } from 'framer-motion';

interface ChatContainerProps {
  initialConversationId?: string;
}

export default function ChatContainer({ initialConversationId }: ChatContainerProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  const { 
    activeConversationId, 
    conversations, 
    setActiveConversation 
  } = useChat();

  // Set initial conversation
  useEffect(() => {
    if (initialConversationId && !activeConversationId) {
      setActiveConversation(initialConversationId);
    }
  }, [initialConversationId, activeConversationId, setActiveConversation]);
  
  // Check if screen is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  // Get active conversation
  const activeConversation = activeConversationId 
    ? conversations.find(c => c.id === activeConversationId) 
    : null;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800">
      {/* Sidebar */}
      <motion.div 
        className={`${
          sidebarOpen ? 'w-80' : 'w-0'
        } border-r border-gray-200 dark:border-gray-800 flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out`}
        initial={{ width: isMobile ? 0 : 320 }}
        animate={{ width: sidebarOpen ? 320 : 0 }}
      >
        <ChatSidebar onSelectConversation={(id) => {
          setActiveConversation(id);
          if (isMobile) {
            setSidebarOpen(false);
          }
        }} />
      </motion.div>
      
      {/* Main chat area */}
      <div className="flex-grow flex flex-col h-full overflow-hidden">
        {activeConversation ? (
          <>
            <ChatHeader 
              conversation={activeConversation} 
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              isSidebarOpen={sidebarOpen}
            />
            
            <div className="flex-grow overflow-hidden relative">
              <MessageList conversationId={activeConversation.id} />
            </div>
            
            <div className="px-4 pb-4">
              <MessageComposer conversationId={activeConversation.id} />
            </div>
          </>
        ) : (
          <EmptyState onNewChat={() => setSidebarOpen(true)} />
        )}
      </div>
    </div>
  );
}