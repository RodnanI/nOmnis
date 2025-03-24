// src/server/chat/db/users.ts
import { UserStatus, User } from '@/types/chat';
import prisma from '@/lib/prisma';

// Update user status
export async function updateUserStatus(userId: string, status: UserStatus) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      status,
      lastActive: new Date()
    }
  });
}

// Update user typing status
export async function updateTypingStatus(userId: string, conversationId: string | null) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      isTypingIn: conversationId,
      typingUpdatedAt: new Date()
    }
  });
}

// Get users by online status
export async function getOnlineUsers() {
  const users = await prisma.user.findMany({
    where: {
      status: 'online'
    },
    select: {
      id: true,
      username: true,
      name: true,
      avatarUrl: true,
      status: true,
      lastActive: true
    }
  });

  return users.map(user => ({
    id: user.id,
    username: user.username,
    name: user.name,
    avatarUrl: user.avatarUrl,
    status: user.status as UserStatus,
    lastActive: user.lastActive ? user.lastActive.toISOString() : null
  }));
}

// Search users
export async function searchUsers(query: string, limit = 10) {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      avatarUrl: true,
      status: true
    },
    take: limit
  });

  return users.map(user => ({
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    status: user.status as UserStatus
  }));
}

// Get user by ID with chat fields
export async function getUserWithChatFields(userId: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      avatarUrl: true,
      status: true,
      lastActive: true,
      isTypingIn: true,
      typingUpdatedAt: true
    }
  });

  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    status: user.status as UserStatus,
    lastActive: user.lastActive ? user.lastActive.toISOString() : null,
    isTypingIn: user.isTypingIn,
    typingUpdatedAt: user.typingUpdatedAt ? user.typingUpdatedAt.toISOString() : null
  };
}