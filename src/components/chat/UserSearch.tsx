'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import OnlineIndicator from './OnlineIndicator';
import { UserPlus } from 'lucide-react';
import { User } from '@/app/types/chat';

interface UserSearchProps {
  query: string;
  onSelectUser: (user: User) => void;
  results: User[];
  isLoading: boolean;
}

export default function UserSearch({ query, onSelectUser, results, isLoading }: UserSearchProps) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
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
    );
  }
  
  if (results.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        {query.trim().length < 2 ? (
          <p>Enter at least 2 characters to search</p>
        ) : (
          <p>No users found matching "{query}"</p>
        )}
      </div>
    );
  }
  
  return (
    <div className="p-2">
      <h3 className="px-2 py-1 text-sm text-gray-500 dark:text-gray-400">
        Search Results ({results.length})
      </h3>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.05 }}
        className="space-y-1"
      >
        {results.map((user) => (
          <motion.div
            key={user.id}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelectUser(user)}
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
              
              {/* Add button */}
              <button 
                className="ml-auto text-blue-500 p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectUser(user);
                }}
              >
                <UserPlus className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}