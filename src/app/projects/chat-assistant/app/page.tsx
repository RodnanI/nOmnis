'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ChatInterface from '@/components/chatbot/ChatInterface';
import { useSession } from 'next-auth/react';

export default function ChatAssistantAppPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if user is authenticated
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            setIsLoading(false);
        } else if (status === 'loading') {
            // Still loading session, wait
        }
    }, [status, router]);

    if (isLoading || status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <ChatInterface />
        </div>
    );
}