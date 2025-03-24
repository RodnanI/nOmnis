import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ProjectLayoutWrapper from '@/components/layout/ProjectLayoutWrapper';
import AuthProvider from '@/components/auth/SessionProvider';
import StatisticsTracker from '@/components/statistics/StatisticsTracker';
import ChatIntegration from '@/components/projects/ChatIntegration';
import ChatSocketSetup from '@/components/chat/ChatSocketSetup';
import 'github-markdown-css/github-markdown.css';
import 'prismjs/themes/prism-tomorrow.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Omnis - App Library',
    description: 'Discover and use a variety of web applications and browser games.',
    icons: {
        icon: '/favicon.ico',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body className={`${inter.className} min-h-screen flex flex-col`}>
        <AuthProvider>
            <ThemeProvider>
                <ProjectLayoutWrapper>
                    {children}
                </ProjectLayoutWrapper>
                <StatisticsTracker />
                <ChatIntegration />
                <ChatSocketSetup />
            </ThemeProvider>
        </AuthProvider>
        </body>
        </html>
    );
}