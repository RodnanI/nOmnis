// src/server/chat/db/readReceipts.ts

// In-memory store for development
const readReceipts: Record<string, string[]> = {}; // messageId -> userId[]

// Mark a message as read
export async function markMessageAsRead(messageId: string, userId: string, readAt: string) {
  // In a real app, this would save to the database
  if (!readReceipts[messageId]) {
    readReceipts[messageId] = [];
  }
  
  if (!readReceipts[messageId].includes(userId)) {
    readReceipts[messageId].push(userId);
    console.log(`User ${userId} marked message ${messageId} as read at ${readAt}`);
  }
  
  return true;
}

// Mark all messages in a conversation as read up to a certain point
export async function markMessagesAsRead(
  conversationId: string,
  userId: string,
  upToMessageId: string,
  readAt: string
) {
  // In a real app, this would update multiple records in the database
  console.log(`User ${userId} marked messages as read up to ${upToMessageId} in conversation ${conversationId}`);
  
  // For demo purposes, just mark the last message read
  await markMessageAsRead(upToMessageId, userId, readAt);
  
  return true;
}