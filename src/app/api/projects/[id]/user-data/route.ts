import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getProject } from '@/lib/projects/projects';
import { getUserProjectData, updateUserProjectData } from '@/lib/projects/userProjects';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const token = await getToken({ req: request });

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = token.sub as string; // NextAuth uses 'sub' for the user ID
    const project = getProject(params.id);

    if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const data = getUserProjectData(userId, params.id);

    return NextResponse.json({ data });
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const token = await getToken({ req: request });

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = token.sub as string;
    const project = getProject(params.id);

    if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const data = await request.json();

    updateUserProjectData(userId, params.id, data);

    return NextResponse.json({ success: true });
}