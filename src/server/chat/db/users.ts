// src/server/chat/db/users.ts
import { User, UserStatus } from '@/app/types/chat';

// In-memory user database - in a real app this would be a proper database
interface UserData {
  id: string;
  username: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  status: UserStatus;
  lastActive: Date;
  isTypingIn: string | null;
  typingUpdatedAt: Date | null;
}

// Store users who have logged in - simulates a database
const users: Record<string, UserData> = {};

// Store user statuses - in memory for development
const userStatuses: Record<string, { status: string, lastActive: Date }> = {};
const userTyping: Record<string, { conversationId: string | null, updatedAt: Date }> = {};

// Update user status
export async function updateUserStatus(userId: string, status: string): Promise<boolean> {
  userStatuses[userId] = {
    status,
    lastActive: new Date()
  };
  
  // Also update the user in the users map
  if (users[userId]) {
    users[userId].status = status as UserStatus;
    users[userId].lastActive = new Date();
  }
  
  console.log(`User ${userId} status updated to ${status}`);
  return true;
}

// Update user typing status
export async function updateTypingStatus(userId: string, conversationId: string | null): Promise<boolean> {
  userTyping[userId] = {
    conversationId,
    updatedAt: new Date()
  };
  
  // Update user in the users map
  if (users[userId]) {
    users[userId].isTypingIn = conversationId;
    users[userId].typingUpdatedAt = new Date();
  }
  
  if (conversationId) {
    console.log(`User ${userId} is typing in conversation ${conversationId}`);
  }
  return true;
}

// Get users by online status
export async function getOnlineUsers(): Promise<User[]> {
  return Object.values(users)
    .filter(user => user.status === 'online')
    .map(userData => ({
      id: userData.id,
      username: userData.username,
      name: userData.name,
      email: userData.email,
      avatarUrl: userData.avatarUrl,
      status: userData.status,
      lastActive: userData.lastActive.toISOString(),
      isTypingIn: userData.isTypingIn,
      typingUpdatedAt: userData.typingUpdatedAt?.toISOString() || null
    }));
}

// Store user info when they log in
export async function registerUser(userData: { 
  id: string;
  username?: string;
  name?: string;
  email?: string;
  image?: string;
}): Promise<User> {
  const { id, username, name, email, image } = userData;
  
  // Initialize or update user data
  if (!users[id]) {
    users[id] = {
      id,
      username: username || email || id,
      name: name || username || 'User',
      email: email || '',
      avatarUrl: image || null,
      status: 'online',
      lastActive: new Date(),
      isTypingIn: null,
      typingUpdatedAt: null
    };
  } else {
    // Update existing user
    users[id] = {
      ...users[id],
      username: username || users[id].username,
      name: name || users[id].name,
      email: email || users[id].email,
      avatarUrl: image || users[id].avatarUrl,
      status: 'online',
      lastActive: new Date()
    };
  }
  
  console.log(`User ${id} registered/updated`);
  
  return {
    id,
    username: users[id].username,
    name: users[id].name,
    email: users[id].email,
    avatarUrl: users[id].avatarUrl,
    status: users[id].status,
    lastActive: users[id].lastActive.toISOString(),
    isTypingIn: users[id].isTypingIn,
    typingUpdatedAt: users[id].typingUpdatedAt?.toISOString() || null
  };
}

// Get all registered users
export async function getAllUsers(): Promise<User[]> {
  return Object.values(users).map(userData => ({
    id: userData.id,
    username: userData.username,
    name: userData.name,
    email: userData.email,
    avatarUrl: userData.avatarUrl,
    status: userData.status,
    lastActive: userData.lastActive.toISOString(),
    isTypingIn: userData.isTypingIn,
    typingUpdatedAt: userData.typingUpdatedAt?.toISOString() || null
  }));
}

// Get a specific user by ID
export async function getUser(userId: string): Promise<User | null> {
  const userData = users[userId];
  
  if (!userData) {
    return null;
  }
  
  return {
    id: userData.id,
    username: userData.username,
    name: userData.name,
    email: userData.email,
    avatarUrl: userData.avatarUrl,
    status: userData.status,
    lastActive: userData.lastActive.toISOString(),
    isTypingIn: userData.isTypingIn,
    typingUpdatedAt: userData.typingUpdatedAt?.toISOString() || null
  };
}