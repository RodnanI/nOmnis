// src/app/api/chat/users/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { searchUsers, getOnlineUsers } from '@/server/chat/db/users';
import { getOnlineUsers as getSocketOnlineUsers } from '@/server/chat/socket/server';

// GET /api/chat/users/search
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the search query from URL parameters
    const url = new URL(request.url);
    const query = url.searchParams.get('q')?.toLowerCase() || '';
    
    // If no query or query is too short, return empty results
    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    // Search for users in our database
    const users = await searchUsers(query, session.user.id);
    
    // Get online status from socket server for more accuracy
    const socketOnlineUserIds = getSocketOnlineUsers();
    
    // Merge with online status from the socket server
    const usersWithUpdatedStatus = users.map(user => ({
      ...user,
      status: socketOnlineUserIds.includes(user.id) ? 'online' : user.status
    }));

    return NextResponse.json({ users: usersWithUpdatedStatus });
  } catch (error) {
    console.error('Error in GET /api/chat/users/search:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}