// src/app/api/chat/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getOnlineUsers } from '@/server/chat/db/users';
import { getOnlineUsers as getSocketOnlineUsers } from '@/server/chat/socket/server';

// GET /api/chat/users
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get users who are online in the database
    const databaseOnlineUsers = await getOnlineUsers();
    
    // Get socket-based online users (more accurate real-time status)
    const socketOnlineUserIds = getSocketOnlineUsers();
    
    // Merge the two sources with socket status taking precedence
    const users = databaseOnlineUsers.map(user => ({
      ...user,
      status: socketOnlineUserIds.includes(user.id) ? 'online' : user.status
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error in GET /api/chat/users:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}