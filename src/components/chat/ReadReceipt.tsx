'use client';

import React from 'react';
import { useConversation } from '@/hooks/useChat';
import { Check } from 'lucide-react';
import { Message, ReadReceipt as ReadReceiptType, Participant } from '@/app/types/chat';

interface ReadReceiptProps {
  messageId: string;
  conversationId: string;
}

export default function ReadReceipt({ messageId, conversationId }: ReadReceiptProps) {
  const { messages, conversation } = useConversation(conversationId);
  
  // Find the message
  const message = messages.find((m: Message) => m.id === messageId);
  
  // Early return if message or conversation isn't available
  if (!message || !conversation || !conversation.participants) {
    return null;
  }
  
  // Ensure message has senderId
  const senderId = message.senderId;
  if (!senderId) {
    return <Check className="h-3 w-3 ml-1 text-gray-400" />;
  }
  
  // Ensure readBy exists and is an array
  const readBy = Array.isArray(message.readBy) ? message.readBy : [];
  
  // Count the number of readers (excluding the sender)
  const readCount = readBy.filter((r: ReadReceiptType) => r && r.userId !== senderId).length;
  
  // Count participants (excluding the sender)
  const participantCount = conversation.participants
    .filter((p: Participant) => p && typeof p.userId === 'string' && p.userId !== senderId)
    .length;
  
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