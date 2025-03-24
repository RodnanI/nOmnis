// src/server/chat/db/messages.ts

// In-memory message store for development
const messages: Record<string, any> = {};
const messageEdits: any[] = [];

// Save a new message
export async function saveMessage(message: any) {
  // In a real app, this would save to the database
  messages[message.id] = message;
  console.log(`Message ${message.id} saved`);
  return message;
}

// Get a message by ID
export async function getMessage(id: string) {
  // In a real app, this would query the database
  return messages[id] || null;
}

// Update a message
export async function updateMessage(id: string, message: any) {
  // In a real app, this would update the database
  if (messages[id]) {
    messages[id] = {
      ...messages[id],
      content: message.content,
      updatedAt: message.updatedAt,
      isEdited: message.isEdited
    };
    console.log(`Message ${id} updated`);
  }
  return messages[id];
}

// Record a message edit
export async function recordMessageEdit(edit: any) {
  // In a real app, this would save to the database
  messageEdits.push(edit);
  console.log(`Edit recorded for message ${edit.messageId}`);
  return edit;
}