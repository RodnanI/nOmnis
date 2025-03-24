// src/app/api/chat/conversations/[id]/read/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getConversationParticipants } from '@/server/chat/db/conversations';
import { markMessagesAsRead } from '@/server/chat/db/readReceipts';

// POST /api/chat/conversations/[id]/read
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
    const { messageId } = body;

    if (!messageId) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Message ID is required' } },
        { status: 400 }
      );
    }

    // Mark messages as read
    const readAt = new Date().toISOString();
    await markMessagesAsRead(conversationId, session.user.id, messageId, readAt);

    return NextResponse.json({
      success: true,
      conversationId,
      userId: session.user.id,
      readUpTo: messageId,
      readAt
    });
  } catch (error) {
    console.error('Error in POST /api/chat/conversations/[id]/read:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}