// src/server/chat/db/conversations.ts
import { v4 as uuidv4 } from 'uuid';
import { ConversationType, Conversation, Participant } from '@/types/chat';
import prisma from '@/lib/prisma'; // Assuming you have a Prisma client setup

// Get all conversations for a user
export async function getUserConversations(userId: string, limit = 20, offset = 0) {
  const conversations = await prisma.conversation.findMany({
    where: {
      participants: {
        some: {
          userId,
          isActive: true
        }
      }
    },
    include: {
      participants: {
        where: {
          isActive: true
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
              status: true
            }
          }
        }
      },
      // Get last message for preview
      messages: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 1,
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              name: true
            }
          }
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    },
    take: limit,
    skip: offset
  });

  // Format conversations to match our interface
  return conversations.map(conversation => {
    const lastMessage = conversation.messages.length > 0 ? conversation.messages[0] : null;
    
    return {
      id: conversation.id,
      type: conversation.type as ConversationType,
      name: conversation.name,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      lastMessageId: conversation.lastMessageId,
      avatarUrl: conversation.avatarUrl,
      participants: conversation.participants,
      lastMessage: lastMessage ? {
        id: lastMessage.id,
        conversationId: lastMessage.conversationId,
        senderId: lastMessage.senderId,
        content: lastMessage.content,
        createdAt: lastMessage.createdAt.toISOString(),
        updatedAt: lastMessage.updatedAt.toISOString(),
        isEdited: lastMessage.isEdited,
        parentId: lastMessage.parentId,
        sender: lastMessage.sender
      } : null,
      // Calculate unread count (this would be more efficient with a proper query)
      unreadCount: 0 // This would need to be calculated based on read receipts
    };
  });
}

// Get conversation by ID
export async function getConversation(id: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      participants: {
        where: {
          isActive: true
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
              status: true
            }
          }
        }
      }
    }
  });

  if (!conversation) return null;

  return {
    id: conversation.id,
    type: conversation.type as ConversationType,
    name: conversation.name,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    lastMessageId: conversation.lastMessageId,
    avatarUrl: conversation.avatarUrl,
    participants: conversation.participants
  };
}

// Get conversation participants
export async function getConversationParticipants(conversationId: string): Promise<Participant[]> {
  const participants = await prisma.participant.findMany({
    where: {
      conversationId,
      isActive: true
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          avatarUrl: true,
          status: true
        }
      }
    }
  });

  return participants.map(p => ({
    conversationId: p.conversationId,
    userId: p.userId,
    joinedAt: p.joinedAt.toISOString(),
    leftAt: p.leftAt ? p.leftAt.toISOString() : null,
    isActive: p.isActive,
    isMuted: p.isMuted,
    lastReadMessageId: p.lastReadMessageId,
    role: p.role as 'member' | 'admin',
    user: p.user
  }));
}

// Create a new conversation
export async function createConversation(
  type: ConversationType,
  creatorId: string,
  participantIds: string[],
  name?: string,
  avatarUrl?: string
) {
  // Ensure creator is included in participants
  if (!participantIds.includes(creatorId)) {
    participantIds.push(creatorId);
  }

  // For DMs, ensure there are exactly 2 participants and no name is set
  if (type === 'dm') {
    if (participantIds.length !== 2) {
      throw new Error('Direct messages must have exactly 2 participants');
    }
    name = null;
  } else if (!name) {
    // For groups and public chats, name is required
    throw new Error('Name is required for group and public conversations');
  }

  // Create conversation with participants
  const conversation = await prisma.conversation.create({
    data: {
      id: uuidv4(),
      type,
      name,
      avatarUrl: avatarUrl || null,
      participants: {
        create: participantIds.map(userId => ({
          userId,
          role: userId === creatorId ? 'admin' : 'member',
          joinedAt: new Date()
        }))
      }
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true
            }
          }
        }
      }
    }
  });

  return {
    id: conversation.id,
    type: conversation.type as ConversationType,
    name: conversation.name,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    lastMessageId: null,
    avatarUrl: conversation.avatarUrl,
    participants: conversation.participants.map(p => ({
      conversationId: p.conversationId,
      userId: p.userId,
      joinedAt: p.joinedAt.toISOString(),
      leftAt: p.leftAt ? p.leftAt.toISOString() : null,
      isActive: p.isActive,
      isMuted: p.isMuted,
      lastReadMessageId: p.lastReadMessageId,
      role: p.role as 'member' | 'admin',
      user: p.user
    }))
  };
}

// Update conversation (name, avatar)
export async function updateConversation(
  id: string,
  data: { name?: string; avatarUrl?: string }
) {
  const conversation = await prisma.conversation.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      updatedAt: new Date()
    }
  });

  return {
    id: conversation.id,
    type: conversation.type as ConversationType,
    name: conversation.name,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    lastMessageId: conversation.lastMessageId,
    avatarUrl: conversation.avatarUrl
  };
}

// Update conversation's last message
export async function updateConversationLastMessage(conversationId: string, messageId: string) {
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      lastMessageId: messageId,
      updatedAt: new Date()
    }
  });
}

// Leave conversation (soft delete participant)
export async function leaveConversation(conversationId: string, userId: string) {
  await prisma.participant.update({
    where: {
      conversationId_userId: {
        conversationId,
        userId
      }
    },
    data: {
      isActive: false,
      leftAt: new Date()
    }
  });
}

// Add participant to conversation
export async function addParticipant(conversationId: string, userId: string, role = 'member') {
  const participant = await prisma.participant.create({
    data: {
      conversationId,
      userId,
      role,
      joinedAt: new Date()
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          avatarUrl: true
        }
      }
    }
  });

  return {
    conversationId: participant.conversationId,
    userId: participant.userId,
    joinedAt: participant.joinedAt.toISOString(),
    leftAt: participant.leftAt ? participant.leftAt.toISOString() : null,
    isActive: participant.isActive,
    isMuted: participant.isMuted,
    lastReadMessageId: participant.lastReadMessageId,
    role: participant.role as 'member' | 'admin',
    user: participant.user
  };
}

// Update participant (role, mute status)
export async function updateParticipant(
  conversationId: string,
  userId: string,
  data: { role?: 'member' | 'admin'; isMuted?: boolean }
) {
  const participant = await prisma.participant.update({
    where: {
      conversationId_userId: {
        conversationId,
        userId
      }
    },
    data: {
      ...(data.role && { role: data.role }),
      ...(data.isMuted !== undefined && { isMuted: data.isMuted })
    }
  });

  return {
    conversationId: participant.conversationId,
    userId: participant.userId,
    joinedAt: participant.joinedAt.toISOString(),
    leftAt: participant.leftAt ? participant.leftAt.toISOString() : null,
    isActive: participant.isActive,
    isMuted: participant.isMuted,
    lastReadMessageId: participant.lastReadMessageId,
    role: participant.role as 'member' | 'admin'
  };
}

// Find or create DM conversation between two users
export async function findOrCreateDMConversation(user1Id: string, user2Id: string) {
  // Find existing DM conversation
  const existingConversation = await prisma.conversation.findFirst({
    where: {
      type: 'dm',
      participants: {
        every: {
          userId: { in: [user1Id, user2Id] },
          isActive: true
        }
      },
      // Make sure it's only between these two users
      participants: {
        none: {
          userId: { notIn: [user1Id, user2Id] },
          isActive: true
        }
      }
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true
            }
          }
        }
      }
    }
  });

  if (existingConversation) {
    return {
      id: existingConversation.id,
      type: existingConversation.type as ConversationType,
      name: existingConversation.name,
      createdAt: existingConversation.createdAt.toISOString(),
      updatedAt: existingConversation.updatedAt.toISOString(),
      lastMessageId: existingConversation.lastMessageId,
      avatarUrl: existingConversation.avatarUrl,
      participants: existingConversation.participants.map(p => ({
        conversationId: p.conversationId,
        userId: p.userId,
        joinedAt: p.joinedAt.toISOString(),
        leftAt: p.leftAt ? p.leftAt.toISOString() : null,
        isActive: p.isActive,
        isMuted: p.isMuted,
        lastReadMessageId: p.lastReadMessageId,
        role: p.role as 'member' | 'admin',
        user: p.user
      }))
    };
  }

  // Create new DM conversation
  return createConversation('dm', user1Id, [user1Id, user2Id]);
}