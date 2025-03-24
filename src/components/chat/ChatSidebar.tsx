'use client';

import React, { useState, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import ConversationList from './ConversationList';
import UserSearch from './UserSearch';
import { PlusCircle, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NewConversation from './NewConversation';

interface ChatSidebarProps {
  onSelectConversation: (id: string) => void;
}

export default function ChatSidebar({ onSelectConversation }: ChatSidebarProps) {
  const { conversations, isLoadingConversations, activeConversationId, searchUsers } = useChat();
  
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Auto-search as user types (if query is long enough)
    if (query.trim().length >= 2) {
      performSearch(query);
    } else {
      setSearchResults([]);
    }
  };
  
  // Perform the actual search
  const performSearch = async (query: string) => {
    if (query.trim().length < 2) return;
    
    setIsSearching(true);
    try {
      const results = await searchUsers(query);
      setSearchResults(results);
    } catch (err) {
      console.error('Error searching users:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle search icon click
  const handleSearchClick = () => {
    setSearchActive(true);
  };
  
  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };
  
  // Handle user selection from search results
  const handleSelectUser = (user: any) => {
    setSearchActive(false);
    setSearchQuery('');
    setSearchResults([]);
    setNewChatOpen(true);
    // You might want to pre-select this user in the new chat dialog
  };
  
  // Close search
  const handleCloseSearch = () => {
    setSearchActive(false);
    setSearchQuery('');
    setSearchResults([]);
  };
  
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-800">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-lg">Conversations</h2>
          
          {!searchActive && (
            <div className="flex space-x-2">
              <button 
                onClick={handleSearchClick}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                aria-label="Search"
              >
                <Search className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
              
              <button 
                onClick={() => setNewChatOpen(true)}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                aria-label="New Conversation"
              >
                <PlusCircle className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          )}
          
          {searchActive && (
            <form onSubmit={handleSearchSubmit} className="flex-1 ml-2 flex items-center">
              <input
                type="text"
                placeholder="Search users..."
                className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={handleSearchChange}
                autoFocus
              />
              <button 
                type="button"
                onClick={handleCloseSearch}
                className="ml-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
            </form>
          )}
        </div>
      </div>
      
      {/* Conversation List or Search Results */}
      <div className="flex-1 overflow-y-auto">
        {searchActive && searchQuery.trim().length >= 2 ? (
          <UserSearch 
            query={searchQuery}
            onSelectUser={handleSelectUser}
            results={searchResults}
            isLoading={isSearching}
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