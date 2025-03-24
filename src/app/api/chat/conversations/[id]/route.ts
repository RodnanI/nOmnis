// src/app/api/chat/conversations/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { 
  getConversation, 
  getConversationParticipants,
  updateConversation,
  leaveConversation
} from '@/server/chat/db/conversations';

// GET /api/chat/conversations/[id]
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

    // Get the conversation
    const conversation = await getConversation(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Conversation not found' } },
        { status: 404 }
      );
    }

    // Verify the user is a participant
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

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Error in GET /api/chat/conversations/[id]:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

// PATCH /api/chat/conversations/[id]
export async function PATCH(
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

    // Get the conversation
    const conversation = await getConversation(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Conversation not found' } },
        { status: 404 }
      );
    }

    // Verify the user is a participant with admin role (for group/public)
    const participants = await getConversationParticipants(conversationId);
    const userParticipant = participants.find(
      p => p.userId === session.user.id && p.isActive
    );

    if (!userParticipant) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You are not a participant in this conversation' } },
        { status: 403 }
      );
    }

    // For group or public chats, verify the user is an admin
    if (conversation.type !== 'dm' && userParticipant.role !== 'admin') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Only admins can update this conversation' } },
        { status: 403 }
      );
    }

    // For DMs, don't allow updates
    if (conversation.type === 'dm') {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Direct messages cannot be updated' } },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, avatarUrl } = body;

    // Perform the update
    const updatedConversation = await updateConversation(conversationId, {
      name,
      avatarUrl
    });

    return NextResponse.json({ conversation: updatedConversation });
  } catch (error) {
    console.error('Error in PATCH /api/chat/conversations/[id]:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

// DELETE /api/chat/conversations/[id]
export async function DELETE(
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

    // Get the conversation
    const conversation = await getConversation(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Conversation not found' } },
        { status: 404 }
      );
    }

    // Verify the user is a participant
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

    // Leave the conversation (soft delete)
    await leaveConversation(conversationId, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/chat/conversations/[id]:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}