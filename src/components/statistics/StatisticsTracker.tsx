'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Export the trackStats function so it can be imported by other components
export async function trackEvent(action: string, data: any) {
    try {
        const response = await fetch('/api/statistics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action, data }),
        });
        
        if (!response.ok) {
            console.error('Failed to track statistics:', response.status);
        }
    } catch (error) {
        console.error('Error tracking statistics:', error);
    }
}

// This component automatically tracks project usage without requiring code changes in project components
export default function StatisticsTracker() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [lastPath, setLastPath] = useState<string | null>(null);
    
    // Track project access when path changes
    useEffect(() => {
        if (!session?.user || !pathname) return;
        
        // Skip if path hasn't changed
        if (pathname === lastPath) return;
        setLastPath(pathname);
        
        // Define our three projects
        const projects = [
            { path: '/projects/file-uploader', name: 'File Uploader' },
            { path: '/projects/chat-assistant', name: 'Chat Assistant' },
            { path: '/projects/literary-analysis', name: 'Literary Analysis' },
        ];
        
        // Check if current path is one of our projects
        for (const project of projects) {
            if (pathname.startsWith(project.path)) {
                // Record project access in statistics
                trackEvent('project_accessed', { projectName: project.name });
                break;
            }
        }
    }, [pathname, session, lastPath]);
    
    // Track page visits across the application
    useEffect(() => {
        if (!session?.user || !pathname) return;
        
        // Record general page visit
        trackEvent('page_visited', { path: pathname });
        
        // We'll also start a session timer
        const sessionStart = new Date();
        
        return () => {
            // When component unmounts or path changes, record time spent
            const sessionEnd = new Date();
            const minutes = (sessionEnd.getTime() - sessionStart.getTime()) / 1000 / 60;
            
            if (minutes >= 0.25) { // Only track if at least 15 seconds
                trackEvent('time_spent', { 
                    minutes: minutes, 
                    path: pathname 
                });
            }
        };
    }, [pathname, session]);
    
    return null; // This component doesn't render anything
}