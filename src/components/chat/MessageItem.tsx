'use client';

import React, { useState } from 'react';
import { Message } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import { MoreHorizontal, Check, Edit, Trash } from 'lucide-react';
import ReadReceipt from './ReadReceipt';
import { useChat } from '@/hooks/useChat';
import { motion } from 'framer-motion';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  conversationId: string;
}

export default function MessageItem({
  message,
  isOwn,
  showAvatar,
  conversationId
}: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [menuOpen, setMenuOpen] = useState(false);
  
  const { editMessage } = useChat();
  
  const formattedTime = new Date(message.createdAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
  
  const timeAgo = formatDistanceToNow(new Date(message.createdAt), { addSuffix: true });
  
  const handleSubmitEdit = async () => {
    if (editContent.trim() === message.content) {
      setIsEditing(false);
      return;
    }
    
    if (editContent.trim()) {
      try {
        await editMessage(message.id, editContent);
        setIsEditing(false);
      } catch (error) {
        console.error('Error editing message:', error);
      }
    }
  };
  
  return (
    <div 
      className={`flex mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      {/* Avatar for other users */}
      {!isOwn && showAvatar && message.sender ? (
        <div className="mr-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 overflow-hidden">
            {message.sender.avatarUrl ? (
              <Image
                src={message.sender.avatarUrl}
                alt={message.sender.name}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                {message.sender.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="w-8 mr-2"></div>
      )}
      
      {/* Message Content */}
      <div className={`max-w-[70%] group relative`}>
        {/* Username for other users */}
        {!isOwn && showAvatar && message.sender && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-1">
            {message.sender.name}
          </div>
        )}
        
        <div 
          className={`relative rounded-lg py-2 px-3 ${
            isOwn 
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
          }`}
        >
          {isEditing ? (
            <div className="min-w-[200px]">
              <textarea
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none min-h-[60px]"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitEdit();
                  } else if (e.key === 'Escape') {
                    setIsEditing(false);
                    setEditContent(message.content);
                  }
                }}
              />
              <div className="flex justify-end mt-1 space-x-2">
                <button
                  className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(message.content);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="text-xs px-2 py-1 rounded bg-blue-500 text-white"
                  onClick={handleSubmitEdit}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="whitespace-pre-wrap break-words">
                {message.content}
              </div>
              
              <div className="flex items-center mt-1">
                <span className="text-xs opacity-70">
                  {formattedTime}
                </span>
                
                {message.isEdited && (
                  <span className="text-xs opacity-70 ml-1">
                    (edited)
                  </span>
                )}
                
                {isOwn && (
                  <ReadReceipt messageId={message.id} conversationId={conversationId} />
                )}
              </div>
              
              {/* Message Actions */}
              {isOwn && (
                <div className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(!menuOpen)}
                      className={`p-1 rounded-full ${
                        menuOpen
                          ? 'bg-gray-200 dark:bg-gray-700'
                          : 'bg-white dark:bg-gray-800'
                      } shadow-sm`}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    
                    {menuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700"
                      >
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            // Delete functionality
                            setMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </button>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}