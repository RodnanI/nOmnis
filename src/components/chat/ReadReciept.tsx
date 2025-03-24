'use client';

import React from 'react';
import { useConversation } from '@/hooks/useChat';
import { Check } from 'lucide-react';

interface ReadReceiptProps {
  messageId: string;
  conversationId: string;
}

export default function ReadReceipt({ messageId, conversationId }: ReadReceiptProps) {
  const { messages, conversation } = useConversation(conversationId);
  
  // Find the message
  const message = messages.find(m => m.id === messageId);
  
  if (!message || !conversation || !conversation.participants) {
    return null;
  }
  
  // Count the number of readers (excluding the sender)
  const readCount = message.readBy?.filter(r => r.userId !== message.senderId)?.length || 0;
  const participantCount = conversation.participants.filter(p => p.userId !== message.senderId).length;
  
  // If no one has read the message yet
  if (readCount === 0) {
    return (
      <Check className="h-3 w-3 ml-1 text-gray-400" />
    );
  }
  
  // If some people have read the message
  if (readCount < participantCount) {
    return (
      <div className="flex items-center ml-1">
        <Check className="h-3 w-3 text-blue-400" />
      </div>
    );
  }
  
  // If everyone has read the message
  return (
    <div className="flex items-center ml-1">
      <Check className="h-3 w-3 text-blue-500" />
      <Check className="h-3 w-3 -ml-1 text-blue-500" />
    </div>
  );
}