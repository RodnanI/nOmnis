import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import fs from 'fs';
import path from 'path';

// Define statistics data structure
interface UserStats {
    projects: {
        [projectName: string]: {
            accessCount: number;
            timeSpent: number; // in minutes
            lastAccessed: string;
        };
    };
    fileUploads: number;
    tasksCompleted: number;
    pagesVisited: {
        [path: string]: number;
    };
    totalTimeSpent: number; // in minutes
    lastUpdated: string;
}

// Directory to store stats
const STATS_DIR = path.join(process.cwd(), 'data', 'stats');

// Make sure directory exists
if (!fs.existsSync(STATS_DIR)) {
    fs.mkdirSync(STATS_DIR, { recursive: true });
}

// Get stats for a user
function getUserStats(userId: string): UserStats {
    const statsPath = path.join(STATS_DIR, `${userId}.json`);
    
    if (fs.existsSync(statsPath)) {
        try {
            const statsData = fs.readFileSync(statsPath, 'utf8');
            return JSON.parse(statsData);
        } catch (error) {
            console.error('Error reading stats file:', error);
        }
    }
    
    // Initialize empty stats structure for new users
    return {
        projects: {
            'File Uploader': { accessCount: 0, timeSpent: 0, lastAccessed: new Date().toISOString() },
            'Chat Assistant': { accessCount: 0, timeSpent: 0, lastAccessed: new Date().toISOString() },
            'Literary Analysis': { accessCount: 0, timeSpent: 0, lastAccessed: new Date().toISOString() }
        },
        fileUploads: 0,
        tasksCompleted: 0,
        pagesVisited: {},
        totalTimeSpent: 0,
        lastUpdated: new Date().toISOString()
    };
}

// Save stats for a user
function saveUserStats(userId: string, stats: UserStats): void {
    const statsPath = path.join(STATS_DIR, `${userId}.json`);
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
}

// GET endpoint to retrieve statistics
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const stats = getUserStats(userId);
    
    return NextResponse.json({ stats });
}

// POST endpoint to update statistics
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { action, data } = await request.json();
    
    // Get current stats
    const stats = getUserStats(userId);
    const now = new Date();
    
    // Update stats based on action
    switch (action) {
        case 'project_accessed':
            if (data.projectName && stats.projects[data.projectName]) {
                stats.projects[data.projectName].accessCount += 1;
                stats.projects[data.projectName].lastAccessed = now.toISOString();
            }
            break;
            
        case 'file_uploaded':
            stats.fileUploads += 1;
            break;
            
        case 'task_completed':
            stats.tasksCompleted += 1;
            break;
            
        case 'page_visited':
            if (data.path) {
                stats.pagesVisited[data.path] = (stats.pagesVisited[data.path] || 0) + 1;
            }
            break;
            
        case 'time_spent':
            if (data.minutes && data.path) {
                stats.totalTimeSpent += data.minutes;
                
                // If this time is on a project page, add to project time
                for (const [projectName, projectData] of Object.entries(stats.projects)) {
                    const projectPath = `/projects/${projectName.toLowerCase().replace(/\s+/g, '-')}`;
                    if (data.path.startsWith(projectPath)) {
                        stats.projects[projectName].timeSpent += data.minutes;
                        break;
                    }
                }
            }
            break;
    }
    
    // Update last updated timestamp
    stats.lastUpdated = now.toISOString();
    
    // Save updated stats
    saveUserStats(userId, stats);
    
    return NextResponse.json({ success: true });
}