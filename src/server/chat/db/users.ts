// src/server/chat/db/users.ts

// Simple in-memory user status store for development
const userStatuses: Record<string, { status: string, lastActive: Date }> = {};
const userTyping: Record<string, { conversationId: string | null, updatedAt: Date }> = {};

// Update user status
export async function updateUserStatus(userId: string, status: string) {
  // In a real app, this would update the database
  userStatuses[userId] = {
    status,
    lastActive: new Date()
  };
  
  // For now, just store in memory
  console.log(`User ${userId} status updated to ${status}`);
  return true;
}

// Update user typing status
export async function updateTypingStatus(userId: string, conversationId: string | null) {
  // In a real app, this would update the database
  userTyping[userId] = {
    conversationId,
    updatedAt: new Date()
  };
  
  // For now, just store in memory
  if (conversationId) {
    console.log(`User ${userId} is typing in conversation ${conversationId}`);
  }
  return true;
}

// Get users by online status
export async function getOnlineUsers() {
  // In a real app, this would query the database
  
  // For now, return users from our in-memory store
  return Object.entries(userStatuses)
    .filter(([_, data]) => data.status === 'online')
    .map(([userId, data]) => ({
      id: userId,
      username: `user_${userId}`, // Placeholder
      name: `User ${userId}`, // Placeholder
      avatarUrl: null,
      status: data.status,
      lastActive: data.lastActive.toISOString()
    }));
}

// Get conversation participants
export async function getUserConversations(userId: string) {
  // In a real app, this would query the database
  
  // For now, return empty array
  return [];
}