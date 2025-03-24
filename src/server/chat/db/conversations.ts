// src/server/chat/db/conversations.ts

// In-memory store for development
const conversationParticipants: Record<string, any[]> = {};

// Get conversation participants
export async function getConversationParticipants(conversationId: string): Promise<any[]> {
  // In a real app, this would query the database
  return conversationParticipants[conversationId] || [];
}

// Update conversation's last message
export async function updateConversationLastMessage(conversationId: string, messageId: string) {
  // In a real app, this would update the database
  console.log(`Conversation ${conversationId} last message updated to ${messageId}`);
  return true;
}