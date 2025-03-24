'use client';

import React from 'react';
import { MessageSquare, Users, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  onNewChat: () => void;
}

export default function EmptyState({ onNewChat }: EmptyStateProps) {
  return (
    <motion.div 
      className="flex flex-col items-center justify-center h-full p-8 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ 
          duration: 0.5,
          delay: 0.2,
          type: "spring",
          stiffness: 200
        }}
      >
        <MessageSquare className="h-10 w-10 text-blue-500" />
      </motion.div>
      
      <h2 className="text-2xl font-semibold mb-2">Welcome to Chat</h2>
      
      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">
        Browse registered users or create a public room to start chatting!
      </p>
      
      <motion.button
        onClick={onNewChat}
        className="px-5 py-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Start Chatting
      </motion.button>
      
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-3">
            <MessageSquare className="h-5 w-5 text-blue-500" />
          </div>
          <h3 className="font-medium mb-1">Direct Messages</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Private conversations with individuals
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-3">
            <Users className="h-5 w-5 text-purple-500" />
          </div>
          <h3 className="font-medium mb-1">User List</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Browse all registered users
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3">
            <Globe className="h-5 w-5 text-green-500" />
          </div>
          <h3 className="font-medium mb-1">Public Chat</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Join the conversation with everyone
          </p>
        </div>
      </div>
    </motion.div>
  );
}