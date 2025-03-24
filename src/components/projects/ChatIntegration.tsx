'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { MessageSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function ChatIntegration() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  
  // Fetch unread count and recent messages
  useEffect(() => {
    if (session?.user) {
      // This would be a real API call in production
      const fetchChatData = async () => {
        try {
          // Simulate API call with timeout
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Simulated data
          setUnreadCount(3);
          setRecentMessages([
            {
              id: '1',
              sender: {
                name: 'Alice Johnson',
                avatar: '/user-placeholder.png'
              },
              preview: 'Hey, check out this new project I created!',
              time: '5m ago'
            },
            {
              id: '2',
              sender: {
                name: 'Bob Smith',
                avatar: '/user-placeholder.png'
              },
              preview: 'Are you free for a quick call?',
              time: '30m ago'
            },
            {
              id: '3',
              sender: {
                name: 'Carol Williams',
                avatar: '/user-placeholder.png'
              },
              preview: 'I need some help with the file uploader project.',
              time: '2h ago'
            }
          ]);
        } catch (error) {
          console.error('Error fetching chat data:', error);
        }
      };
      
      fetchChatData();
      
      // Set up interval to periodically check for new messages
      const interval = setInterval(fetchChatData, 30000);
      
      return () => clearInterval(interval);
    }
  }, [session]);
  
  if (!session?.user) {
    return null;
  }
  
  return (
    <>
      {/* Chat Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 bg-blue-500 text-white p-3 rounded-full shadow-lg z-20 flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <MessageSquare className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </motion.button>
      
      {/* Chat Preview Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-5 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-20 w-80 overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-medium">Recent Messages</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {recentMessages.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentMessages.map(message => (
                    <Link 
                      key={message.id}
                      href={`/messages/${message.id}`}
                      className="block p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-start">
                        <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 overflow-hidden flex-shrink-0">
                          {message.sender.avatar ? (
                            <Image
                              src={message.sender.avatar}
                              alt={message.sender.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                              {message.sender.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        
                        <div className="ml-3 flex-1 min-w-0">
                          <div className="flex justify-between">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {message.sender.name}
                            </p>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {message.time}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {message.preview}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No recent messages
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/chat"
                className="block w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white text-center rounded-lg transition-colors"
              >
                Go to Chat
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}