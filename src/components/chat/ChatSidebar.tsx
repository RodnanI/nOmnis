'use client';

import React, { useState } from 'react';
import { useChat } from '@/hooks/useChat';
import ConversationList from './ConversationList';
import UserSearch from './UserSearch';
import { PlusCircle, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ConversationType } from '@/types/chat';
import NewConversation from './NewConversation';

interface ChatSidebarProps {
  onSelectConversation: (id: string) => void;
}

export default function ChatSidebar({ onSelectConversation }: ChatSidebarProps) {
  const { conversations, isLoadingConversations, activeConversationId } = useChat();
  
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);
  
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-800">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-lg">Conversations</h2>
          
          {!searchActive && (
            <div className="flex space-x-2">
              <button 
                onClick={() => setSearchActive(true)}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Search"
              >
                <Search className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
              
              <button 
                onClick={() => setNewChatOpen(true)}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="New Conversation"
              >
                <PlusCircle className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          )}
          
          {searchActive && (
            <div className="flex-1 ml-2 flex items-center">
              <input
                type="text"
                placeholder="Search..."
                className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button 
                onClick={() => {
                  setSearchActive(false);
                  setSearchQuery('');
                }}
                className="ml-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Conversation List or Search Results */}
      <div className="flex-1 overflow-y-auto">
        {searchActive && searchQuery.trim() ? (
          <UserSearch 
            query={searchQuery} 
            onSelectUser={(user) => {
              setSearchActive(false);
              setSearchQuery('');
              setNewChatOpen(true);
            }} 
          />
        ) : (
          <ConversationList 
            conversations={conversations}
            isLoading={isLoadingConversations}
            activeConversationId={activeConversationId}
            onSelectConversation={onSelectConversation}
          />
        )}
      </div>
      
      {/* New Conversation Modal */}
      <AnimatePresence>
        {newChatOpen && (
          <NewConversation 
            onClose={() => setNewChatOpen(false)} 
            onCreateSuccess={(conversationId) => {
              setNewChatOpen(false);
              onSelectConversation(conversationId);
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}