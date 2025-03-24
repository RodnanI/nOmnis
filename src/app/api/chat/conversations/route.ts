// src/app/api/chat/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getUserConversations, createConversation } from '@/server/chat/db/conversations';
import { ConversationType } from '@/types/chat';

// GET /api/chat/conversations
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const type = url.searchParams.get('type') as ConversationType | null;

    // Get conversations for the user
    const conversations = await getUserConversations(session.user.id, limit, offset);

    // Filter by type if provided
    const filteredConversations = type
      ? conversations.filter(conv => conv.type === type)
      : conversations;

    return NextResponse.json({ 
      conversations: filteredConversations,
      total: filteredConversations.length,
      hasMore: filteredConversations.length >= limit
    });
  } catch (error) {
    console.error('Error in GET /api/chat/conversations:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, 
      { status: 500 }
    );
  }
}

// POST /api/chat/conversations
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { type, participantIds, name, avatarUrl } = body;

    // Validate request
    if (!type || !participantIds || !Array.isArray(participantIds)) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Missing required fields' } },
        { status: 400 }
      );
    }

    // Validate conversation type
    if (!['dm', 'group', 'public'].includes(type)) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Invalid conversation type' } },
        { status: 400 }
      );
    }

    // For direct messages, handle special validation and creation
    if (type === 'dm') {
      if (participantIds.length !== 1) {
        return NextResponse.json(
          { error: { code: 'BAD_REQUEST', message: 'Direct messages must have exactly one recipient' } },
          { status: 400 }
        );
      }

      const otherUserId = participantIds[0];
      
      // Create DM conversation
      const conversation = await createConversation(
        'dm',
        session.user.id,
        [otherUserId],
        null,
        null
      );

      return NextResponse.json({ conversation });
    } else {
      // For group or public, name is required
      if (!name) {
        return NextResponse.json(
          { error: { code: 'BAD_REQUEST', message: 'Name is required for group and public conversations' } },
          { status: 400 }
        );
      }

      // Create group or public conversation
      const conversation = await createConversation(
        type as ConversationType,
        session.user.id,
        participantIds,
        name,
        avatarUrl
      );

      return NextResponse.json({ conversation });
    }
  } catch (error) {
    console.error('Error in POST /api/chat/conversations:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}