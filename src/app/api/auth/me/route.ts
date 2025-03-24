import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ user: null }, { status: 401 });
        }

        return NextResponse.json({ user: session.user });
    } catch (error) {
        console.error('Error in /api/auth/me route:', error);
        return NextResponse.json(
            { error: 'Authentication error' },
            { status: 500 }
        );
    }
}