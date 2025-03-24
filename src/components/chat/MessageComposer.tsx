'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useConversation } from '@/hooks/useChat';
import { Smile, PaperclipIcon, Send, Mic } from 'lucide-react';

interface MessageComposerProps {
  conversationId: string;
}

export default function MessageComposer({ conversationId }: MessageComposerProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { send, setTyping } = useConversation(conversationId);
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '0px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [message]);
  
  // Handle typing indicator
  useEffect(() => {
    const typingTimeout = setTimeout(() => {
      if (isTyping && message.trim() === '') {
        setIsTyping(false);
        setTyping(false);
      }
    }, 1000);
    
    return () => clearTimeout(typingTimeout);
  }, [isTyping, message, setTyping]);
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Update typing status
    if (!isTyping && e.target.value.trim() !== '') {
      setIsTyping(true);
      setTyping(true);
    } else if (isTyping && e.target.value.trim() === '') {
      setIsTyping(false);
      setTyping(false);
    }
  };
  
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim()) {
      try {
        await send(message);
        setMessage('');
        setIsTyping(false);
        setTyping(false);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };
  
  return (
    <form onSubmit={handleSend} className="relative">
      <div className="flex items-end bg-gray-100 dark:bg-gray-800 rounded-lg">
        {/* Attachments */}
        <button
          type="button"
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          <PaperclipIcon className="h-5 w-5" />
        </button>
        
        {/* Emoji */}
        <button
          type="button"
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          <Smile className="h-5 w-5" />
        </button>
        
        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            placeholder="Type a message..."
            className="w-full p-3 bg-transparent border-0 focus:ring-0 text-gray-900 dark:text-white resize-none max-h-32 overflow-auto"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
        </div>
        
        {/* Voice message button */}
        <button
          type="button"
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          <Mic className="h-5 w-5" />
        </button>
        
        {/* Send button */}
        <button
          type="submit"
          disabled={!message.trim()}
          className={`p-2 rounded-full mx-1 mb-1 ${
            message.trim()
              ? 'bg-blue-500 text-white'
              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </form>
  );
}