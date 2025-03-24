'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useTheme } from '@/contexts/ThemeContext';
import BackToLibrary from '@/components/projects/BackToLibrary';

// Dynamically import the ChatInterface from the chatbot
const ChatInterfaceComponent = dynamic(
    () => import('./ChatInterfaceComponent'),
    {
        loading: () => (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
        ),
        ssr: false
    }
);

export default function ChatInterface() {
    const { data: session } = useSession();
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();
    
    // Only show back button on project page, not on the main app page
    const showBackButton = pathname && !pathname.endsWith('/app');

    // Wait until component is mounted to avoid hydration issues
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="h-screen flex flex-col bg-theme-gradient">
            {/* Only show the back button when not in the main app view */}
            {showBackButton && <BackToLibrary />}
            
            <ChatInterfaceComponent
                user={session?.user || null}
                theme={resolvedTheme}
            />
        </div>
    );
}