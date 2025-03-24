'use client';

import React, { useState } from 'react';
import { User, ConversationType } from '@/types/chat';
import { motion } from 'framer-motion';
import { X, Users, MessageCircle, Globe, Search, Plus, UserPlus } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import Image from 'next/image';

interface NewConversationProps {
  onClose: () => void;
  onCreateSuccess: (conversationId: string) => void;
  initialUsers?: User[];
}

export default function NewConversation({
  onClose,
  onCreateSuccess,
  initialUsers = []
}: NewConversationProps) {
  const [conversationType, setConversationType] = useState<ConversationType>('dm');
  const [selectedUsers, setSelectedUsers] = useState<User[]>(initialUsers);
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { searchUsers, createConversation } = useChat();
  
  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      const results = await searchUsers(searchQuery);
      // Filter out already selected users
      const filteredResults = results.filter(
        result => !selectedUsers.some(user => user.id === result.id)
      );
      setSearchResults(filteredResults);
    } catch (err) {
      console.error('Error searching users:', err);
      setError('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleSelectUser = (user: User) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchQuery('');
    setSearchResults([]);
  };
  
  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(user => user.id !== userId));
  };
  
  const handleCreate = async () => {
    if (conversationType === 'dm' && selectedUsers.length !== 1) {
      setError('Please select exactly one user for direct message');
      return;
    }
    
    if ((conversationType === 'group' || conversationType === 'public') && !groupName.trim()) {
      setError('Please enter a name for the conversation');
      return;
    }
    
    if (selectedUsers.length === 0) {
      setError('Please select at least one user');
      return;
    }
    
    setIsCreating(true);
    setError(null);
    
    try {
      const userIds = selectedUsers.map(user => user.id);
      const conversationId = await createConversation(
        conversationType,
        userIds,
        conversationType === 'dm' ? undefined : groupName
      );
      
      onCreateSuccess(conversationId);
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError('Failed to create conversation');
      setIsCreating(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="font-semibold text-lg">New Conversation</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Conversation Type Selection */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            <button
              onClick={() => setConversationType('dm')}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center space-x-2 ${
                conversationType === 'dm'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <MessageCircle className="h-5 w-5" />
              <span>Direct Message</span>
            </button>
            
            <button
              onClick={() => setConversationType('group')}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center space-x-2 ${
                conversationType === 'group'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Users className="h-5 w-5" />
              <span>Group Chat</span>
            </button>
            
            <button
              onClick={() => setConversationType('public')}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center space-x-2 ${
                conversationType === 'public'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Globe className="h-5 w-5" />
              <span>Public</span>
            </button>
          </div>
        </div>
        
        {/* Group Name (for group or public) */}
        {(conversationType === 'group' || conversationType === 'public') && (
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {conversationType === 'group' ? 'Group Name' : 'Room Name'}
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder={`Enter ${conversationType === 'group' ? 'group' : 'room'} name`}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
          </div>
        )}
        
        {/* Selected Users */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {conversationType === 'dm' ? 'Select User' : 'Add Participants'}
            </h3>
            
            {conversationType === 'dm' && selectedUsers.length === 1 && (
              <button
                onClick={() => handleRemoveUser(selectedUsers[0].id)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Clear
              </button>
            )}
          </div>
          
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedUsers.map(user => (
                <div
                  key={user.id}
                  className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full px-3 py-1 text-sm flex items-center"
                >
                  <span>{user.name}</span>
                  <button
                    onClick={() => handleRemoveUser(user.id)}
                    className="ml-2 focus:outline-none"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* User Search */}
          {(conversationType !== 'dm' || selectedUsers.length === 0) && (
            <div className="relative">
              <div className="flex">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  placeholder="Search users..."
                  className="w-full p-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
                <button
                  onClick={handleSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto">
                  {searchResults.map(user => (
                    <div
                      key={user.id}
                      className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center"
                      onClick={() => handleSelectUser(user)}
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 overflow-hidden mr-2">
                        {user.avatarUrl ? (
                          <Image
                            src={user.avatarUrl}
                            alt={user.name}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.username || user.email}</div>
                      </div>
                      <button className="ml-auto text-blue-500">
                        <UserPlus className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {isSearching && (
                <div className="text-center py-2 text-sm text-gray-500">
                  Searching...
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="px-4 py-2 text-red-500 text-sm">
            {error}
          </div>
        )}
        
        {/* Actions */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2 mt-auto">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
          
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className={`px-4 py-2 bg-blue-500 text-white rounded-lg ${
              isCreating
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-blue-600'
            }`}
          >
            {isCreating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}