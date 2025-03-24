// src/server/chat/db/readReceipts.ts
import prisma from '@/lib/prisma';

// Mark a message as read
export async function markMessageAsRead(messageId: string, userId: string, readAt: string) {
  await prisma.readReceipt.upsert({
    where: {
      messageId_userId: {
        messageId,
        userId
      }
    },
    update: {
      readAt: new Date(readAt)
    },
    create: {
      messageId,
      userId,
      readAt: new Date(readAt)
    }
  });
}

// Mark all messages in a conversation as read up to a certain point
export async function markMessagesAsRead(
  conversationId: string,
  userId: string,
  upToMessageId: string,
  readAt: string
) {
  // First, get the message to determine its timestamp
  const message = await prisma.message.findUnique({
    where: { id: upToMessageId }
  });

  if (!message) {
    throw new Error('Message not found');
  }

  // Find all messages in the conversation up to this timestamp that haven't been read by this user
  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      createdAt: { lte: message.createdAt },
      readReceipts: {
        none: {
          userId
        }
      }
    },
    select: {
      id: true
    }
  });

  // Create read receipts for all these messages
  if (messages.length > 0) {
    await prisma.$transaction(
      messages.map(msg => 
        prisma.readReceipt.create({
          data: {
            messageId: msg.id,
            userId,
            readAt: new Date(readAt)
          }
        })
      )
    );
  }

  // Update participant's last read message
  await prisma.participant.update({
    where: {
      conversationId_userId: {
        conversationId,
        userId
      }
    },
    data: {
      lastReadMessageId: upToMessageId
    }
  });
}

// Get unread message count for a user in a conversation
export async function getUnreadMessageCount(conversationId: string, userId: string) {
  // Get the participant to find their last read message
  const participant = await prisma.participant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId
      }
    }
  });

  if (!participant) return 0;

  let whereClause: any = {
    conversationId,
    senderId: { not: userId } // Don't count user's own messages
  };

  // If there's a last read message, only count newer messages
  if (participant.lastReadMessageId) {
    const lastReadMessage = await prisma.message.findUnique({
      where: { id: participant.lastReadMessageId }
    });

    if (lastReadMessage) {
      whereClause.createdAt = { gt: lastReadMessage.createdAt };
    }
  }

  // Count messages that match the criteria
  const count = await prisma.message.count({
    where: whereClause
  });

  return count;
}