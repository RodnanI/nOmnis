'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { trackEvent } from '@/components/statistics/StatisticsTracker';

export interface UserStatistics {
    totalProjects: number;
    totalHours: number;
    completedTasks: number;
    uploadedFiles: number;
    activityData: Array<{
        name: string;
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

export function useStatistics() {
    const { data: session, status } = useSession();
    const [statistics, setStatistics] = useState<UserStatistics | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    // Function to fetch statistics
    const fetchStatistics = async () => {
        if (status !== 'authenticated') {
            setIsLoading(false);
            return;
        }
        
        try {
            setIsLoading(true);
            const response = await fetch('/api/statistics');
            
            if (!response.ok) {
                throw new Error(`Error fetching statistics: ${response.status}`);
            }
            
            const responseData = await response.json();
            
            // Check if we received the expected data structure
            if (responseData.stats) {
                const rawStats = responseData.stats;
                const projectsData = rawStats.projects || {};
                const projectNames = Object.keys(projectsData);
                
                // Calculate total projects accessed (only count those with non-zero access)
                const totalProjects = Object.values(projectsData)
                    .filter((proj: any) => proj.accessCount > 0)
                    .length;
                
                // Create activity data from page visits
                const activityData = transformPageVisitsToActivity(rawStats.pagesVisited || {});
                
                // Calculate project usage percentages based on access counts
                const projectUsage = projectNames.map(name => {
                    const project = projectsData[name];
                    return {
                        name,
                        usage: project.accessCount || 0
                    };
                });
                
                // Calculate total percentage to normalize
                const totalUsage = projectUsage.reduce((sum, item) => sum + item.usage, 0);
                const normalizedProjectUsage = projectUsage.map(item => ({
                    name: item.name,
                    usage: totalUsage > 0 ? Math.round((item.usage / totalUsage) * 100) : 0
                }));
                
                // Create daily activity heatmap data from project access times
                const dailyActivity = createHeatmapFromAccessData(projectsData);
                
                const processedStats: UserStatistics = {
                    totalProjects: totalProjects,
                    totalHours: Math.round((rawStats.totalTimeSpent || 0) * 10) / 10,
                    completedTasks: rawStats.tasksCompleted || 0,
                    uploadedFiles: rawStats.fileUploads || 0,
                    activityData: activityData,
                    projectUsage: normalizedProjectUsage,
                    dailyActivity: dailyActivity,
                    lastUpdated: rawStats.lastUpdated || new Date().toISOString()
                };
                
                setStatistics(processedStats);
            } else {
                throw new Error('Invalid statistics data received from the server');
            }
            
            setError(null);
        } catch (err) {
            console.error('Failed to fetch statistics:', err);
            setError('Failed to load statistics. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };
    
    // Transform page visit data into activity chart data
    function transformPageVisitsToActivity(pageVisits: Record<string, number>): Array<{name: string; date: string; hours: number; tasks: number}> {
        const now = new Date();
        const result = [];
        
        // Get data for the last 14 days
        for (let i = 13; i >= 0; i--) {
            const date = new Date();
            date.setDate(now.getDate() - i);
            
            const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
            const month = date.getMonth() + 1;
            const day = date.getDate();
            
            // Each page visit contributes to activity
            // We'll consider the total page visits and convert to approximate hours
            // This would ideally be more accurate with actual timestamp data
            const totalVisits = Object.values(pageVisits).reduce((sum, count) => sum + count, 0);
            
            // Assume each visit is about 5 minutes
            const estimatedHours = totalVisits * 5 / 60;
            
            // Distribute hours over days - this is an approximation
            // In a real system, we'd track actual timestamps for each visit
            const dayFactor = i === 0 ? 0.5 : (14 - i) / 14; // More recent days have more activity
            
            result.push({
                name: dayName,
                date: `${month}/${day}`,
                hours: estimatedHours * dayFactor / 14, // Distribute across days
                tasks: Math.ceil(Object.keys(pageVisits).length * dayFactor / 14) // Approximate tasks from unique pages
            });
        }
        
        return result;
    }
    
    // Create a heatmap based on project access times
    function createHeatmapFromAccessData(projectsData: Record<string, any>): Array<{day: string; hour: number; value: number}> {
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const result: Array<{day: string; hour: number; value: number}> = [];
        
        // Initialize the heatmap with zeros
        for (const day of daysOfWeek) {
            for (let hour = 0; hour < 24; hour++) {
                result.push({ day, hour, value: 0 });
            }
        }
        
        // Process each project's last accessed time to increment heatmap
        for (const [projectName, projectData] of Object.entries(projectsData)) {
            if (projectData.lastAccessed && projectData.accessCount > 0) {
                try {
                    const accessTime = new Date(projectData.lastAccessed);
                    const day = daysOfWeek[accessTime.getDay()];
                    const hour = accessTime.getHours();
                    
                    // Find and increment the corresponding heatmap cell
                    const cell = result.find(c => c.day === day && c.hour === hour);
                    if (cell) {
                        cell.value += 1;
                    }
                } catch (error) {
                    console.error('Error processing project access time:', error);
                }
            }
        }
        
        return result;
    }
    
    // Function to track task completion
    const trackTaskCompletion = async () => {
        if (status !== 'authenticated') return;
        
        await trackEvent('task_completed', {});
        fetchStatistics(); // Refresh statistics after tracking
    };
    
    // Function to track file upload
    const trackFileUpload = async () => {
        if (status !== 'authenticated') return;
        
        await trackEvent('file_uploaded', {});
        fetchStatistics(); // Refresh statistics after tracking
    };
    
    // Fetch statistics when session changes
    useEffect(() => {
        if (status === 'authenticated') {
            fetchStatistics();
        } else if (status === 'unauthenticated') {
            setIsLoading(false);
            setStatistics(null);
        }
    }, [status]);
    
    return {
        statistics,
        isLoading,
        error,
        refreshStatistics: fetchStatistics,
        trackTaskCompletion,
        trackFileUpload
    };
}