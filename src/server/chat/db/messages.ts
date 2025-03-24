// src/server/chat/db/messages.ts
import { Message, MessageEdit } from '@/types/chat';
import prisma from '@/lib/prisma';
import { updateConversationLastMessage } from './conversations';

// Get messages for a conversation
export async function getConversationMessages(
  conversationId: string,
  limit = 50,
  before?: string,
  after?: string
) {
  const whereClause: any = {
    conversationId
  };

  if (before) {
    whereClause.createdAt = { 
      lt: new Date(before)
    };
  } else if (after) {
    whereClause.createdAt = {
      gt: new Date(after)
    };
  }

  const messages = await prisma.message.findMany({
    where: whereClause,
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          name: true,
          avatarUrl: true
        }
      },
      readReceipts: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true
            }
          }
        }
      },
      edits: true
    },
    orderBy: {
      createdAt: before ? 'desc' : 'asc'
    },
    take: limit
  });

  // If we fetched in descending order (for 'before' pagination), reverse to get chronological order
  if (before) {
    messages.reverse();
  }

  return messages.map(message => ({
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
    isEdited: message.isEdited,
    parentId: message.parentId,
    sender: message.sender,
    readBy: message.readReceipts.map(r => ({
      messageId: r.messageId,
      userId: r.userId,
      readAt: r.readAt.toISOString(),
      user: r.user
    })),
    edits: message.edits.map(e => ({
      id: e.id,
      messageId: e.messageId,
      previousContent: e.previousContent,
      editedAt: e.editedAt.toISOString()
    }))
  }));
}

// Save a new message
export async function saveMessage(message: Message) {
  const savedMessage = await prisma.message.create({
    data: {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      createdAt: new Date(message.createdAt),
      updatedAt: new Date(message.updatedAt),
      isEdited: message.isEdited,
      parentId: message.parentId
    }
  });

  // Update the conversation's last message
  await updateConversationLastMessage(message.conversationId, savedMessage.id);

  return savedMessage;
}

// Get a message by ID
export async function getMessage(id: string) {
  const message = await prisma.message.findUnique({
    where: { id }
  });

  if (!message) return null;

  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
    isEdited: message.isEdited,
    parentId: message.parentId
  };
}

// Update a message
export async function updateMessage(id: string, message: Message) {
  await prisma.message.update({
    where: { id },
    data: {
      content: message.content,
      updatedAt: new Date(message.updatedAt),
      isEdited: message.isEdited
    }
  });
}

// Record a message edit
export async function recordMessageEdit(edit: MessageEdit) {
  await prisma.messageEdit.create({
    data: {
      id: edit.id,
      messageId: edit.messageId,
      previousContent: edit.previousContent,
      editedAt: new Date(edit.editedAt)
    }
  });
}

// Delete a message (soft delete by emptying content)
export async function deleteMessage(id: string) {
  await prisma.message.update({
    where: { id },
    data: {
      content: '[This message was deleted]',
      isEdited: true,
      updatedAt: new Date()
    }
  });
}