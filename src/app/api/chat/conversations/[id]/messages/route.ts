// src/app/api/chat/conversations/[id]/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { v4 as uuidv4 } from 'uuid';
import { getConversationParticipants } from '@/server/chat/db/conversations';
import { getConversationMessages, saveMessage } from '@/server/chat/db/messages';

// GET /api/chat/conversations/[id]/messages
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversationId = params.id;

    // Verify the user is a participant in the conversation
    const participants = await getConversationParticipants(conversationId);
    const isParticipant = participants.some(
      p => p.userId === session.user.id && p.isActive
    );

    if (!isParticipant) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You are not a participant in this conversation' } },
        { status: 403 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const before = url.searchParams.get('before') || undefined;
    const after = url.searchParams.get('after') || undefined;

    // Get messages
    const messages = await getConversationMessages(conversationId, limit, before, after);

    return NextResponse.json({ 
      messages,
      hasMore: messages.length >= limit
    });
  } catch (error) {
    console.error('Error in GET /api/chat/conversations/[id]/messages:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

// POST /api/chat/conversations/[id]/messages
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversationId = params.id;

    // Verify the user is a participant in the conversation
    const participants = await getConversationParticipants(conversationId);
    const isParticipant = participants.some(
      p => p.userId === session.user.id && p.isActive
    );

    if (!isParticipant) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You are not a participant in this conversation' } },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { content, parentId } = body;

    // Validate content
    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Message content is required' } },
        { status: 400 }
      );
    }

    // Create message
    const messageId = uuidv4();
    const now = new Date().toISOString();

    const message = {
      id: messageId,
      conversationId,
      senderId: session.user.id,
      content,
      createdAt: now,
      updatedAt: now,
      isEdited: false,
      parentId: parentId || null
    };

    await saveMessage(message);

    // Add sender info for the response
    const messageWithSender = {
      ...message,
      sender: {
        id: session.user.id,
        username: session.user.name,
        name: session.user.name,
        avatarUrl: session.user.image
      }
    };

    return NextResponse.json({ message: messageWithSender });
  } catch (error) {
    console.error('Error in POST /api/chat/conversations/[id]/messages:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}