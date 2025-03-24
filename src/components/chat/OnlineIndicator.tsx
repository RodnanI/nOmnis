'use client';

import React from 'react';
import { useChat } from '@/hooks/useChat';

interface OnlineIndicatorProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function OnlineIndicator({
  userId,
  size = 'md',
  className = ''
}: OnlineIndicatorProps) {
  const { onlineUsers } = useChat();
  const isOnline = onlineUsers[userId] || false;

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full ${
        isOnline ? 'bg-green-500' : 'bg-gray-400'
      } ${className}`}
      title={isOnline ? 'Online' : 'Offline'}
    />
  );
}