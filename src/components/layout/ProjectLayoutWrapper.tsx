'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useEffect, useState } from 'react';

export default function ProjectLayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    // Wait until component is mounted to avoid hydration issues
    useEffect(() => {
        setMounted(true);
    }, []);

    // Check if the current path is a project page that should be rendered without header/footer
    const isChatbotPage = pathname?.includes('/projects/chat-assistant') || pathname?.includes('/projects/chat-assistant/app');
    
    // Consider any path that directly references a specific project as a project page
    // This includes /projects/file-uploader, /projects/literary-analysis, etc.
    const isProjectPage = pathname?.includes('/projects/');
    
    // If it's a project page, don't show header or footer
    const isFullscreenPage = isProjectPage || isChatbotPage;

    if (!mounted) {
        // Return a placeholder during SSR to avoid hydration mismatch
        return <main className="flex-grow">{children}</main>;
    }

    if (isFullscreenPage) {
        // For project pages, don't show header or footer
        return <main className="flex-grow">{children}</main>;
    }

    // For regular pages, show the normal layout
    return (
        <>
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
        </>
    );
}