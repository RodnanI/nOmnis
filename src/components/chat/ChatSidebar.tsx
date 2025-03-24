'use client';

import React, { useState, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import ConversationList from './ConversationList';
import { PlusCircle, Users, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { User } from '@/app/types/chat';
import Image from 'next/image';
import OnlineIndicator from './OnlineIndicator';

interface ChatSidebarProps {
  onSelectConversation: (id: string) => void;
}

export default function ChatSidebar({ onSelectConversation }: ChatSidebarProps) {
  const { 
    conversations, 
    isLoadingConversations, 
    activeConversationId, 
    getAllUsers,
    createConversation,
    onlineUsers
  } = useChat();
  
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [activeTab, setActiveTab] = useState<'conversations' | 'users'>('conversations');
  
  // Load all registered users
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const userList = await getAllUsers();
        setUsers(userList);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    
    fetchUsers();
  }, [getAllUsers]);
  
  // Create a direct message conversation with a user
  const handleStartDM = async (userId: string) => {
    try {
      // Create a DM conversation
      const conversationId = await createConversation('dm', [userId]);
      onSelectConversation(conversationId);
    } catch (error) {
      console.error('Error creating DM conversation:', error);
    }
  };
  
  // Create a public message conversation
  const handleStartPublicChat = async () => {
    try {
      // Create a public conversation with all users
      const allUserIds = users.map(user => user.id);
      const conversationId = await createConversation('public', allUserIds, 'Public Chat');
      onSelectConversation(conversationId);
    } catch (error) {
      console.error('Error creating public conversation:', error);
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-800">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-lg">Chat</h2>
          
          <button 
            onClick={handleStartPublicChat}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            aria-label="New Public Chat"
          >
            <PlusCircle className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          className={`flex-1 py-3 px-4 font-medium ${
            activeTab === 'conversations'
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-gray-500 dark:text-gray-400'
          }`}
          onClick={() => setActiveTab('conversations')}
        >
          <div className="flex items-center justify-center">
            <MessageSquare className="h-4 w-4 mr-2" />
            <span>Chats</span>
          </div>
        </button>
        
        <button
          className={`flex-1 py-3 px-4 font-medium ${
            activeTab === 'users'
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-gray-500 dark:text-gray-400'
          }`}
          onClick={() => setActiveTab('users')}
        >
          <div className="flex items-center justify-center">
            <Users className="h-4 w-4 mr-2" />
            <span>Users</span>
          </div>
        </button>
      </div>
      
      {/* Content for Selected Tab */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'conversations' ? (
          <ConversationList 
            conversations={conversations}
            isLoading={isLoadingConversations}
            activeConversationId={activeConversationId}
            onSelectConversation={onSelectConversation}
          />
        ) : (
          <div className="p-2">
            <h3 className="px-2 py-2 text-sm text-gray-500 dark:text-gray-400">
              Registered Users ({users.length})
            </h3>
            
            {isLoadingUsers ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                      <div className="ml-3 flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.05 }}
                className="space-y-1"
              >
                {users.map((user) => (
                  <motion.div
                    key={user.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleStartDM(user.id)}
                    className="p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 overflow-hidden">
                          {user.avatarUrl ? (
                            <Image
                              src={user.avatarUrl}
                              alt={user.name || ''}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                              {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                            </div>
                          )}
                        </div>
                        
                        <OnlineIndicator 
                          userId={user.id}
                          className="absolute right-0 bottom-0 border-2 border-white dark:border-gray-800"
                        />
                      </div>
                      
                      {/* User Info */}
                      <div className="ml-3 flex-grow min-w-0">
                        <h4 className="font-medium">
                          {user.name || 'Unknown User'}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {user.username || user.email || ''}
                        </p>
                      </div>
                      
                      {/* Status indicator */}
                      <div className="ml-2">
                        {onlineUsers[user.id] ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Online
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            Offline
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}