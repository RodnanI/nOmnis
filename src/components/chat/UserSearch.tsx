'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/types/chat';
import { useChat } from '@/hooks/useChat';
import { motion } from 'framer-motion';
import Image from 'next/image';
import OnlineIndicator from './OnlineIndicator';

interface UserSearchProps {
  query: string;
  onSelectUser: (user: User) => void;
}

export default function UserSearch({ query, onSelectUser }: UserSearchProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { searchUsers } = useChat();
  
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query.trim().length < 2) {
        setUsers([]);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const results = await searchUsers(query);
        setUsers(results);
      } catch (err) {
        console.error('Error searching users:', err);
        setError('Failed to search users');
      } finally {
        setIsLoading(false);
      }
    }, 300); // Add debounce
    
    return () => clearTimeout(searchTimeout);
  }, [query, searchUsers]);
  
  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 text-center text-red-500 dark:text-red-400">
        <p>{error}</p>
      </div>
    );
  }
  
  if (users.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        {query.trim().length < 2 ? (
          <p>Enter at least 2 characters to search</p>
        ) : (
          <p>No users found</p>
        )}
      </div>
    );
  }
  
  return (
    <div className="p-2">
      <h3 className="px-2 py-1 text-sm text-gray-500 dark:text-gray-400">
        Search Results
      </h3>
      
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
                      alt={user.name}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                      {user.name.charAt(0).toUpperCase()}
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
                  {user.name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {user.username || user.email}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}