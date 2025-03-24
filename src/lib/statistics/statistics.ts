import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Define the structure of our statistics data
export interface UserStatistics {
    totalProjects: number;
    totalHours: number;
    completedTasks: number;
    uploadedFiles: number;
    activityData: Array<{
        date: string;
        hours: number;
        tasks: number;
    }>;
    projectUsage: Array<{
        name: string;
        usage: number;
    }>;
    dailyActivity: Array<{
        day: string;
        hour: number;
        value: number;
    }>;
    lastUpdated: string;
}

// Define the structure for the daily activity data point
interface DailyActivityPoint {
    day: string;
    hour: number;
    value: number;
}

const DATA_DIR = path.join(process.cwd(), 'data', 'statistics');

// Ensure data directory exists
function ensureDataDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

// Create default statistics for a new user
function createDefaultStatistics(): UserStatistics {
    // Generate past 14 days of minimal activity
    const activityData = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        
        activityData.push({
            date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
            hours: 0,
            tasks: 0,
        });
    }

    // Default project usage (empty)
    const projectUsage = [
        { name: 'File Uploader', usage: 0 },
        { name: 'Chat Assistant', usage: 0 },
        { name: 'Literary Analysis', usage: 0 }
    ];

    // Default daily activity heatmap data
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyActivity: DailyActivityPoint[] = []; // Fix: Added explicit type
    
    daysOfWeek.forEach(day => {
        for (let hour = 0; hour < 24; hour++) {
            dailyActivity.push({
                day,
                hour,
                value: 0
            });
        }
    });

    return {
        totalProjects: 0,
        totalHours: 0,
        completedTasks: 0,
        uploadedFiles: 0,
        activityData,
        projectUsage,
        dailyActivity,
        lastUpdated: new Date().toISOString()
    };
}

// Get statistics for a specific user
export function getUserStatistics(userId: string): UserStatistics {
    ensureDataDirectory();
    
    const userStatsPath = path.join(DATA_DIR, `${userId}.json`);
    
    if (!fs.existsSync(userStatsPath)) {
        const defaultStats = createDefaultStatistics();
        fs.writeFileSync(userStatsPath, JSON.stringify(defaultStats, null, 2));
        return defaultStats;
    }
    
    try {
        const statsData = fs.readFileSync(userStatsPath, 'utf8');
        return JSON.parse(statsData);
    } catch (error) {
        console.error(`Error reading statistics for user ${userId}:`, error);
        const defaultStats = createDefaultStatistics();
        fs.writeFileSync(userStatsPath, JSON.stringify(defaultStats, null, 2));
        return defaultStats;
    }
}

// Track events and update user statistics
export function updateUserStatistics(
    userId: string,
    event: string,
    data?: any
): void {
    const stats = getUserStatistics(userId);
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];
    const currentHour = now.getHours();
    
    // Update based on event type
    switch (event) {
        case 'project_access':
            if (data?.projectName) {
                // Update total projects if this is a new one
                const projectIndex = stats.projectUsage.findIndex(p => p.name === data.projectName);
                if (projectIndex === -1) {
                    stats.projectUsage.push({ name: data.projectName, usage: 1 });
                    stats.totalProjects += 1;
                } else {
                    stats.projectUsage[projectIndex].usage += 1;
                }
                
                // Update activity data for today
                const todayActivityIndex = stats.activityData.findIndex(a => a.date === today);
                if (todayActivityIndex !== -1) {
                    // Increase hours spent (0.25 hour per project access)
                    stats.activityData[todayActivityIndex].hours += 0.25;
                    stats.totalHours += 0.25;
                }
                
                // Update heatmap data
                const heatmapIndex = stats.dailyActivity.findIndex(
                    a => a.day === currentDay && a.hour === currentHour
                );
                if (heatmapIndex !== -1) {
                    stats.dailyActivity[heatmapIndex].value += 1;
                }
            }
            break;
            
        case 'task_completed':
            stats.completedTasks += 1;
            
            // Update activity data for today
            const todayActivityIndex = stats.activityData.findIndex(a => a.date === today);
            if (todayActivityIndex !== -1) {
                stats.activityData[todayActivityIndex].tasks += 1;
            }
            break;
            
        case 'file_uploaded':
            stats.uploadedFiles += 1;
            break;
            
        case 'session_time':
            if (data?.hours && typeof data.hours === 'number') {
                stats.totalHours += data.hours;
                
                // Update activity data for today
                const todayActivityIndex = stats.activityData.findIndex(a => a.date === today);
                if (todayActivityIndex !== -1) {
                    stats.activityData[todayActivityIndex].hours += data.hours;
                }
                
                // Update heatmap data - spread time across the past hour
                const heatmapIndex = stats.dailyActivity.findIndex(
                    a => a.day === currentDay && a.hour === currentHour
                );
                if (heatmapIndex !== -1) {
                    stats.dailyActivity[heatmapIndex].value += Math.round(data.hours * 4);
                }
            }
            break;
    }
    
    // Make sure we have an entry for today in activity data
    if (!stats.activityData.find(a => a.date === today)) {
        // Remove the oldest day and add today
        stats.activityData.shift();
        stats.activityData.push({
            date: today,
            hours: 0,
            tasks: 0
        });
    }
    
    // Update last updated timestamp
    stats.lastUpdated = new Date().toISOString();
    
    // Save updated statistics
    ensureDataDirectory();
    const userStatsPath = path.join(DATA_DIR, `${userId}.json`);
    fs.writeFileSync(userStatsPath, JSON.stringify(stats, null, 2));
}