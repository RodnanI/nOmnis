// src/server/chat/db/messages.ts
import { Message } from '@/app/types/chat';
import { updateConversationLastMessage } from './conversations';

// In-memory message store
interface MessageData {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  parentId: string | null;
}

interface MessageEditData {
  id: string;
  messageId: string;
  previousContent: string;
  editedAt: string;
}

// In-memory storage
const messages: Record<string, MessageData> = {};
const messageEdits: MessageEditData[] = [];

// Conversation message index for efficient retrieval
const conversationMessages: Record<string, string[]> = {};

// Save a new message
export async function saveMessage(message: MessageData): Promise<MessageData> {
  // Store message
  messages[message.id] = message;
  
  // Update conversation message index
  if (!conversationMessages[message.conversationId]) {
    conversationMessages[message.conversationId] = [];
  }
  conversationMessages[message.conversationId].push(message.id);
  
  // Update conversation's last message
  await updateConversationLastMessage(message.conversationId, message.id);
  
  console.log(`Message ${message.id} saved in conversation ${message.conversationId}`);
  return message;
}

// Get a message by ID
export async function getMessage(id: string): Promise<MessageData | null> {
  return messages[id] || null;
}

// Update a message
export async function updateMessage(id: string, message: Partial<MessageData>): Promise<MessageData | null> {
  if (!messages[id]) {
    return null;
  }
  
  // Update fields
  messages[id] = {
    ...messages[id],
    ...message,
    updatedAt: message.updatedAt || new Date().toISOString()
  };
  
  console.log(`Message ${id} updated`);
  return messages[id];
}

// Record a message edit
export async function recordMessageEdit(edit: MessageEditData): Promise<MessageEditData> {
  messageEdits.push(edit);
  console.log(`Edit recorded for message ${edit.messageId}`);
  return edit;
}

// Get message edits
export async function getMessageEdits(messageId: string): Promise<MessageEditData[]> {
  return messageEdits.filter(edit => edit.messageId === messageId);
}

// Get conversation messages with pagination
export async function getConversationMessages(
  conversationId: string,
  limit: number = 50,
  before?: string,
  after?: string
): Promise<Message[]> {
  // Get message IDs for this conversation
  const msgIds = conversationMessages[conversationId] || [];
  
  // Convert to message objects
  let msgs = msgIds.map(id => messages[id]).filter(Boolean);
  
  // Sort by creation time (newest last)
  msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  
  // Apply 'before' filter if specified
  if (before) {
    const beforeIndex = msgs.findIndex(m => m.id === before);
    if (beforeIndex > -1) {
      msgs = msgs.slice(0, beforeIndex);
    }
  }
  
  // Apply 'after' filter if specified
  if (after) {
    const afterIndex = msgs.findIndex(m => m.id === after);
    if (afterIndex > -1) {
      msgs = msgs.slice(afterIndex + 1);
    }
  }
  
  // Apply limit (from the end if 'before' is specified, from the start if 'after' is specified)
  if (limit > 0) {
    if (before) {
      msgs = msgs.slice(-limit);
    } else {
      msgs = msgs.slice(0, limit);
    }
  }
  
  // Return as Message objects
  return msgs.map(msg => ({
    ...msg,
    readBy: [], // In a real app, we'd populate this
    edits: [] // In a real app, we'd populate this
  }));
}

// Delete a message (soft delete)
export async function deleteMessage(id: string): Promise<boolean> {
  // In a real app, we'd mark the message as deleted but keep the record
  if (!messages[id]) {
    return false;
  }
  
  messages[id] = {
    ...messages[id],
    content: '[This message has been deleted]',
    isEdited: true,
    updatedAt: new Date().toISOString()
  };
  
  return true;
}