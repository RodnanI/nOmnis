// src/app/api/chat/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getAllUsers } from '@/server/chat/db/users';

// GET /api/chat/users
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all registered users
    const users = await getAllUsers();
    
    // Remove current user from the list
    const filteredUsers = users.filter(user => user.id !== session.user.id);

    return NextResponse.json({ users: filteredUsers });
  } catch (error) {
    console.error('Error in GET /api/chat/users:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}