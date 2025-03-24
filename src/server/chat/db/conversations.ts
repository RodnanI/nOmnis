// src/server/chat/db/conversations.ts
import { v4 as uuidv4 } from 'uuid';
import { Conversation, ConversationType, Participant } from '@/app/types/chat';
import { getUser } from './users';

// In-memory storage for conversations
interface ConversationData {
  id: string;
  type: ConversationType;
  name: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessageId: string | null;
  avatarUrl: string | null;
}

// In-memory storage for participants
interface ParticipantData {
  conversationId: string;
  userId: string;
  joinedAt: string;
  leftAt: string | null;
  isActive: boolean;
  isMuted: boolean;
  lastReadMessageId: string | null;
  role: 'member' | 'admin';
}

// Store conversations in memory
const conversations: Record<string, ConversationData> = {};
const participants: ParticipantData[] = [];

// Get conversation by ID
export async function getConversation(id: string): Promise<Conversation | null> {
  const conversation = conversations[id];
  if (!conversation) {
    return null;
  }

  return {
    ...conversation,
    lastMessage: null
  };
}

// Create a new conversation
export async function createConversation(
  type: ConversationType,
  creatorId: string,
  participantIds: string[],
  name: string | null = null,
  avatarUrl: string | null = null
): Promise<Conversation> {
  // Ensure creator is included in participants
  if (!participantIds.includes(creatorId)) {
    participantIds.push(creatorId);
  }

  // For direct messages between two users, check if a conversation already exists
  if (type === 'dm' && participantIds.length === 2) {
    const existingConversation = await findExistingDM(participantIds[0], participantIds[1]);
    if (existingConversation) {
      return existingConversation;
    }
  }

  // Create a new conversation
  const id = uuidv4();
  const now = new Date().toISOString();

  const newConversation: ConversationData = {
    id,
    type,
    name,
    createdAt: now,
    updatedAt: now,
    lastMessageId: null,
    avatarUrl
  };

  // Add conversation to store
  conversations[id] = newConversation;

  // Add participants
  for (const userId of participantIds) {
    const isCreator = userId === creatorId;
    const participant: ParticipantData = {
      conversationId: id,
      userId,
      joinedAt: now,
      leftAt: null,
      isActive: true,
      isMuted: false,
      lastReadMessageId: null,
      role: isCreator ? 'admin' : 'member'
    };

    participants.push(participant);
  }

  // Fetch and include participant details
  const participantDetails = await Promise.all(
    participantIds.map(async (userId) => {
      const participant = participants.find(p => p.userId === userId && p.conversationId === id);
      const user = await getUser(userId);
      return {
        conversationId: id,
        userId,
        joinedAt: participant?.joinedAt || now,
        leftAt: participant?.leftAt || null,
        isActive: participant?.isActive || true,
        isMuted: participant?.isMuted || false,
        lastReadMessageId: participant?.lastReadMessageId || null,
        role: participant?.role || 'member',
        user: user || undefined
      };
    })
  );

  return {
    ...newConversation,
    participants: participantDetails,
    lastMessage: null
  };
}

// Find an existing DM conversation between two users
async function findExistingDM(userA: string, userB: string): Promise<Conversation | null> {
  // Find conversations where both users are participants
  const conversationIds = Object.keys(conversations);
  
  for (const id of conversationIds) {
    const conversation = conversations[id];
    
    // Skip if not a DM
    if (conversation.type !== 'dm') continue;
    
    // Get participants for this conversation
    const conversationParticipants = participants.filter(p => 
      p.conversationId === id && p.isActive
    );
    
    // Check if exactly these two users are participants
    const userAIsParticipant = conversationParticipants.some(p => p.userId === userA);
    const userBIsParticipant = conversationParticipants.some(p => p.userId === userB);
    
    if (userAIsParticipant && userBIsParticipant && conversationParticipants.length === 2) {
      // Found an existing DM
      const participantDetails = await Promise.all(
        conversationParticipants.map(async (p) => {
          const user = await getUser(p.userId);
          return {
            ...p,
            user: user || undefined
          };
        })
      );
      
      return {
        ...conversation,
        participants: participantDetails,
        lastMessage: null
      };
    }
  }
  
  return null;
}

// Get conversation participants
export async function getConversationParticipants(conversationId: string): Promise<Participant[]> {
  // Get participants for this conversation
  const conversationParticipants = participants.filter(p => 
    p.conversationId === conversationId
  );
  
  // Fetch user details for each participant
  const participantsWithUsers = await Promise.all(
    conversationParticipants.map(async (p) => {
      const user = await getUser(p.userId);
      return {
        ...p,
        user: user || undefined
      };
    })
  );
  
  return participantsWithUsers;
}

// Update conversation's last message
export async function updateConversationLastMessage(conversationId: string, messageId: string) {
  if (conversations[conversationId]) {
    conversations[conversationId].lastMessageId = messageId;
    conversations[conversationId].updatedAt = new Date().toISOString();
  }
  return true;
}

// Get a user's conversations
export async function getUserConversations(
  userId: string, 
  limit: number = 20, 
  offset: number = 0
): Promise<Conversation[]> {
  // Find conversations where the user is a participant
  const userParticipations = participants.filter(p => 
    p.userId === userId && p.isActive
  );
  
  // Get conversation IDs
  const userConversationIds = userParticipations.map(p => p.conversationId);
  
  // Get conversations
  const userConversations = userConversationIds
    .map(id => conversations[id])
    .filter(Boolean) // Remove any undefined values
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()) // Sort by updatedAt
    .slice(offset, offset + limit); // Apply pagination
  
  // Get participants for each conversation
  const conversationsWithParticipants = await Promise.all(
    userConversations.map(async (conv) => {
      const participantDetails = await getConversationParticipants(conv.id);
      
      return {
        ...conv,
        participants: participantDetails,
        lastMessage: null // We'll add last message in a real app
      };
    })
  );
  
  return conversationsWithParticipants;
}

// Leave a conversation (soft delete)
export async function leaveConversation(conversationId: string, userId: string): Promise<boolean> {
  // Find participant
  const participantIndex = participants.findIndex(p => 
    p.conversationId === conversationId && p.userId === userId && p.isActive
  );
  
  if (participantIndex === -1) {
    return false;
  }
  
  // Update participant
  participants[participantIndex] = {
    ...participants[participantIndex],
    isActive: false,
    leftAt: new Date().toISOString()
  };
  
  return true;
}

// Update conversation details
export async function updateConversation(
  conversationId: string, 
  updates: { name?: string; avatarUrl?: string }
): Promise<Conversation | null> {
  const conversation = conversations[conversationId];
  if (!conversation) {
    return null;
  }
  
  // Update fields
  if (updates.name !== undefined) {
    conversation.name = updates.name;
  }
  
  if (updates.avatarUrl !== undefined) {
    conversation.avatarUrl = updates.avatarUrl;
  }
  
  conversation.updatedAt = new Date().toISOString();
  
  // Get participants for response
  const participantDetails = await getConversationParticipants(conversationId);
  
  return {
    ...conversation,
    participants: participantDetails,
    lastMessage: null
  };
}