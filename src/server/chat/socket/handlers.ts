// src/server/chat/socket/handlers.ts
import { Server as SocketIOServer, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { 
  saveMessage, 
  updateMessage, 
  getMessage,
  recordMessageEdit
} from '../db/messages';
import { markMessagesAsRead } from '../db/readReceipts';
import { getConversationParticipants } from '../db/conversations';
import { updateTypingStatus } from '../db/users';

export async function handleMessageSend(
  io: SocketIOServer,
  socket: Socket,
  data: { conversationId: string; content: string; temporaryId: string; parentId?: string },
  callback: Function
) {
  try {
    const { conversationId, content, temporaryId, parentId } = data;
    const senderId = socket.data.userId;

    // Validate that the user is a participant in the conversation
    const participants = await getConversationParticipants(conversationId);
    const isParticipant = participants.some(p => p.userId === senderId && p.isActive);

    if (!isParticipant) {
      return callback({
        error: {
          code: 'FORBIDDEN',
          message: 'You are not a participant in this conversation'
        }
      });
    }

    // Create and save the message
    const messageId = uuidv4();
    const now = new Date().toISOString();

    const message = {
      id: messageId,
      conversationId,
      senderId,
      content,
      createdAt: now,
      updatedAt: now,
      isEdited: false,
      parentId: parentId || null
    };

    await saveMessage(message);

    // Acknowledge the message to the sender
    callback({
      temporaryId,
      message
    });

    // Get sender details for the broadcast
    const enrichedMessage = {
      ...message,
      sender: {
        id: senderId,
        name: socket.data.name || senderId,
        username: socket.data.username || senderId,
        avatarUrl: socket.data.avatarUrl || null
      }
    };

    // Broadcast to all participants in the conversation
    io.to(`conversation:${conversationId}`).emit('message:received', {
      message: enrichedMessage
    });

    // Clear typing status for the sender
    await updateTypingStatus(senderId, null);
    io.to(`conversation:${conversationId}`).emit('user:typing', {
      userId: senderId,
      conversationId,
      isTyping: false,
      timestamp: now
    });
  } catch (error) {
    console.error('Error handling message send:', error);
    callback({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to send message'
      }
    });
  }
}

export async function handleMessageEdit(
  io: SocketIOServer,
  socket: Socket,
  data: { messageId: string; newContent: string },
  callback: Function
) {
  try {
    const { messageId, newContent } = data;
    const userId = socket.data.userId;

    // Get the original message
    const message = await getMessage(messageId);

    if (!message) {
      return callback({
        error: {
          code: 'NOT_FOUND',
          message: 'Message not found'
        }
      });
    }

    // Verify the user is the original sender
    if (message.senderId !== userId) {
      return callback({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only edit your own messages'
        }
      });
    }

    // Store the previous version
    await recordMessageEdit({
      id: uuidv4(),
      messageId,
      previousContent: message.content,
      editedAt: new Date().toISOString()
    });

    // Update the message
    const updatedMessage = {
      ...message,
      content: newContent,
      updatedAt: new Date().toISOString(),
      isEdited: true
    };

    await updateMessage(messageId, updatedMessage);

    // Acknowledge the edit
    callback({ success: true });

    // Broadcast the edit to all participants
    io.to(`conversation:${message.conversationId}`).emit('message:edit', {
      messageId,
      newContent,
      previousContent: message.content,
      updatedAt: updatedMessage.updatedAt,
      editorId: userId
    });
  } catch (error) {
    console.error('Error handling message edit:', error);
    callback({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to edit message'
      }
    });
  }
}

export async function handleMessageRead(
  io: SocketIOServer,
  socket: Socket,
  data: { conversationId: string; messageId: string }
) {
  try {
    const { conversationId, messageId } = data;
    const userId = socket.data.userId;
    
    // Mark message as read
    const readAt = new Date().toISOString();
    await markMessagesAsRead(conversationId, userId, messageId, readAt);

    // Broadcast to conversation participants
    io.to(`conversation:${conversationId}`).emit('message:read', {
      userId,
      messageId,
      conversationId,
      readAt
    });
  } catch (error) {
    console.error('Error handling message read:', error);
  }
}

export async function handleTypingStatus(
  io: SocketIOServer,
  socket: Socket,
  data: { conversationId: string; isTyping: boolean }
) {
  try {
    const { conversationId, isTyping } = data;
    const userId = socket.data.userId;

    // Update typing status in database
    const typingConversationId = isTyping ? conversationId : null;
    await updateTypingStatus(userId, typingConversationId);

    // Broadcast to conversation participants
    io.to(`conversation:${conversationId}`).emit('user:typing', {
      userId,
      conversationId,
      isTyping,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error handling typing status:', error);
  }
}